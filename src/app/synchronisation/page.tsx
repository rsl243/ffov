"use client";

import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiAlertCircle, FiCheckCircle, FiClock, FiSearch, FiBox, FiGlobe, FiSettings } from 'react-icons/fi';
import PageHeader from '@/components/PageHeader';
import Sidebar from '@/components/Sidebar';
import { getStoreInfo, getStoreUrl, saveStoreInfo } from '@/lib/userStore';

// Interface pour les produits
interface Product {
  id: string;
  name: string;
  sku: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  lastSync: string;
  platform: string;
  stock: number;
  issue?: string;
  externalId?: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  productUrl?: string;
  brand?: string;
  category?: string;
  colors?: string[];
  sizes?: string[];
  imageUrls?: string[];
  variants?: any[];
  weight?: number;
  dimensions?: string;
  attributes?: string;
  completeness?: number; // Pourcentage de complétude des données
}

export default function SynchronisationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [lastSyncDate, setLastSyncDate] = useState<string>('Jamais');
  const [syncing, setSyncing] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [reconnectingWebsite, setReconnectingWebsite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  // Charger les infos du site et les produits
  useEffect(() => {
    const storeInfo = getStoreInfo();
    if (storeInfo) {
      setSiteUrl(storeInfo.websiteUrl || '');
      setSiteAddress(storeInfo.storeAddress || '');
    }
    
    // Charger les informations du vendeur
    fetchVendorInfo();
  }, []);

  // Fonction pour récupérer les informations du vendeur
  const fetchVendorInfo = async () => {
    try {
      setLoading(true);
      setError(null); // Réinitialiser les erreurs précédentes
      
      console.log('Tentative de récupération des informations du vendeur...');
      
      // Récupérer l'ID du vendeur connecté
      const response = await fetch('/api/vendors/me', {
        // Ajouter des en-têtes pour aider à l'identification
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse de l\'API non OK:', response.status, errorText);
        throw new Error(`Impossible de récupérer les informations du vendeur (${response.status})`);
      }
      
      // Parser la réponse JSON
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Erreur lors du parsing JSON:', jsonError);
        throw new Error('Format de réponse invalide');
      }
      
      // Vérifier si les données du vendeur sont présentes
      if (!data.vendor) {
        console.error('Données du vendeur manquantes dans la réponse:', data);
        throw new Error('Données du vendeur manquantes dans la réponse');
      }
      
      console.log('Informations du vendeur récupérées avec succès:', data.vendor.id);
      
      // Définir l'ID du vendeur
      setVendorId(data.vendor.id);
      
      // Récupérer l'URL du site web stockée localement
      const storedUrl = getStoreUrl();
      
      // Si nous avons une URL stockée localement, l'utiliser
      // Sinon, utiliser celle du vendeur
      if (storedUrl && storedUrl !== '') {
        console.log('Utilisation de l\'URL du site web stockée localement:', storedUrl);
        setSiteUrl(storedUrl);
        
        // Si l'URL du vendeur est différente de celle stockée localement,
        // mettre à jour l'URL du vendeur sur le serveur
        if (data.vendor.websiteUrl !== storedUrl) {
          try {
            console.log('Mise à jour de l\'URL du vendeur sur le serveur:', storedUrl);
            const updateResponse = await fetch(`/api/vendors/${data.vendor.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                websiteUrl: storedUrl,
              }),
            });
            
            if (!updateResponse.ok) {
              console.error('Erreur lors de la mise à jour de l\'URL du vendeur:', await updateResponse.text());
            }
          } catch (updateError) {
            console.error('Erreur lors de la mise à jour de l\'URL du vendeur:', updateError);
          }
        }
      } else if (data.vendor.websiteUrl) {
        console.log('Utilisation de l\'URL du site web depuis le serveur:', data.vendor.websiteUrl);
        setSiteUrl(data.vendor.websiteUrl);
        saveStoreInfo(data.vendor.websiteUrl, data.vendor.storeName || siteAddress);
      }
      
      // Si le vendeur a une date de dernière synchronisation, la mettre à jour
      if (data.vendor.lastSyncedAt) {
        const date = new Date(data.vendor.lastSyncedAt);
        const formattedDate = date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setLastSyncDate(formattedDate);
      }
      
      // Charger les produits du vendeur
      await fetchProducts(data.vendor.id);
      
      // Si le vendeur n'a jamais été synchronisé, déclencher une synchronisation automatique
      if (!data.vendor.lastSyncedAt) {
        console.log('Première connexion détectée, synchronisation automatique...');
        setTimeout(() => {
          handleSync();
        }, 1000); // Attendre 1 seconde avant de déclencher la synchronisation
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des informations du vendeur:', err);
      setError(`Impossible de récupérer les informations du vendeur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setVendorId(null); // Réinitialiser l'ID du vendeur en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les produits
  const fetchProducts = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/products`);
      if (!response.ok) {
        throw new Error('Impossible de récupérer les produits');
      }
      
      const data = await response.json();
      
      // Si aucun produit n'est retourné, définir un tableau vide
      if (!data.products || !Array.isArray(data.products)) {
        setProducts([]);
        return;
      }
      
      console.log('Produits récupérés:', data.products);
      
      // Transformer les produits au format attendu par l'interface
      const formattedProducts: Product[] = data.products.map((p: any) => {
        // Vérifier et nettoyer les données du produit
        const cleanProduct = {
          ...p,
          // S'assurer que le prix est un nombre
          price: typeof p.price === 'number' ? p.price : 
                 typeof p.price === 'string' ? parseFloat(p.price) : 0,
          // S'assurer que l'URL de l'image est une chaîne valide
          imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : '',
          // S'assurer que l'URL du produit est une chaîne valide
          productUrl: typeof p.productUrl === 'string' ? p.productUrl : '',
          // S'assurer que la description est une chaîne valide
          description: typeof p.description === 'string' ? p.description : '',
          // S'assurer que le stock est un nombre
          stock: typeof p.stock === 'number' ? p.stock : 0
        };
        
        // Calculer le pourcentage de complétude du produit
        const requiredFields = ['name', 'price']; // Champs obligatoires
        const optionalFields = [
          'description', 'imageUrl', 'productUrl', 'stock', 'sku', 
          'brand', 'category', 'variants', 'weight', 'dimensions', 'attributes'
        ]; // Champs optionnels
        
        // Compter les champs obligatoires présents
        const requiredPresent = requiredFields.filter(field => {
          const value = cleanProduct[field as keyof typeof cleanProduct];
          return value !== undefined && value !== null && value !== '';
        }).length;
        
        // Compter les champs optionnels présents
        const optionalPresent = optionalFields.filter(field => {
          const value = cleanProduct[field as keyof typeof cleanProduct];
          return value !== undefined && value !== null && value !== '';
        }).length;
        
        // Calculer le pourcentage de complétude
        const totalFields = requiredFields.length + optionalFields.length;
        const presentFields = requiredPresent + optionalPresent;
        const completeness = Math.round((presentFields / totalFields) * 100);
        
        // Déterminer le statut du produit en fonction de sa complétude
        let status: 'success' | 'warning' | 'error' | 'pending' = 'success';
        let issue: string | undefined = undefined;
        
        // Logique pour déterminer le statut basée sur la complétude
        if (!cleanProduct.name || cleanProduct.name.trim() === '') {
          status = 'error';
          issue = 'Nom manquant';
        } else if (cleanProduct.price <= 0) {
          status = 'error';
          issue = 'Prix invalide';
        } else if (completeness < 50) {
          status = 'warning';
          issue = 'Données produit incomplètes';
        } else if (!cleanProduct.imageUrl || cleanProduct.imageUrl.trim() === '') {
          status = 'warning';
          issue = 'Image manquante';
        } else if (!cleanProduct.description || cleanProduct.description.trim() === '') {
          status = 'warning';
          issue = 'Description manquante';
        } else if (!cleanProduct.productUrl || cleanProduct.productUrl.trim() === '') {
          status = 'warning';
          issue = 'URL du produit manquante';
        } else if (completeness < 80) {
          status = 'warning';
          issue = 'Informations supplémentaires manquantes';
        } else {
          status = 'success';
          issue = undefined;
        }
        
        // Formater la date de dernière mise à jour
        const lastSyncDate = cleanProduct.updatedAt ? new Date(cleanProduct.updatedAt) : null;
        const lastSync = lastSyncDate 
          ? lastSyncDate.toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Jamais';
        
        // Traiter les champs JSON stockés sous forme de chaîne
        let variants = cleanProduct.variants;
        let attributes = cleanProduct.attributes;
        
        if (typeof variants === 'string' && variants) {
          try {
            const parsedVariants = JSON.parse(variants);
            variants = Array.isArray(parsedVariants) 
              ? parsedVariants.join(', ') 
              : variants;
          } catch (e) {
            // Garder la chaîne telle quelle si le parsing échoue
          }
        }
        
        if (typeof attributes === 'string' && attributes) {
          try {
            const parsedAttrs = JSON.parse(attributes);
            if (typeof parsedAttrs === 'object') {
              attributes = Object.entries(parsedAttrs)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            }
          } catch (e) {
            // Garder la chaîne telle quelle si le parsing échoue
          }
        }
        
        return {
          id: cleanProduct.id,
          name: cleanProduct.name,
          sku: cleanProduct.sku || cleanProduct.externalId || `SKU-${cleanProduct.id.substring(0, 5)}`,
          status,
          lastSync,
          platform: cleanProduct.brand || 'Non spécifié',
          stock: cleanProduct.stock || 0,
          issue,
          externalId: cleanProduct.externalId,
          price: cleanProduct.price,
          imageUrl: cleanProduct.imageUrl,
          description: cleanProduct.description,
          productUrl: cleanProduct.productUrl,
          brand: cleanProduct.brand,
          category: cleanProduct.category,
          variants: variants,
          weight: cleanProduct.weight,
          dimensions: cleanProduct.dimensions,
          attributes: attributes,
          completeness
        };
      });
      
      console.log('Produits formatés:', formattedProducts);
      setProducts(formattedProducts);
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err);
      setError('Impossible de récupérer les produits');
    }
  };

  // Filtrer les produits en fonction du terme de recherche
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Fonction pour sélectionner un produit et afficher ses détails
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };
  
  // Fonction pour fermer le modal de détails du produit
  const handleCloseProductDetails = () => {
    setShowProductDetails(false);
  };

  // Déclencher une synchronisation réelle
  const handleSync = async () => {
    // Vérifier si un vendeur est connecté
    if (!vendorId) {
      console.error('Tentative de synchronisation sans ID de vendeur');
      setError('Aucun vendeur connecté. Veuillez rafraîchir la page et réessayer.');
      return;
    }
    
    setSyncing(true);
    setError(null); // Réinitialiser les erreurs précédentes
    
    try {
      console.log(`Démarrage de la synchronisation pour le vendeur ${vendorId}`);
      
      // Appeler l'API de synchronisation réelle
      const response = await fetch(`/api/vendors/${vendorId}/auto-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse de l\'API de synchronisation non OK:', response.status, errorText);
        throw new Error(`Erreur lors de la synchronisation (${response.status})`);
      }
      
      // Parser la réponse JSON
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Erreur lors du parsing JSON de la réponse de synchronisation:', jsonError);
        throw new Error('Format de réponse de synchronisation invalide');
      }
      
      console.log('Résultat de la synchronisation:', result);
      
      // Mettre à jour la date de dernière synchronisation
      const now = new Date();
      const formattedDate = now.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setLastSyncDate(formattedDate);
      
      // Recharger les produits après la synchronisation
      await fetchProducts(vendorId);
      
      // Afficher un message de succès
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la synchronisation:', err);
      setError(`Erreur lors de la synchronisation: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setSyncing(false);
    }
  };

  // Fonction pour reconnecter/mettre à jour le site web
  const handleReconnectWebsite = async () => {
    if (!vendorId) {
      setError('Aucun vendeur connecté');
      return;
    }
    
    setReconnectingWebsite(true);
    
    try {
      // Mettre à jour l'URL du site web du vendeur
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: siteUrl,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du site web');
      }
      
      // Sauvegarder dans le stockage local
      saveStoreInfo(siteUrl, siteAddress);
      
      // Déclencher une synchronisation pour mettre à jour les produits
      handleSync();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du site web:', err);
      setError('Erreur lors de la mise à jour du site web');
    } finally {
      setReconnectingWebsite(false);
    }
  };

  // Afficher un message de chargement
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageHeader title="Produits synchronisés" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FiRefreshCw className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
                <p className="text-gray-600">Chargement des produits...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageHeader title="Produits synchronisés" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-6">
              <div className="flex items-center text-red-800">
                <FiAlertCircle className="mr-2" />
                <p>{error}</p>
              </div>
              <button 
                onClick={() => {
                  setError(null);
                  fetchVendorInfo();
                }}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <PageHeader title="Produits synchronisés" />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Site web connecté */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-medium mb-2">Site web connecté</h2>
                  <p className="text-gray-600">
                    {siteUrl ? (
                      <span>
                        <FiGlobe className="inline mr-1" /> 
                        <a href={siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          {siteUrl}
                        </a>
                      </span>
                    ) : (
                      <span className="text-yellow-600">Aucun site web connecté</span>
                    )}
                  </p>
                </div>
                <button 
                  onClick={handleReconnectWebsite}
                  disabled={reconnectingWebsite || !siteUrl}
                  className={`flex items-center px-4 py-2 ${reconnectingWebsite || !siteUrl ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'} rounded-md`}
                >
                  <FiSettings className={`mr-2 ${reconnectingWebsite ? 'animate-spin' : ''}`} />
                  {reconnectingWebsite ? 'Reconnexion en cours...' : 'Mettre à jour la connexion'}
                </button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-2">
                <div className="flex items-center text-blue-800">
                  <FiAlertCircle className="mr-2" />
                  <p>Si votre site web n'est pas à jour dans Faet, cliquez sur "Mettre à jour la connexion" pour forcer une nouvelle synchronisation.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* État de la synchronisation */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-medium mb-2">État de la synchronisation</h2>
                  <p className="text-gray-600">
                    Dernière synchronisation : <span className="font-medium">{lastSyncDate}</span>
                  </p>
                </div>
                <button 
                  onClick={handleSync}
                  disabled={syncing}
                  className={`flex items-center px-4 py-2 ${syncing ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'} rounded-md`}
                >
                  <FiRefreshCw className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Synchronisation en cours...' : 'Synchroniser maintenant'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FiBox className="text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{products.filter(p => p.status === 'success').length}</h3>
                      <p className="text-sm text-gray-600">Produits synchronisés</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <FiAlertCircle className="text-yellow-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{products.filter(p => p.status === 'warning').length}</h3>
                      <p className="text-sm text-gray-600">Produits avec attention requise</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <FiAlertCircle className="text-red-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{products.filter(p => p.status === 'error').length}</h3>
                      <p className="text-sm text-gray-600">Produits avec erreurs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recherche et tableau */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center">
                <div className="relative flex-grow">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom ou SKU" 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom du produit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière synchronisation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className="hover:bg-gray-50 cursor-pointer" 
                      onClick={() => handleSelectProduct(product)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {product.name && product.name !== 'Produit' && !product.name.startsWith('generic-product') ? 
                            product.name : 
                            product.colors && Array.isArray(product.colors) && product.colors.length > 0 ? 
                              product.colors.join(', ') : 
                              product.category || product.sku
                          }
                        </div>
                        {product.price && product.price > 0 && (
                          <div className="text-sm text-gray-500">{product.price.toFixed(2)} €</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.status === 'success' && (
                            <div className="flex items-center text-green-600">
                              <FiCheckCircle className="mr-1" />
                              <span>Synchronisé</span>
                            </div>
                          )}
                          {product.status === 'warning' && (
                            <div className="flex items-center text-yellow-500" title={product.issue}>
                              <FiAlertCircle className="mr-1" />
                              <span>Attention</span>
                              {product.completeness && (
                                <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                                  {product.completeness}%
                                </span>
                              )}
                            </div>
                          )}
                          {product.status === 'error' && (
                            <div className="flex items-center text-red-600" title={product.issue}>
                              <FiAlertCircle className="mr-1" />
                              <span>Erreur</span>
                            </div>
                          )}
                          {product.status === 'pending' && (
                            <div className="flex items-center text-blue-600">
                              <FiClock className="mr-1" />
                              <span>En attente</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.lastSync}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'Aucun produit ne correspond à votre recherche' : 'Aucun produit synchronisé pour le moment'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Modal de détails du produit */}
          {showProductDetails && selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start p-4 border-b">
                  <h2 className="text-xl font-semibold">Détails du produit</h2>
                  <button 
                    onClick={handleCloseProductDetails}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {selectedProduct.name && !selectedProduct.name.match(/^IMG_\d+$/) 
                        ? selectedProduct.name.replace(/^Produit generic-product-[^-]+-[^-]+/, '').replace(/^\s*-\s*/, '') 
                        : selectedProduct.description 
                          ? selectedProduct.description.split('.')[0] 
                          : selectedProduct.brand 
                            ? `Produit ${selectedProduct.brand}` 
                            : `Produit ${selectedProduct.sku}`}
                    </h3>
                    {selectedProduct.completeness !== undefined && (
                      <div className="text-sm font-medium">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 mb-1">
                          <div 
                            className={`h-2.5 rounded-full ${selectedProduct.completeness >= 80 ? 'bg-green-500' : selectedProduct.completeness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${selectedProduct.completeness}%` }}
                          ></div>
                        </div>
                        <p className="text-right text-gray-600">{selectedProduct.completeness}% complet</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Colonne gauche */}
                    <div>
                      <div className="mb-6">
                        <h4 className="text-lg font-medium mb-3 pb-2 border-b">Informations de base</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">SKU</p>
                            <p className="text-base">{selectedProduct.sku || 'Non spécifié'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Prix</p>
                            <p className="text-base">
                              {typeof selectedProduct.price === 'number' && !isNaN(selectedProduct.price) 
                                ? `${selectedProduct.price.toFixed(2)} €` 
                                : 'Prix non disponible'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Dernière mise à jour</p>
                            <p className="text-base">{selectedProduct.lastSync}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="text-lg font-medium mb-3 pb-2 border-b">Informations supplémentaires</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Tailles disponibles</p>
                            <p className="text-base">
                              {selectedProduct.sizes && Array.isArray(selectedProduct.sizes) ? 
                                selectedProduct.sizes.join(', ') : 
                                'Non spécifiées'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Couleurs disponibles</p>
                            <p className="text-base">
                              {selectedProduct.colors && Array.isArray(selectedProduct.colors) ? 
                                selectedProduct.colors.join(', ') : 
                                'Non spécifiées'}
                            </p>
                          </div>
                          {selectedProduct.brand && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Marque</p>
                              <p className="text-base">{selectedProduct.brand}</p>
                            </div>
                          )}
                          {selectedProduct.weight && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Poids</p>
                              <p className="text-base">{selectedProduct.weight} kg</p>
                            </div>
                          )}
                          {selectedProduct.dimensions && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Dimensions</p>
                              <p className="text-base">{selectedProduct.dimensions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedProduct.attributes && (
                        <div className="mb-6">
                          <h4 className="text-lg font-medium mb-3 pb-2 border-b">Attributs</h4>
                          <p className="text-base">{selectedProduct.attributes}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Colonne droite */}
                    <div>
                      <div className="mb-6">
                        <h4 className="text-lg font-medium mb-3 pb-2 border-b">Image du produit</h4>
                        {selectedProduct.imageUrl && typeof selectedProduct.imageUrl === 'string' && selectedProduct.imageUrl.startsWith('http') ? (
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={selectedProduct.imageUrl} 
                              alt={selectedProduct.name} 
                              className="w-full h-auto max-h-64 object-contain p-2"
                              onError={(e) => {
                                // Remplacer par une image par défaut en cas d'erreur
                                e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Image+non+disponible';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="border rounded-lg p-8 bg-gray-50 flex items-center justify-center">
                            <p className="text-gray-400">Aucune image disponible</p>
                          </div>
                        )}
                      </div>
                      
                      {selectedProduct.productUrl && (
                        <div className="mb-6">
                          <h4 className="text-lg font-medium mb-3 pb-2 border-b">URL du produit</h4>
                          <a 
                            href={selectedProduct.productUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all block"
                          >
                            {selectedProduct.productUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedProduct.description && (
                    <div className="mt-6">
                      <h4 className="text-lg font-medium mb-3 pb-2 border-b">Description</h4>
                      <p className="text-base text-gray-700 whitespace-pre-line">{selectedProduct.description}</p>
                    </div>
                  )}
                  
                  {selectedProduct.issue && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="text-lg font-medium mb-2 flex items-center text-yellow-800">
                        <FiAlertCircle className="mr-2" />
                        Attention requise
                      </h4>
                      <p className="text-base text-yellow-800">{selectedProduct.issue}</p>
                      
                      {selectedProduct.completeness !== undefined && selectedProduct.completeness < 80 && (
                        <div className="mt-3 p-3 bg-white rounded border border-yellow-100">
                          <h5 className="text-sm font-medium mb-2">Recommandations pour améliorer ce produit :</h5>
                          <ul className="list-disc pl-5 text-sm text-gray-700">
                            {!selectedProduct.description && (
                              <li className="mb-1">Ajouter une description détaillée du produit</li>
                            )}
                            {!selectedProduct.imageUrl && (
                              <li className="mb-1">Ajouter une image du produit</li>
                            )}
                            {!selectedProduct.productUrl && (
                              <li className="mb-1">Ajouter l'URL du produit sur votre site</li>
                            )}
                            {/* Les recommandations pour la marque et la catégorie ont été supprimées comme demandé */}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t flex justify-end">
                  <button
                    onClick={handleCloseProductDetails}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}