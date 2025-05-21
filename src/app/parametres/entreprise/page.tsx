"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCheck, FiArrowRight, FiArrowLeft, FiInfo, FiUpload, FiFile, FiTrash2, FiSave } from 'react-icons/fi';
import { getStoreInfo, getStoreUrl, getStoreAddress } from '@/lib/userStore';

// Types pour les données du formulaire
interface VendorFormData {
  businessName: string;
  businessType: string;
  registrationNumber: string;
  vatNumber: string;
  category: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

// Options pour les types d'entreprise
const businessTypeOptions = [
  { value: 'SARL', label: 'SARL' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SA', label: 'SA' },
  { value: 'EURL', label: 'EURL' },
  { value: 'EI', label: 'Entreprise Individuelle' },
  { value: 'SASU', label: 'SASU' },
  { value: 'SNC', label: 'SNC' },
  { value: 'AUTRE', label: 'Autre' }
];

// Options pour les catégories d'activité
const categoryOptions = [
  { value: 'MODE', label: 'Mode et Vêtements' },
  { value: 'BEAUTE', label: 'Beauté et Cosmétiques' },
  { value: 'MAISON', label: 'Maison et Décoration' },
  { value: 'ELECTRONIQUE', label: 'Électronique et High-Tech' },
  { value: 'ALIMENTATION', label: 'Alimentation et Boissons' },
  { value: 'SPORT', label: 'Sport et Loisirs' },
  { value: 'SANTE', label: 'Santé et Bien-être' },
  { value: 'ENFANTS', label: 'Enfants et Bébés' },
  { value: 'BIJOUX', label: 'Bijoux et Accessoires' },
  { value: 'AUTRE', label: 'Autre' }
];

// Liste des pays
const countryOptions = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MC', label: 'Monaco' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'IT', label: 'Italie' },
  { value: 'ES', label: 'Espagne' },
  { value: 'GB', label: 'Royaume-Uni' }
];

export default function EntreprisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoStatus, setInfoStatus] = useState<'draft' | 'pending' | 'validated'>('draft'); // État des informations: brouillon, en attente de validation, validées
  
  // État pour les données du formulaire
  const [formData, setFormData] = useState<VendorFormData>({
    businessName: '',
    businessType: '',
    registrationNumber: '',
    vatNumber: '',
    category: '',
    firstName: '',
    lastName: '',
    position: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'FR'
  });

  // Charger les données existantes au chargement de la page
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données du stockage local
        const storeUrl = getStoreUrl();
        const storeInfo = getStoreInfo();
        const storeAddress = getStoreAddress();
        
        // Récupérer les données de l'entreprise depuis l'API
        const response = await fetch('/api/vendors/me');
        
        if (response.ok) {
          const data = await response.json();
          
          // Déterminer le statut des informations
          if (data.vendor && data.vendor.status) {
            setInfoStatus(data.vendor.status);
          } else if (data.vendor && data.vendor.submittedAt) {
            setInfoStatus('pending');
          }
          
          if (data.vendor) {
            // Pré-remplir les données du formulaire avec les informations existantes
            setFormData({
              businessName: data.vendor.companyName || '',
              businessType: data.vendor.businessType || '',
              registrationNumber: data.vendor.siret || '',
              vatNumber: data.vendor.vatNumber || '',
              category: data.vendor.category || '',
              firstName: data.vendor.contactFirstName || '',
              lastName: data.vendor.contactLastName || '',
              position: data.vendor.contactPosition || '',
              email: data.vendor.email || '',
              phone: data.vendor.phoneNumber || '',
              street: data.vendor.address || storeAddress || '',
              city: data.vendor.city || '',
              postalCode: data.vendor.postalCode || '',
              country: data.vendor.country || 'FR'
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadExistingData();
  }, []);

  // Gérer les changements dans le formulaire
  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  // Valider le formulaire
  const validateForm = (): boolean => {
    setFormError(null);
    
    const requiredFields: (keyof VendorFormData)[] = [
      'businessName', 'registrationNumber', 'vatNumber', 
      'firstName', 'lastName', 'email', 'phone',
      'street', 'city', 'postalCode', 'country'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setFormError('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    
    return true;
  };

  // Soumettre le formulaire à l'administrateur pour validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Envoyer les données au serveur avec le statut "en attente de validation"
      const response = await fetch('/api/vendors/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          status: 'pending',
          submittedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi des données');
      }
      
      // Mettre à jour le statut local
      setInfoStatus('pending');
      setSuccessMessage('Informations d\'entreprise envoyées avec succès à l\'administrateur pour validation');
      setFormSubmitted(true);
      
      // Masquer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      setFormError('Une erreur est survenue lors de l\'envoi de vos informations. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  // Obtenir le texte du bouton en fonction du statut
  const getButtonText = () => {
    switch (infoStatus) {
      case 'draft':
        return 'Envoyer';
      case 'pending':
        return 'En attente de validation';
      case 'validated':
        return 'Validé';
      default:
        return 'Envoyer';
    }
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold mb-6">Informations d'entreprise</h1>
      
      {formError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-center items-center h-40">
          <p className="text-gray-500">Chargement de vos informations...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-medium mb-4">Informations de l'entreprise</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom commercial <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'entreprise
                </label>
                <select
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un type</option>
                  {businessTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro d'enregistrement (SIRET) <span className="text-red-500">*</span>
                </label>
                <input
                  id="registrationNumber"
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de TVA <span className="text-red-500">*</span>
                </label>
                <input
                  id="vatNumber"
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie d'activité
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <h3 className="text-md font-medium mb-3 mt-6">Contact principal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Fonction/Poste
                </label>
                <input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <h3 className="text-md font-medium mb-3 mt-6">Adresse</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                  Rue <span className="text-red-500">*</span>
                </label>
                <input
                  id="street"
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Code postal <span className="text-red-500">*</span>
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Pays <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {countryOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading || infoStatus === 'pending' || infoStatus === 'validated'}
                className={`flex items-center px-6 py-2 rounded-md ${loading || infoStatus === 'pending' || infoStatus === 'validated' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                {loading ? 'Envoi en cours...' : getButtonText()}
                {!loading && infoStatus === 'draft' && <FiSave className="ml-2" />}
                {!loading && infoStatus === 'validated' && <FiCheck className="ml-2" />}
              </button>
            </div>
          </div>
        </form>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium mb-4">Documents légaux</h2>
        <p className="text-sm text-gray-600 mb-4">
          Téléchargez les documents requis pour valider votre compte vendeur :
          pièce d'identité, extrait K-bis, attestation de TVA, RIB, etc.
        </p>
        
        <Link href="/parametres/entreprise/documents" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Gérer les documents légaux <FiArrowRight className="ml-2" />
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4">Informations bancaires</h2>
        <p className="text-sm text-gray-600 mb-4">
          Renseignez vos coordonnées bancaires pour recevoir les paiements :
          titulaire du compte, IBAN, BIC et nom de la banque.
        </p>
        
        <Link href="/parametres/entreprise/banque" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Gérer les informations bancaires <FiArrowRight className="ml-2" />
        </Link>
      </div>
    </div>
  );
}