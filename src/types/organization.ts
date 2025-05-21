// Types pour la gestion des organisations et emplacements
export type SubscriptionType = 'VILLE' | 'REGION' | 'PAYS';

export type UserRole = 'SIEGE' | 'MANAGER' | 'VENDEUR';

export type ValidationStatus = 'DRAFT' | 'PENDING' | 'VALIDATED' | 'REJECTED';

export interface Organization {
  id: string;
  name: string;
  subscriptionType: SubscriptionType;
  region?: string;
  status: ValidationStatus;
  siret: string;
  vatNumber?: string;
  legalAddress: string;
  contactEmail: string;
  contactPhone: string;
  documents?: Document[];
  locations?: Location[];
  users?: OrganizationUser[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
  users?: OrganizationUser[];
}

export interface OrganizationUser {
  id: string;
  organizationId: string;
  locationId?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
  location?: Location;
}

export interface Document {
  id: string;
  organizationId: string;
  type: string;
  filename: string;
  path: string;
  uploadedAt: Date;
  validatedAt?: Date;
  organization: Organization;
}

export interface ValidationHistory {
  id: string;
  organizationId: string;
  status: ValidationStatus;
  comment?: string;
  validatedBy: string;
  createdAt: Date;
  organization: Organization;
}

// DTOs pour la création/modification
export interface CreateOrganizationDTO {
  name: string;
  subscriptionType: SubscriptionType;
  region?: string;
  siret: string;
  vatNumber?: string;
  legalAddress: string;
  contactEmail: string;
  contactPhone: string;
}

export interface UploadDocumentDTO {
  organizationId: string;
  type: string;
  file: File;
}

export interface UpdateOrganizationStatusDTO {
  organizationId: string;
  status: ValidationStatus;
  comment?: string;
  validatedBy: string;
}

export interface CreateLocationDTO {
  organizationId: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
}

export interface CreateOrganizationUserDTO {
  organizationId: string;
  locationId?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
