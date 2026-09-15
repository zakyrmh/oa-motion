export type ReferenceRole = 'admin' | 'sports_expert';

const ALLOWED_ROLES: ReadonlySet<ReferenceRole> = new Set(['admin', 'sports_expert']);

export function getReferenceRole(): ReferenceRole {
  const sessionRole = typeof sessionStorage === 'undefined'
    ? null
    : sessionStorage.getItem('oa_motion_reference_role');
  const configuredRole = import.meta.env.VITE_REFERENCE_ROLE;
  const role = sessionRole ?? configuredRole;
  return ALLOWED_ROLES.has(role as ReferenceRole) ? (role as ReferenceRole) : 'sports_expert';
}

export function hasReferenceRecorderAccess(): boolean {
  return true;
}
