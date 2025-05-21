import { prisma } from '../prisma';
import type {
  Organization,
  Location,
  OrganizationUser,
  Document,
  ValidationHistory,
  CreateOrganizationDTO,
  CreateLocationDTO,
  CreateOrganizationUserDTO,
  UploadDocumentDTO,
  UpdateOrganizationStatusDTO,
  ValidationStatus,
  SubscriptionType,
  UserRole,
} from '@/types/organization';

interface OrganizationWithDetails extends Organization {
  locations: (Location & { users: OrganizationUser[] })[];
  users: OrganizationUser[];
  documents: Document[];
}

interface LocationWithDetails extends Location {
  organization: Organization;
  users: OrganizationUser[];
}

export class OrganizationService {
  // Création d'une organisation (siège régional)
  static async createOrganization(data: CreateOrganizationDTO): Promise<Organization> {
    const organization = await (prisma as any).organization.create({
      data: {
        name: data.name,
        subscriptionType: data.subscriptionType,
        region: data.region,
        status: 'DRAFT',
        siret: data.siret,
        vatNumber: data.vatNumber,
        legalAddress: data.legalAddress,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      },
      include: {
        locations: true,
        users: true,
        documents: true,
      },
    }) as Organization;

    return organization;
  }

  // Création d'un emplacement
  static async createLocation(data: CreateLocationDTO): Promise<Location> {
    // Vérifier que l'organisation existe
    const organization = await (prisma as any).organization.findUnique({
      where: { id: data.organizationId },
      include: {
        locations: true,
        users: true,
      },
    }) as Organization & {
      locations: Location[];
      users: OrganizationUser[];
    };

    if (!organization) {
      throw new Error('Organisation non trouvée');
    }

    const location = await (prisma as any).location.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        additionalInfo: data.additionalInfo,
        status: 'active',
      },
      include: {
        organization: true,
      },
    }) as Location & {
      organization: Organization;
    };

    return {
      ...location,
      organization: {
        ...organization,
        subscriptionType: organization.subscriptionType,
        locations: organization.locations || [],
        users: organization.users || [],
      },
    };
  }

  // Création d'un utilisateur dans l'organisation
  static async createOrganizationUser(data: CreateOrganizationUserDTO): Promise<OrganizationUser> {
    const user = await (prisma as any).organizationUser.create({
      data: {
        organizationId: data.organizationId,
        locationId: data.locationId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      include: {
        organization: true,
        location: {
          include: {
            organization: true,
          },
        },
      },
    }) as OrganizationUser & {
      organization: Organization;
      location: (Location & { organization: Organization }) | null;
    };

    return {
      ...user,
      role: user.role,
      organization: {
        ...user.organization,
        subscriptionType: user.organization.subscriptionType,
        locations: user.organization.locations || [],
        users: user.organization.users || [],
      },
      location: user.location ? {
        ...user.location,
        organization: {
          ...user.location.organization,
          subscriptionType: user.location.organization.subscriptionType,
          locations: user.location.organization.locations || [],
          users: user.location.organization.users || [],
        },
      } : undefined,
    };
  }

  // Obtenir une organisation avec ses emplacements et utilisateurs
  static async getOrganizationWithDetails(id: string): Promise<OrganizationWithDetails | null> {
    const organization = await (prisma as any).organization.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            users: true,
          },
        },
        users: {
          include: {
            location: true,
          },
        },
        documents: true,
      },
    }) as OrganizationWithDetails | null;

    return organization;
  }

  // Obtenir une organisation avec ses emplacements
  static async getOrganizationWithLocations(id: string): Promise<Organization | null> {
    const organization = await (prisma as any).organization.findUnique({
      where: { id },
      include: {
        locations: true,
        users: true,
      },
    }) as Organization | null;

    return organization;
  }

  // Obtenir un emplacement avec ses utilisateurs
  static async getLocation(id: string): Promise<Location | null> {
    const location = await (prisma as any).location.findUnique({
      where: { id },
      include: {
        organization: true,
        users: true,
      },
    }) as (Location & {
      organization: Organization;
      users: OrganizationUser[];
    }) | null;

    if (!location) return null;

    return {
      ...location,
      organization: {
        ...location.organization,
        subscriptionType: location.organization.subscriptionType,
        locations: location.organization.locations || [],
        users: location.organization.users || [],
      },
      users: location.users.map((user: OrganizationUser) => ({
        ...user,
        role: user.role,
        organization: {
          ...location.organization,
          subscriptionType: location.organization.subscriptionType,
          locations: location.organization.locations || [],
          users: location.organization.users || [],
        },
      })),
    };  
  }
}
