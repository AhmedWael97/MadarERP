import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FrappeProvider } from 'frappe-react-sdk';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import i18n from '../lib/i18n';
import { TenantProvider, useTenant } from '../lib/tenant/TenantContext';
import { AuthProvider } from '../lib/auth/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, err: any) => {
        if (err?.httpStatus === 401 || err?.httpStatus === 403) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function DirectionSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir(i18n.language);
  }, [i18n.language]);
  return null;
}

function FrappeShell({ children }: { children: ReactNode }) {
  const { apiBase, siteName } = useTenant();
  // Socket.IO is OFF by default in dev because Frappe v15's socketio process can
  // be finicky to bring up in the backend container (separate node process, depends
  // on the bench Procfile). We disabled this rather than rely on a long reconnect
  // loop because the noisy console errors made it look like login itself was broken.
  // Set VITE_SOCKET_ENABLED=true in .env (or frontend's environment) once the
  // backend socketio process is verified to be listening on :9000 — then you get
  // real-time list refresh, notifications, and presence indicators.
  const enableSocket = String(import.meta.env.VITE_SOCKET_ENABLED ?? 'false') === 'true';
  const socketPort = (typeof window !== 'undefined' && window.location.port) || undefined;
  return (
    <FrappeProvider
      url={apiBase}
      siteName={siteName}
      socketPort={socketPort}
      enableSocket={enableSocket}
    >
      <AuthProvider>{children}</AuthProvider>
    </FrappeProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <DirectionSync />
        <QueryClientProvider client={queryClient}>
          <TenantProvider>
            <FrappeShell>{children}</FrappeShell>
          </TenantProvider>
        </QueryClientProvider>
        <Toaster position="top-center" richColors closeButton />
      </I18nextProvider>
    </ErrorBoundary>
  );
}
