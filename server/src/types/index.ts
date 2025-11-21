export type OrgRole = 'owner' | 'admin' | 'viewer' | 'superadmin';

export interface AuthUser {
  id: string;
  organisationId: string;
  role: OrgRole;
  email: string;
}
