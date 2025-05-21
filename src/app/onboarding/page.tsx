"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCheck, FiArrowRight, FiGlobe, FiMapPin, FiSettings, FiUser } from 'react-icons/fi';
import { saveStoreInfo } from '@/lib/userStore';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!authLoading && !user) {
      router.push('/connexion');
    }
  }, [user, authLoading, router]);

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinish = async () => {
    setSyncing(true);
    
    // Sauvegarder les informations de la boutique localement
    saveStoreInfo(siteName, websiteUrl, storeAddress);
    
    try {
      // Utiliser directement l'utilisateur du contexte d'authentification Supabase
      if (user && user.id) {
        console.log('Création/mise à jour des informations du magasin...');
        setSyncProgress(20);
        
        // Importer Supabase ici pour éviter les problèmes de rendu côté serveur
        const { supabase } = await import('@/lib/supabase');
        
        // 0. Vérifier et créer un profil utilisateur s'il n'existe pas déjà
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!existingProfile) {
          console.log('Création du profil utilisateur...');
          // Créer le profil utilisateur
          const userMetadata = user.user_metadata || {};
          
          await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              first_name: userMetadata.first_name || '',
              last_name: userMetadata.last_name || '',
              email: user.email || '',
              selected_plan: userMetadata.selected_plan || 'ville',
              status: 'active'
            });
            
          console.log('Profil utilisateur créé avec succès');
        }
        
        // 1. Créer une organisation
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: siteName,  // Utiliser le nom du site comme nom d'organisation
            legal_name: siteName,  // Utiliser le nom du site comme nom légal par défaut
            address: storeAddress,  // Utiliser l'adresse de la boutique
            website_url: websiteUrl,
            status: 'draft'  // Statut initial
          })
          .select();
          
        if (orgError) {
          console.error('Erreur lors de la création de l\'organisation:', orgError);
          // Continuer quand même pour ne pas bloquer l'utilisateur
        }
        
        // Récupérer l'ID de l'organisation
        const organizationId = orgData?.[0]?.id;
        
        if (organizationId) {
          // 2. Créer la relation entre l'utilisateur et l'organisation
          await supabase
            .from('organization_members')
            .insert({
              organization_id: organizationId,
              user_id: user.id,  // ID de l'utilisateur (doit exister dans user_profiles)
              role: 'owner'  // L'utilisateur qui crée l'organisation en est le propriétaire
            });
            
          // 3. Maintenant, créer l'entrée dans store_info
          const { data: storeData, error: storeError } = await supabase
            .from('store_info')
            .insert({
              organization_id: organizationId,  // Utiliser l'ID de l'organisation créée
              site_name: siteName,
              site_url: websiteUrl,
              last_sync: new Date().toISOString(),
              is_syncing: false
            });
            
          if (storeError) {
            console.error('Erreur lors de la création des informations du magasin:', storeError);
          }
          
          // 4. Mettre à jour le profil utilisateur avec les informations professionnelles
          await supabase.auth.updateUser({
            data: {
              product_types: productTypes
            }
          });
          
          // 5. Créer les types de produits pour l'utilisateur
          for (const productType of productTypes) {
            await supabase
              .from('user_product_types')
              .insert({
                user_id: user.id,
                product_type: productType.charAt(0).toUpperCase() + productType.slice(1)  // Première lettre en majuscule
              });
          }
        }
        
        // Simuler la synchronisation des produits
        console.log('Synchronisation des produits en cours...');
        
        // Animation de progression
        for (let i = 20; i <= 90; i += 10) {
          setSyncProgress(i);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log('Synchronisation terminée');
        setSyncProgress(100);
      } else {
        // Simuler la synchronisation si l'utilisateur n'est pas disponible
        for (let i = 0; i <= 100; i += 10) {
          setSyncProgress(i);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // Attendre un peu avant la redirection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Rediriger vers le tableau de bord après la synchronisation
      router.push('/dashboard');
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      
      // En cas d'erreur, terminer quand même la synchronisation simulée
      // pour ne pas bloquer l'utilisateur
      for (let i = syncProgress; i <= 100; i += 10) {
        setSyncProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Rediriger malgré l'erreur
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/dashboard');
    }
  };

  const validateWebsiteUrl = (url: string) => {
    // Simple validation for demonstration purposes
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-black">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-10 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <div className="text-black font-bold text-3xl">
              <span className="text-primary-color">Faet</span>
              <div className="text-xs font-light mt-1 text-black">GAGNEZ EN PHYGITAL</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2 text-black">Configuration de votre boutique</h1>
          <p className="text-black">Suivez les étapes pour connecter votre boutique en ligne à votre magasin physique</p>
        </div>

        {/* Stepper */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-black'}`}>
              {currentStep > 1 ? <FiCheck /> : '1'}
            </div>
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-white'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-black'}`}>
              {currentStep > 2 ? <FiCheck /> : '2'}
            </div>
            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-white'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-black'}`}>
              {currentStep > 3 ? <FiCheck /> : '3'}
            </div>
            <div className={`w-16 h-1 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-white'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 4 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-black'}`}>
              {currentStep > 4 ? <FiCheck /> : '4'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10">
          {/* Step 1: Website URL */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FiGlobe className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Boutique en ligne</h2>
                  <p className="text-black">Fournissez l'URL de votre boutique en ligne</p>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="site-name" className="block text-sm font-medium text-black mb-1">
                  Nom de votre site
                </label>
                <input
                  id="site-name"
                  type="text"
                  placeholder="Ma Boutique"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="website-url" className="block text-sm font-medium text-black mb-1">
                  URL de votre site web
                </label>
                <input
                  id="website-url"
                  type="url"
                  placeholder="https://votre-boutique.fr"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNextStep}
                  disabled={!validateWebsiteUrl(websiteUrl) || !siteName.trim()}
                  className={`flex items-center px-6 py-3 rounded-md ${!validateWebsiteUrl(websiteUrl) || !siteName.trim() ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  Continuer
                  <FiArrowRight className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Informations métier */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FiUser className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Informations professionnelles</h2>
                  <p className="text-black">Dites-nous en plus sur votre activité</p>
                </div>
              </div>



              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">
                  Types de produits (sélectionnez au moins une catégorie)
                </label>
                <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="flex items-center">
                    <input
                      id="mode"
                      name="productTypes"
                      type="checkbox"
                      value="mode"
                      checked={productTypes.includes('mode')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProductTypes([...productTypes, 'mode']);
                        } else {
                          setProductTypes(productTypes.filter(type => type !== 'mode'));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="mode" className="ml-2 block text-sm text-black">
                      Mode
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="beaute"
                      name="productTypes"
                      type="checkbox"
                      value="beaute"
                      checked={productTypes.includes('beaute')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProductTypes([...productTypes, 'beaute']);
                        } else {
                          setProductTypes(productTypes.filter(type => type !== 'beaute'));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="beaute" className="ml-2 block text-sm text-black">
                      Beauté
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="jeux"
                      name="productTypes"
                      type="checkbox"
                      value="jeux"
                      checked={productTypes.includes('jeux')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProductTypes([...productTypes, 'jeux']);
                        } else {
                          setProductTypes(productTypes.filter(type => type !== 'jeux'));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="jeux" className="ml-2 block text-sm text-black">
                      Jeux
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="sport"
                      name="productTypes"
                      type="checkbox"
                      value="sport"
                      checked={productTypes.includes('sport')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProductTypes([...productTypes, 'sport']);
                        } else {
                          setProductTypes(productTypes.filter(type => type !== 'sport'));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sport" className="ml-2 block text-sm text-black">
                      Sport et Loisir
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="autres"
                      name="productTypes"
                      type="checkbox"
                      value="autres"
                      checked={productTypes.includes('autres')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProductTypes([...productTypes, 'autres']);
                        } else {
                          setProductTypes(productTypes.filter(type => type !== 'autres'));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autres" className="ml-2 block text-sm text-black">
                      Autres
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={productTypes.length === 0}
                  className={`flex items-center px-6 py-3 rounded-md ${productTypes.length === 0 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  Continuer
                  <FiArrowRight className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Store Address */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FiMapPin className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Magasin physique</h2>
                  <p className="text-black">Indiquez l'adresse de votre magasin physique</p>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="store-address" className="block text-sm font-medium text-black mb-1">
                  Adresse de la boutique
                </label>
                <textarea
                  id="store-address"
                  placeholder="123 rue du Commerce, 75001 Paris"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!storeAddress.trim()}
                  className={`flex items-center px-6 py-3 rounded-md ${!storeAddress.trim() ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  Continuer
                  <FiArrowRight className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Synchronization */}
          {currentStep === 4 && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FiSettings className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Synchronisation</h2>
                  <p className="text-black">Synchronisez votre boutique en ligne avec votre magasin physique</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                <h3 className="font-medium mb-4">Récapitulatif</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-black">Nom du site</p>
                    <p className="font-medium">{siteName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">URL du site web</p>
                    <p className="font-medium">{websiteUrl}</p>
                  </div>

                  <div>
                    <p className="text-sm text-black">Types de produits</p>
                    <p className="font-medium">{productTypes.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-black">Adresse de la boutique</p>
                    <p className="font-medium">{storeAddress}</p>
                  </div>
                </div>
              </div>

              {!syncing ? (
                <div className="text-center mb-6">
                  <p className="mb-4">Prêt à synchroniser vos produits, stocks et commandes ?</p>
                  
                  <div className="flex items-center justify-center mb-4">
                    <input
                      type="checkbox"
                      id="terms-checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      checked={termsAccepted}
                    />
                    <label htmlFor="terms-checkbox" className="ml-2 block text-sm text-black">
                      J'accepte les <button 
                        type="button" 
                        className="text-blue-600 hover:underline focus:outline-none"
                        onClick={() => setShowTermsModal(true)}
                      >
                        conditions d'utilisation
                      </button>
                    </label>
                  </div>
                  
                  <button
                    onClick={handleFinish}
                    disabled={!termsAccepted}
                    className={`px-6 py-3 ${!termsAccepted ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'} rounded-md mx-auto`}
                  >
                    Démarrer la synchronisation
                  </button>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-center mb-4">Synchronisation en cours...</p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-black text-center">{syncProgress}% terminé</p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className={`flex items-center px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-50 ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={syncing}
                >
                  Retour
                </button>
                <div></div> {/* Spacer */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal des conditions d'utilisation */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Conditions d'utilisation pour les vendeurs</h2>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-black hover:text-black focus:outline-none"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3">1. Objet</h3>
                <p className="text-black">
                  Ces conditions définissent les règles et obligations des vendeurs qui synchronisent leur site avec FAET et acceptent que leurs produits soient affichés et utilisés pour la vente sans intervention directe sur leurs sites.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3">2. Synchronisation et récupération des données</h3>
                <ul className="list-disc pl-5 text-black space-y-2">
                  <li>En synchronisant leur site avec FAET les vendeurs autorisent la récupération automatique des informations de leurs produits (images, prix, descriptions, etc.).</li>
                  <li>FAET n'effectue aucune modification ou intervention sur le site du vendeur. Seules les données affichées sur FAET sont utilisées pour la vente.</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3">3. Responsabilité du vendeur</h3>
                <ul className="list-disc pl-5 text-black space-y-2">
                  <li>Les vendeurs garantissent que les produits et les informations récupérées sont conformes aux réglementations en vigueur.</li>
                  <li>Toute modification des produits ou des prix sur le site du vendeur est sous sa responsabilité exclusive.</li>
                  <li>Le vendeur s'engage à fournir des informations précises et à jour sur ses produits afin d'assurer une expérience utilisateur optimale sur FAET.</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3">4. Responsabilité de FAET</h3>
                <ul className="list-disc pl-5 text-black space-y-2">
                  <li>FAET agit uniquement comme un intermédiaire et ne peut être tenu responsable des erreurs ou omissions dans les données des vendeurs.</li>
                  <li>En cas de litige sur les produits affichés, la responsabilité revient au vendeur, qui devra résoudre le problème.</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3">5. Propriété intellectuelle</h3>
                <ul className="list-disc pl-5 text-black space-y-2">
                  <li>Les vendeurs conservent tous les droits de propriété intellectuelle sur leurs contenus.</li>
                  <li>En synchronisant leurs produits avec FAET, ils accordent une licence d'utilisation non exclusive permettant à la plateforme d'afficher les informations à des fins commerciales.</li>
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3">6. Modification des conditions</h3>
                <p className="text-black">
                  FAET se réserve le droit de modifier les présentes conditions. Les vendeurs seront informés des changements et devront accepter les nouvelles conditions pour continuer à utiliser la plateforme.
                </p>
              </section>

              <section className="mb-6">
                <h3 className="text-lg font-semibold mb-3">7. Résiliation</h3>
                <ul className="list-disc pl-5 text-black space-y-2">
                  <li>Les vendeurs peuvent à tout moment demander la suppression de leur compte.</li>
                  <li>En cas de non-respect des présentes conditions, FAET se réserve le droit de suspendre ou de résilier l'accès à ses services.</li>
                </ul>
              </section>
            </div>
            
            <div className="sticky bottom-0 bg-white p-4 border-t">
              <button 
                onClick={() => setShowTermsModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}