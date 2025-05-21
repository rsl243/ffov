'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import Modal from '../Modal';
import { Location } from '../../types/organization';

interface LocationManagerProps {
  organizationId: string;
  subscriptionType: 'VILLE' | 'REGION' | 'PAYS';
  locations: Location[];
  onAddLocation: (data: { name: string; address: any }) => Promise<void>;
  onUpdateLocation: (id: string, data: Partial<Location>) => Promise<void>;
}

export function LocationManager({
  organizationId,
  subscriptionType,
  locations,
  onAddLocation,
  onUpdateLocation,
}: LocationManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'France',
    additionalInfo: '',
  });

  const [editLocationData, setEditLocationData] = useState({
    name: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'France',
    additionalInfo: '',
  });

  const canAddLocation = subscriptionType === 'REGION' || 
                        subscriptionType === 'PAYS' || 
                        (subscriptionType === 'VILLE' && locations.length < 3);

  const handleEditLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    try {
      await onUpdateLocation(selectedLocation.id, {
        name: editLocationData.name,
        street: editLocationData.street,
        city: editLocationData.city,
        postalCode: editLocationData.postalCode,
        country: editLocationData.country,
        additionalInfo: editLocationData.additionalInfo || undefined,
      });
      setShowEditModal(false);
    } catch (error) {
      console.error('Erreur lors de la modification de l\'emplacement:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddLocation({
        name: formData.name,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          additionalInfo: formData.additionalInfo,
        },
      });
      setShowAddModal(false);
      setFormData({
        name: '',
        street: '',
        city: '',
        postalCode: '',
        country: 'France',
        additionalInfo: '',
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'emplacement:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Emplacements</h2>
          {subscriptionType === 'VILLE' && (
            <p className="text-sm text-gray-500">
              {3 - locations.length} emplacement(s) restant(s) sur 3
            </p>
          )}
          {subscriptionType === 'REGION' && (
            <p className="text-sm text-gray-500">
              Emplacements illimités dans votre région
            </p>
          )}
          {subscriptionType === 'PAYS' && (
            <p className="text-sm text-gray-500">
              Emplacements illimités dans tout le pays
            </p>
          )}
        </div>
        {canAddLocation && (
          <Button onClick={() => setShowAddModal(true)}>
            Ajouter un emplacement
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <Card key={location.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{location.name}</h3>
                <p className="text-sm text-gray-600">{location.street}</p>
                <p className="text-sm text-gray-600">
                  {location.postalCode} {location.city}
                </p>
                <p className="text-sm text-gray-600">{location.country}</p>
              </div>
              <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                {location.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedLocation(location);
                  setEditLocationData({
                    name: location.name,
                    street: location.street,
                    city: location.city,
                    postalCode: location.postalCode,
                    country: location.country,
                    additionalInfo: location.additionalInfo || '',
                  });
                  setShowEditModal(true);
                }}
              >
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdateLocation(location.id, {
                    status: location.status === 'active' ? 'inactive' : 'active',
                  });
                }}
              >
                {location.status === 'active' ? 'Désactiver' : 'Activer'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un emplacement"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom de l'emplacement
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rue
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Code postal
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ville
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Informations complémentaires
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              rows={3}
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier l'emplacement"
      >
        <form onSubmit={handleEditLocation} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Nom de l'emplacement
            </label>
            <input
              type="text"
              id="edit-name"
              value={editLocationData.name}
              onChange={(e) =>
                setEditLocationData({ ...editLocationData, name: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-street" className="text-sm font-medium">
              Rue
            </label>
            <input
              type="text"
              id="edit-street"
              value={editLocationData.street}
              onChange={(e) =>
                setEditLocationData({ ...editLocationData, street: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-city" className="text-sm font-medium">
              Ville
            </label>
            <input
              type="text"
              id="edit-city"
              value={editLocationData.city}
              onChange={(e) =>
                setEditLocationData({ ...editLocationData, city: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-postalCode" className="text-sm font-medium">
              Code postal
            </label>
            <input
              type="text"
              id="edit-postalCode"
              value={editLocationData.postalCode}
              onChange={(e) =>
                setEditLocationData({
                  ...editLocationData,
                  postalCode: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-country" className="text-sm font-medium">
              Pays
            </label>
            <input
              type="text"
              id="edit-country"
              value={editLocationData.country}
              onChange={(e) =>
                setEditLocationData({ ...editLocationData, country: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-additionalInfo" className="text-sm font-medium">
              Informations complémentaires
            </label>
            <textarea
              id="edit-additionalInfo"
              value={editLocationData.additionalInfo || ''}
              onChange={(e) =>
                setEditLocationData({
                  ...editLocationData,
                  additionalInfo: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="default">
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
