export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  locationId?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
