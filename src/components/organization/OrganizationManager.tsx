'use client';

import { useState } from 'react';
import { Organization, OrganizationUser } from '../../types/organization';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs } from '../ui/tabs';
import { LocationManager } from './LocationManager';
import { RegionSelector } from './RegionSelector';

interface OrganizationManagerProps {
  organization: Organization & {
    users: OrganizationUser[];
  };
  onUpdateOrganization: (data: Partial<Organization>) => Promise<void>;
  onAddLocation: (data: { name: string; address: any }) => Promise<void>;
  onUpdateLocation: (id: string, data: any) => Promise<void>;
  onAddUser: (data: { email: string; role: string; locationId?: string }) => Promise<void>;
}

export function OrganizationManager({
  organization,
  onUpdateOrganization,
  onAddLocation,
  onUpdateLocation,
  onAddUser,
}: OrganizationManagerProps) {
  const [activeTab, setActiveTab] = useState('locations');
  const [isEditingRegion, setIsEditingRegion] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const handleRegionChange = async (region: string) => {
    await onUpdateOrganization({ region });
    setIsEditingRegion(false);
  };

  const tabs = [
    {
      id: 'locations',
      label: 'Emplacements',
      content: (
        <div className="space-y-6">
          {organization.subscriptionType === 'REGION' && (
            <Card className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Région d'activité</h3>
                  {!isEditingRegion ? (
                    <p className="text-gray-600">
                      {organization.region || 'Aucune région sélectionnée'}
                    </p>
                  ) : (
                    <RegionSelector
                      selectedRegion={organization.region}
                      onRegionChange={handleRegionChange}
                      subscriptionType={organization.subscriptionType}
                      disabled={organization.status === 'VALIDATED'}
                    />
                  )}
                </div>
                {organization.status !== 'VALIDATED' && !isEditingRegion && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingRegion(true)}
                  >
                    Modifier la région
                  </Button>
                )}
              </div>
            </Card>
          )}
          <LocationManager
            organizationId={organization.id}
            subscriptionType={organization.subscriptionType as 'VILLE' | 'REGION' | 'PAYS'}
            locations={organization.locations || []}
            onAddLocation={onAddLocation}
            onUpdateLocation={onUpdateLocation}
          />
        </div>
      ),
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Utilisateurs</h2>
            <Button onClick={() => setShowAddUserModal(true)}>
              Ajouter un utilisateur
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organization.users.map((user: OrganizationUser) => (
              <Card key={user.id} className="p-4">
                <div>
                  <h3 className="font-semibold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-600">{user.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'settings',
      label: 'Paramètres',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Paramètres de l'organisation</h2>
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Informations générales</h3>
                <p className="text-sm text-gray-600">Nom : {organization.name}</p>
                <p className="text-sm text-gray-600">
                  Type d'abonnement : {organization.subscriptionType}
                </p>
                {organization.subscriptionType === 'REGION' && (
                  <p className="text-sm text-gray-600">
                    Région : {organization.region}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold">Limites</h3>
                <p className="text-sm text-gray-600">
                  {organization.subscriptionType === 'VILLE' && 'Maximum 3 boutiques'}
                  {organization.subscriptionType === 'REGION' && 'Boutiques illimitées dans la région'}
                  {organization.subscriptionType === 'PAYS' && 'Boutiques illimitées dans le pays'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Commission</h3>
                <p className="text-sm text-gray-600">
                  {organization.subscriptionType === 'VILLE' && '1.5% HT par vente'}
                  {organization.subscriptionType === 'REGION' && '2.5% HT à partir de 5000€ de CA par mois'}
                  {organization.subscriptionType === 'PAYS' && '2.5% HT par vente'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        {tabs.map((tab) => (
          <div key={tab.id} data-value={tab.id}>
            {tab.content}
          </div>
        ))}
      </Tabs>
    </div>
  );
}
