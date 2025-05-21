"use client";

/** @jsxImportSource react */

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiInfo, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';
import Link from 'next/link';
import { SubscriptionPlan, PlanInfo, pricingPlans } from '@/lib/userPlan';
import { getCurrentUser } from '@/lib/authUtils';

// Interface pour les emplacements
interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  region: string;
  manager: string;
  status: 'active' | 'inactive';
}

// Interface pour l'offre tarifaire est importée depuis @/lib/userPlan

export default function EmplacementsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('ville');
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  
  // Formulaire
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    region: '',
    manager: '',
    status: 'active' as 'active' | 'inactive'
  });
  
  // Charger le plan tarifaire de l'utilisateur
  useEffect(() => {
    const loadSubscriptionPlan = async () => {
      try {
        // Récupérer l'utilisateur et son plan depuis le localStorage
        const user = getCurrentUser();
        if (user && user.selectedPlan) {
          setCurrentPlan(user.selectedPlan);
          
          // Récupérer les informations du plan
          const planInfo = pricingPlans[user.selectedPlan];
          setPlanInfo(planInfo);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du plan tarifaire:', error);
      }
    };
    
    loadSubscriptionPlan();
  }, []);
  
  // Charger les emplacements
  useEffect(() => {
    const loadLocations = async () => {
      try {
        // Simuler un appel API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Données fictives pour la démo
        const demoLocations: Location[] = [
          {
            id: '1',
            name: 'Boutique Centre-Ville',
            address: '15 rue du Commerce',
            city: 'Lyon',
            postalCode: '69002',
            region: 'Auvergne-Rhône-Alpes',
            manager: 'Jean Dupont',
            status: 'active'
          },
          {
            id: '2',
            name: 'Boutique Bellecour',
            address: '5 place Bellecour',
            city: 'Lyon',
            postalCode: '69002',
            region: 'Auvergne-Rhône-Alpes',
            manager: 'Marie Martin',
            status: 'active'
          },
          {
            id: '3',
            name: 'Boutique Part-Dieu',
            address: '17 rue du Docteur Bouchut',
            city: 'Lyon',
            postalCode: '69003',
            region: 'Auvergne-Rhône-Alpes',
            manager: 'Pierre Durand',
            status: 'inactive'
          }
        ];
        
        setLocations(demoLocations);
      } catch (error) {
        console.error('Erreur lors du chargement des emplacements:', error);
        setErrorMessage('Erreur lors du chargement des emplacements. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    loadLocations();
  }, []);
  
  // Gérer le changement des champs du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Vérifier si l'utilisateur peut ajouter un nouvel emplacement
  const canAddLocation = () => {
    if (!planInfo) return false;
    
    // Si le plan a une limite d'emplacements, vérifier si elle est atteinte
    if (planInfo.maxLocations !== null && locations.length >= planInfo.maxLocations) {
      return false;
    }
    
    return true;
  };
  
  // Ouvrir le modal d'ajout
  const handleOpenAddModal = () => {
    // Vérifier si l'utilisateur peut ajouter un nouvel emplacement
    if (!canAddLocation()) {
      setErrorMessage(`Vous avez atteint la limite d'emplacements pour votre offre ${planInfo?.name}. Passez à une offre supérieure pour ajouter plus d'emplacements.`);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    
    setFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      region: '',
      manager: '',
      status: 'active'
    });
    setShowAddModal(true);
  };
  
  // Ouvrir le modal d'édition
  const handleOpenEditModal = (location: Location) => {
    setCurrentLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      postalCode: location.postalCode,
      region: location.region,
      manager: location.manager,
      status: location.status
    });
    setShowEditModal(true);
  };
  
  // Ouvrir le modal de suppression
  const handleOpenDeleteModal = (location: Location) => {
    setCurrentLocation(location);
    setShowDeleteModal(true);
  };
  
  // Obtenir la région principale des emplacements existants (pour l'offre RÉGION)
  const getPrimaryRegion = () => {
    if (currentPlan !== 'region' || locations.length === 0) return null;
    
    // Compter les occurrences de chaque région
    const regionCounts: Record<string, number> = {};
    
    locations.forEach(location => {
      if (!regionCounts[location.region]) {
        regionCounts[location.region] = 0;
      }
      regionCounts[location.region]++;
    });
    
    // Trouver la région la plus fréquente
    let primaryRegion = '';
    let maxCount = 0;
    
    Object.entries(regionCounts).forEach(([region, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryRegion = region;
      }
    });
    
    return primaryRegion;
  };
  
  // Ajouter un emplacement
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.name || !formData.address || !formData.city || !formData.postalCode) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    // Vérifier les restrictions de région pour l'offre RÉGION
    if (currentPlan === 'region' && planInfo?.regionRestriction) {
      const primaryRegion = getPrimaryRegion();
      
      // Si des emplacements existent déjà et que la région est différente
      if (primaryRegion && formData.region !== primaryRegion) {
        setErrorMessage(`Avec l'offre RÉGION, tous vos emplacements doivent être dans la même région: ${primaryRegion}`);
        return;
      }
    }
    
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Créer un nouvel emplacement
      const newLocation: Location = {
        id: Date.now().toString(),
        name: formData.name,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        region: formData.region,
        manager: formData.manager,
        status: formData.status
      };
      
      // Ajouter à la liste
      setLocations(prev => [...prev, newLocation]);
      
      // Fermer le modal et afficher un message de succès
      setShowAddModal(false);
      setSuccessMessage('Emplacement ajouté avec succès.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'emplacement:', error);
      setErrorMessage('Erreur lors de l\'ajout de l\'emplacement. Veuillez réessayer.');
    }
  };
  
  // Modifier un emplacement
  const handleEditLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentLocation) return;
    
    // Validation basique
    if (!formData.name || !formData.address || !formData.city || !formData.postalCode) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    // Vérifier les restrictions de région pour l'offre RÉGION
    if (currentPlan === 'region' && planInfo?.regionRestriction) {
      const primaryRegion = getPrimaryRegion();
      
      // Si la région est différente et que ce n'est pas l'emplacement actuel
      if (primaryRegion && formData.region !== primaryRegion && currentLocation.region !== formData.region) {
        setErrorMessage(`Avec l'offre RÉGION, tous vos emplacements doivent être dans la même région: ${primaryRegion}`);
        return;
      }
    }
    
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour l'emplacement
      const updatedLocations = locations.map(location => {
        if (location.id === currentLocation.id) {
          return {
            ...location,
            name: formData.name,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            region: formData.region,
            manager: formData.manager,
            status: formData.status
          };
        }
        return location;
      });
      
      setLocations(updatedLocations);
      
      // Fermer le modal et afficher un message de succès
      setShowEditModal(false);
      setSuccessMessage('Emplacement modifié avec succès.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Erreur lors de la modification de l\'emplacement:', error);
      setErrorMessage('Erreur lors de la modification de l\'emplacement. Veuillez réessayer.');
    }
  };
  
  // Supprimer un emplacement
  const handleDeleteLocation = async () => {
    if (!currentLocation) return;
    
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filtrer les emplacements pour supprimer celui sélectionné
      const updatedLocations = locations.filter(location => location.id !== currentLocation.id);
      setLocations(updatedLocations);
      
      // Fermer le modal et afficher un message de succès
      setShowDeleteModal(false);
      setSuccessMessage('Emplacement supprimé avec succès.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'emplacement:', error);
      setErrorMessage('Erreur lors de la suppression de l\'emplacement. Veuillez réessayer.');
    }
  };

  // Rendu du composant
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des emplacements</h1>
        <button
          onClick={handleOpenAddModal}
          className={`flex items-center px-4 py-2 rounded-md text-white ${canAddLocation() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
          disabled={!canAddLocation()}
        >
          <FiPlus className="mr-2" />
          Ajouter un emplacement
        </button>
      </div>
      
      {planInfo && (
        <div className="bg-gray-100 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
          <div className="flex items-start">
            <FiInfo className="text-blue-500 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800">Votre offre : {planInfo.name}</h3>
              <p className="text-gray-600 mt-1">{planInfo.description}</p>
              {planInfo.maxLocations !== null && (
                <p className="text-gray-600 mt-1">
                  Emplacements utilisés : <span className="font-medium">{locations.length} / {planInfo.maxLocations}</span>
                </p>
              )}
              {planInfo.maxLocations === null && (
                <p className="text-gray-600 mt-1">
                  Emplacements utilisés : <span className="font-medium">{locations.length} / Illimité</span>
                </p>
              )}
              {planInfo.regionRestriction && (
                <p className="text-amber-700 mt-1">
                  <FiAlertTriangle className="inline-block mr-1" />
                  Restriction : Tous vos emplacements doivent être dans la même région.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Messages de succès et d'erreur */}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <FiCheck className="text-green-500 mr-3" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <FiX className="text-red-500 mr-3" />
            <p className="text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}
      
      {/* Liste des emplacements */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <p className="text-sm text-blue-700 flex items-center">
            <FiInfo className="mr-2" />
            Gérez ici tous vos emplacements de vente. Selon votre offre, vous pouvez avoir un nombre limité ou illimité d'emplacements.
          </p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Chargement des emplacements...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Vous n'avez pas encore d'emplacements.</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!canAddLocation()}
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              Ajouter votre premier emplacement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ville
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Région
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((location) => (
                  <tr key={location.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiMapPin className="text-blue-500 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{location.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{location.city} ({location.postalCode})</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{location.region}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{location.manager}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${location.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {location.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal(location)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <FiEdit2 className="inline" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(location)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal d'ajout d'emplacement */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Ajouter un emplacement</h3>
            
            <form onSubmit={handleAddLocation}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom de l'emplacement *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Région *</label>
                <input
                  type="text"
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {currentPlan === 'region' && planInfo?.regionRestriction && locations.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    <FiAlertTriangle className="inline mr-1" />
                    Avec l'offre RÉGION, tous vos emplacements doivent être dans la même région.
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <input
                  type="text"
                  id="manager"
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal d'édition d'emplacement */}
      {showEditModal && currentLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Modifier l'emplacement</h3>
            
            <form onSubmit={handleEditLocation}>
              <div className="mb-4">
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">Nom de l'emplacement *</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                <input
                  type="text"
                  id="edit-address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="edit-city" className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                  <input
                    type="text"
                    id="edit-city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-postalCode" className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                  <input
                    type="text"
                    id="edit-postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-region" className="block text-sm font-medium text-gray-700 mb-1">Région *</label>
                <input
                  type="text"
                  id="edit-region"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {currentPlan === 'region' && planInfo?.regionRestriction && (
                  <p className="text-xs text-amber-600 mt-1">
                    <FiAlertTriangle className="inline mr-1" />
                    Avec l'offre RÉGION, tous vos emplacements doivent être dans la même région.
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-manager" className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <input
                  type="text"
                  id="edit-manager"
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  id="edit-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de suppression d'emplacement */}
      {showDeleteModal && currentLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer l'emplacement <span className="font-semibold">{currentLocation.name}</span> ? Cette action est irréversible.</p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteLocation}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
