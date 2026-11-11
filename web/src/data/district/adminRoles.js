/**
 * District / building leadership roles. Admin accounts will map onto these;
 * kept here as product context until invites carry a specific title.
 */
export const ADMIN_ROLES = [
  { id: 'superintendent', label: 'Superintendent', scope: 'district' },
  { id: 'chiefOfSchools', label: 'Chief of Schools', scope: 'district' },
  { id: 'principal', label: 'Principal', scope: 'school' },
  { id: 'assistantPrincipal', label: 'Assistant Principal', scope: 'school' },
  { id: 'coach', label: 'Coach', scope: 'school' },
  { id: 'departmentLead', label: 'Department lead', scope: 'district' },
];

export function adminRoleLabel(roleId) {
  return ADMIN_ROLES.find((role) => role.id === roleId)?.label || 'District leader';
}
