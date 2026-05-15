export interface TenantInfo {
  tenant: string | null;
  isControlPlane: boolean;
  apiBase: string;
  socketBase: string;
  /** Frappe site name (hostname without port). Required for v15+ Socket.IO. */
  siteName: string;
}

export function detectTenant(): TenantInfo {
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const root = import.meta.env.VITE_ROOT_DOMAIN || 'localhost';
  const override = import.meta.env.VITE_TENANT_OVERRIDE as string | undefined;

  let sub: string | null = null;

  if (host && host !== root) {
    if (host.endsWith(`.${root}`)) {
      sub = host.slice(0, -1 - root.length);
    } else {
      // Bare hostname like "localhost:5173" — fall through to override.
      sub = null;
    }
  }

  if (!sub && override) {
    sub = override;
  }

  const isControlPlane = sub === 'app' || sub === 'admin';
  const tenant = isControlPlane ? null : sub;

  // The Vite dev proxy forwards /api → backend, so same-origin works in dev.
  // In production each subdomain resolves directly to its Frappe site.
  const apiBase = typeof window !== 'undefined' ? window.location.origin : '';
  const socketBase = import.meta.env.VITE_SOCKET_URL || apiBase.replace(/:\d+$/, ':9000');

  const siteName = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  return { tenant, isControlPlane, apiBase, socketBase, siteName };
}
