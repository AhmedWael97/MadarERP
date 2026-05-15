import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useFrappeAuth, useFrappeGetCall } from 'frappe-react-sdk';
import type { Action, PermissionMap } from './permissions';
import { buildPermissionMap } from './permissions';

export interface AuthUser {
  name: string;
  email: string;
  fullName?: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  permMap: PermissionMap;
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'error';
  login: (usr: string, pwd: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (doctype: string, action: Action) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface BootstrapResponse {
  message?: {
    tenant_id: string | null;
    package: string | null;
    features: Array<{ key: string; limit: number; period: string; used: number }>;
    user: {
      name: string;
      full_name?: string;
      language?: string;
      roles?: string[];
      can_read?: string[];
      can_write?: string[];
      can_create?: string[];
      can_delete?: string[];
      can_submit?: string[];
      can_cancel?: string[];
      can_print?: string[];
      can_export?: string[];
    };
    branding?: { logo?: string | null; primary_color?: string };
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { currentUser, login: sdkLogin, logout: sdkLogout, isLoading } = useFrappeAuth();
  const [permMap, setPermMap] = useState<PermissionMap>({});
  const [user, setUser] = useState<AuthUser | null>(null);

  // Our own bootstrap endpoint — frappe.boot.get_bootinfo is not whitelisted for REST.
  const { data: boot } = useFrappeGetCall<BootstrapResponse>(
    'madaar_core.api.bootstrap',
    undefined,
    currentUser ? 'madaar-boot' : null,
  );

  useEffect(() => {
    const u = boot?.message?.user;
    if (!u) return;
    setUser({
      name: u.name,
      email: u.name,
      fullName: u.full_name,
      roles: u.roles ?? [],
    });
    setPermMap(buildPermissionMap(u));
  }, [boot]);

  useEffect(() => {
    if (!currentUser) {
      setUser(null);
      setPermMap({});
    }
  }, [currentUser]);

  const login = useCallback(
    async (usr: string, pwd: string) => {
      await sdkLogin({ username: usr, password: pwd });
    },
    [sdkLogin],
  );

  const logout = useCallback(async () => {
    await sdkLogout();
  }, [sdkLogout]);

  const can = useCallback(
    (doctype: string, action: Action) => Boolean(permMap[doctype]?.has(action)),
    [permMap],
  );

  const status: AuthContextValue['status'] = isLoading
    ? 'loading'
    : currentUser
      ? 'authenticated'
      : 'anonymous';

  const value = useMemo<AuthContextValue>(
    () => ({ user, permMap, status, login, logout, can }),
    [user, permMap, status, login, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
