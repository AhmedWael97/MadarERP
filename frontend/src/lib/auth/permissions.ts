export type Action = 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'print' | 'export';

export type PermissionMap = Record<string, Set<Action>>;

interface BootUser {
  can_read?: string[];
  can_write?: string[];
  can_create?: string[];
  can_delete?: string[];
  can_submit?: string[];
  can_cancel?: string[];
  can_print?: string[];
  can_export?: string[];
}

const KEYS: Array<[Action, keyof BootUser]> = [
  ['read', 'can_read'],
  ['write', 'can_write'],
  ['create', 'can_create'],
  ['delete', 'can_delete'],
  ['submit', 'can_submit'],
  ['cancel', 'can_cancel'],
  ['print', 'can_print'],
  ['export', 'can_export'],
];

export function buildPermissionMap(user: BootUser): PermissionMap {
  const map: PermissionMap = {};
  for (const [action, key] of KEYS) {
    for (const dt of user[key] ?? []) {
      (map[dt] ??= new Set()).add(action);
    }
  }
  return map;
}
