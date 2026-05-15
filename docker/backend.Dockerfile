ARG ERPNEXT_BASE_IMAGE=frappe/erpnext:v15
FROM ${ERPNEXT_BASE_IMAGE}

# Previously we apt-installed netcat-openbsd here so the entrypoint could probe
# port availability with `nc`. Removed — the entrypoint now uses bash's built-in
# `/dev/tcp/host/port` redirect, which needs no external tool and survives offline
# / proxied build environments (the apt-get update was failing on networks that
# can't reach deb.debian.org).

USER frappe
WORKDIR /home/frappe/frappe-bench

# Custom apps copied at build time. In compose we ALSO bind-mount each madaar_*
# app over the same path so dev edits are live; the COPY here is what production
# builds use (when no bind mount is in play).
COPY --chown=frappe:frappe madaar-apps/madaar_core /home/frappe/frappe-bench/apps/madaar_core
COPY --chown=frappe:frappe madaar-apps/madaar_construction /home/frappe/frappe-bench/apps/madaar_construction
COPY --chown=frappe:frappe madaar-apps/madaar_fleet /home/frappe/frappe-bench/apps/madaar_fleet
COPY --chown=frappe:frappe madaar-apps/madaar_workshop /home/frappe/frappe-bench/apps/madaar_workshop
COPY --chown=frappe:frappe madaar-apps/madaar_restaurant /home/frappe/frappe-bench/apps/madaar_restaurant
COPY --chown=frappe:frappe madaar-apps/madaar_logistics /home/frappe/frappe-bench/apps/madaar_logistics
COPY --chown=frappe:frappe madaar-apps/madaar_ecommerce /home/frappe/frappe-bench/apps/madaar_ecommerce
COPY --chown=frappe:frappe madaar-apps/madaar_egov_tax /home/frappe/frappe-bench/apps/madaar_egov_tax

# Install every madaar_* app into the bench virtualenv. The entrypoint will
# self-heal sites/apps.txt at boot — we don't write to it from the Dockerfile
# because the entrypoint's logic is authoritative (it only registers apps
# whose pip install actually succeeded).
RUN for app in madaar_core madaar_construction madaar_fleet madaar_workshop madaar_restaurant madaar_logistics madaar_ecommerce madaar_egov_tax; do \
      /home/frappe/frappe-bench/env/bin/pip install --no-cache-dir -e "/home/frappe/frappe-bench/apps/${app}" || \
        { echo "pip install ${app} FAILED at build time"; exit 1; }; \
    done

COPY --chown=frappe:frappe docker/entrypoint.backend.sh /usr/local/bin/madaar-entrypoint.sh
USER root
RUN chmod +x /usr/local/bin/madaar-entrypoint.sh
USER frappe

ENTRYPOINT ["/usr/local/bin/madaar-entrypoint.sh"]
