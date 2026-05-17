"""Audit every override list page on the server to find references to fields
that don't exist on the underlying doctype. Such references cause Frappe to
reject the entire `get_list` query (DataError: Field not permitted in query)
and the list shows empty even when data is present — the silent-failure mode
that just bit us on /treasury/treasuries.

Run inside the backend container, after a `bench console` shell loaded with
frappe.init done:

    docker compose exec backend bench --site <site> \\
        execute scripts.audit_override_fields.run

Outputs three groups: OK / SKIP (doctype not installed) / BAD (will fail).
"""
from __future__ import annotations

import os
import re

import frappe


REPO_ROOT = "/home/frappe/frappe-bench/sites"  # not used directly — see below
MODULES_DIR = "/opt/madaar-erp/frontend/src/modules"

# Lifted from the FleetEntityList config shape: each override file declares
#   doctype: 'X'
# and a `columns: [{ fieldname: 'y', ... }, ...]` array. We parse those two.
DOCTYPE_RE = re.compile(r"""doctype:\s*['"]([^'"]+)['"]""")
FIELDNAME_RE = re.compile(r"""fieldname:\s*['"]([^'"]+)['"]""")
SEARCH_FIELD_RE = re.compile(r"""searchField:\s*['"]([^'"]+)['"]""")
DATE_FIELD_RE = re.compile(r"""dateField:\s*['"]([^'"]+)['"]""")


def _collect_override_files(root: str) -> list[str]:
    out: list[str] = []
    for dirpath, _, files in os.walk(root):
        if not dirpath.endswith(os.sep + "overrides") and not dirpath.endswith("/overrides"):
            continue
        for fn in files:
            if fn == "page.tsx":
                out.append(os.path.join(dirpath, fn))
    return out


def run() -> None:
    print("Madaar override-fields audit")
    print(f"Scanning {MODULES_DIR}")
    files = _collect_override_files(MODULES_DIR)
    print(f"Found {len(files)} override page.tsx files")

    ok: list[str] = []
    skip: list[tuple[str, str, str]] = []
    bad: list[tuple[str, str, str, list[str]]] = []

    for p in files:
        rel = p.replace(MODULES_DIR, "").lstrip(os.sep).replace(os.sep, "/")
        src = open(p, encoding="utf-8").read()
        m_dt = DOCTYPE_RE.search(src)
        if not m_dt:
            # Pure re-export file ("export { default } from '...'") — skip.
            continue
        doctype = m_dt.group(1)
        # All distinct field references this override mentions.
        refs = sorted(set(FIELDNAME_RE.findall(src)))
        search_field = (SEARCH_FIELD_RE.search(src) or [None, None])[1]
        date_field = (DATE_FIELD_RE.search(src) or [None, None])[1]
        for extra in (search_field, date_field):
            if extra and extra not in refs:
                refs.append(extra)

        if not frappe.db.exists("DocType", doctype):
            skip.append((rel, doctype, "doctype not installed"))
            continue

        # Build the field set the doctype actually exposes (own fields + Custom
        # Fields + the standard "name" / metadata columns Frappe always allows).
        own = {f.fieldname for f in frappe.get_meta(doctype).fields if f.fieldname}
        # Custom fields are already merged into get_meta in modern Frappe, but
        # the fields with `print_hide` etc. still appear. Keep simple.
        always_ok = {"name", "owner", "creation", "modified", "modified_by", "docstatus", "idx"}
        valid = own | always_ok

        missing = [r for r in refs if r and r not in valid and not r.startswith("__")]
        if missing:
            bad.append((rel, doctype, ", ".join(missing), sorted(valid)))
        else:
            ok.append(rel)

    print()
    print(f"OK   : {len(ok)}")
    print(f"SKIP : {len(skip)}  (doctype not on this site)")
    print(f"BAD  : {len(bad)}   (will silently empty the list)")
    print()
    if bad:
        print("=== broken overrides ===")
        for rel, dt, missing, valid in bad:
            print(f"\n  {dt}    {rel}")
            print(f"    missing : {missing}")
            print(f"    valid   : {', '.join(valid)[:200]}")
    if skip:
        print("\n=== skipped (doctype missing) ===")
        for rel, dt, why in skip:
            print(f"  {dt:40s} {rel}")
