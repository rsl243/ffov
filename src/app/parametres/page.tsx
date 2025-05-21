'use client';

import React, { useState, useEffect } from 'react';
import { FiInfo, FiChevronDown, FiEdit2, FiExternalLink } from 'react-icons/fi';
import Link from 'next/link';
import { getStoreInfo, getStoreUrl, getStoreAddress } from '@/lib/userStore';
import { getUserPlanInfo } from '@/lib/userPlan';
import { useUserProfile } from '@/contexts/UserProfileContext';

export default function ParametresPage() {
  // Utiliser le contexte de profil utilisateur
  const { profile, loading: profileLoading } = useUserProfile();
  
  // Information sur la boutique
  const [shopInfo, setShopInfo] = useState<{
    name: string;
    url: string;
    plan: string;
    createdAt: string;
    address: string;
  }>({
    name: 'Ma boutique',
    url: '',
    plan: '',
    createdAt: '',
    address: ''
  });
  
  // Informations de l'entreprise
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    legalStatus: '',
    siret: '',
    tva: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les informations de la boutique au chargement de la page
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les informations du forfait utilisateur
        const userPlanInfo = getUserPlanInfo();
        
        // Préparer les données initiales à partir de différentes sources
        let shopName = '';
        let shopUrl = '';
        let shopAddress = '';
        let shopCreatedDate = '';
        
        // 1. Vérifier d'abord le profil utilisateur (source prioritaire)
        if (profile) {
          shopName = profile.storeName || '';
          shopUrl = profile.storeUrl || '';
          shopAddress = profile.storeAddress || '';
          
          if (profile.storeCreatedAt) {
            try {
              shopCreatedDate = new Date(profile.storeCreatedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
            } catch (err) {
              console.error('Date invalide dans le profil:', profile.storeCreatedAt);
            }
          }
        }
        
        // 2. Récupérer les données de l'entreprise depuis l'API
        const response = await fetch('/api/vendors/me');
        
        if (response.ok) {
          const data = await response.json();
          
          // Utiliser les données de l'API si elles sont disponibles et si les données du profil sont vides
          if (data.vendor) {
            if (!shopName) shopName = data.vendor.storeName || 'Ma boutique';
            if (!shopAddress && data.vendor.storeAddress) shopAddress = data.vendor.storeAddress;
          }
        }
        
        // 3. Fallback sur les données du localStorage si nécessaire
        const retrievedStoreUrl = getStoreUrl();
        const retrievedStoreInfo = getStoreInfo();
        const retrievedStoreAddress = getStoreAddress();
        
        if (!shopUrl && retrievedStoreUrl) {
          try {
            // Formater l'URL pour l'affichage
            const urlObject = new URL(retrievedStoreUrl);
            shopUrl = urlObject.hostname;
          } catch (err) {
            console.error('URL invalide:', retrievedStoreUrl);
            shopUrl = retrievedStoreUrl; // Utiliser l'URL telle quelle si le format est invalide
          }
        }
        
        if (!shopName && retrievedStoreInfo?.siteName) {
          shopName = retrievedStoreInfo.siteName;
        }
        
        if (!shopAddress && retrievedStoreAddress) {
          shopAddress = retrievedStoreAddress;
        }
        
        if (!shopCreatedDate && retrievedStoreInfo?.createdAt) {
          try {
            shopCreatedDate = new Date(retrievedStoreInfo.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          } catch (err) {
            console.error('Date invalide dans le localStorage:', retrievedStoreInfo.createdAt);
          }
        }
        
        // Mettre à jour les informations consolidées avec toutes les données recueillies
        setShopInfo({
          name: shopName || 'Ma boutique',
          url: shopUrl || '',
          address: shopAddress || '',
          plan: userPlanInfo.name,
          createdAt: shopCreatedDate || ''
        });
        
        // Récupérer l'email de l'utilisateur et informations de l'entreprise depuis l'API
        let userEmail = '';
        let companyData = null;
        
        // Récupérer les données de l'entreprise depuis l'API (deuxième appel)
        try {
          const companyResponse = await fetch('/api/vendors/me');
          
          if (companyResponse.ok) {
            const companyResult = await companyResponse.json();
            companyData = companyResult.vendor;
            
            if (companyData && companyData.email) {
              userEmail = companyData.email;
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données de l\'entreprise:', error);
        }
        
        // Mettre à jour les informations de l'entreprise avec les données de l'API
        if (companyData) {
          setCompanyInfo({
            name: companyData.companyName || '',
            legalStatus: companyData.legalStatus || '',
            siret: companyData.siret || '',
            tva: companyData.vatNumber || '',
            address: companyData.address || '',
            phone: companyData.phoneNumber || '',
            // Utiliser l'email de l'utilisateur s'il existe
            email: userEmail || companyData.email || '',
            // Utiliser le domaine du site web 
            website: shopUrl || companyData.website || ''
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger vos informations. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // State pour déterminer si nous sommes sur la page principale
  const [isMainPage, setIsMainPage] = useState(true); // Défaut à true pour le rendu initial
  
  // Utiliser useEffect pour déterminer si nous sommes sur la page principale après le montage du composant
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMainPage(window.location.pathname === '/parametres');
    }
  }, []);

  return (
    <div className="max-w-5xl">
      {isMainPage && (
        <h1 className="text-2xl font-semibold mb-6">Général</h1>
      )}
      
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-center items-center h-40">
          <p className="text-gray-500">Chargement de vos informations...</p>
        </div>
      ) : isMainPage && (
        <>
          {/* Boutique */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-medium mb-4">Boutique</h2>
            
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{shopInfo.name || 'Ma boutique'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-gray-500">URL de la boutique</div>
                  <div className="flex items-center text-blue-700">
                    {shopInfo.url ? (
                      <a href={`https://${shopInfo.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                        {shopInfo.url} <FiExternalLink className="ml-1 text-xs" />
                      </a>
                    ) : (
                      <span className="text-gray-600">Non configuré</span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-gray-500">Forfait actuel</div>
                  <div className="text-gray-900">{shopInfo.plan}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-gray-500">Créée le</div>
                  <div className="text-gray-900">{shopInfo.createdAt || 'Date non disponible'}</div>
                </div>
              </div>
              
              {/* Adresse de la boutique */}
              <div className="bg-gray-50 p-3 rounded-md mt-4">
                <div className="text-sm font-medium text-gray-500">Adresse de la boutique</div>
                <div className="text-gray-900">{shopInfo.address || 'Non renseigné'}</div>
              </div>
            </div>
            
            {/* Informations officielles de l'entreprise */}
            <div className="border-b border-gray-200 pb-6 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-700">Informations officielles de l'entreprise</h3>
                <div className="flex items-center text-sm text-red-600">
                  <FiInfo className="mr-1" />
                  <span>Modification par courrier officiel uniquement</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600">Raison sociale</p>
                      <p className="text-sm text-gray-800">{companyInfo.name || 'Non renseigné'}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600">Forme juridique</p>
                      <p className="text-sm text-gray-800">{companyInfo.legalStatus || 'Non renseigné'}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600">N° SIRET</p>
                      <p className="text-sm text-gray-800">{companyInfo.siret || 'Non renseigné'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600">N° TVA intracommunautaire</p>
                      <p className="text-sm text-gray-800">{companyInfo.tva || 'Non renseigné'}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600">Siège social</p>
                      <p className="text-sm text-gray-800">{companyInfo.address || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  Pour modifier ces informations légales, veuillez envoyer un courrier officiel avec les justificatifs à notre service administratif.
                </div>
              </div>

              {/* Informations modifiables */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium text-gray-700">Informations de contact</h3>
                  <Link href="/parametres/contact" className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
                    <FiEdit2 className="mr-1" /> Modifier
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600">Téléphone</p>
                    <p className="text-sm text-gray-800">{companyInfo.phone || 'Non renseigné'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600">Email professionnel</p>
                    <p className="text-sm text-gray-800">{companyInfo.email || 'Non renseigné'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600">Site web</p>
                    <p className="text-sm text-gray-800">
                      {companyInfo.website ? (
                        <a href={`https://${companyInfo.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline text-blue-700">
                          {companyInfo.website} <FiExternalLink className="ml-1 text-xs" />
                        </a>
                      ) : (
                        <span className="text-gray-600">Non configuré</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}