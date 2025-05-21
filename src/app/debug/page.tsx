"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Link from 'next/link';

export default function DebugPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [fixResult, setFixResult] = useState<string>('');
  const [showFixButton, setShowFixButton] = useState(false);

  useEffect(() => {
    const checkDatabaseState = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Importer Supabase ici pour éviter les problèmes de rendu côté serveur
        const { supabase } = await import('@/lib/supabase');
        
        const results: any = {
          userId: user.id,
          email: user.email,
          metadata: user.user_metadata || {},
          checks: {}
        };
        
        // 1. Vérifier si le profil utilisateur existe
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        results.checks.userProfile = {
          exists: !!userProfile,
          data: userProfile,
          error: profileError ? profileError.message : null
        };
        
        // 2. Vérifier si l'utilisateur est membre d'une organisation
        const { data: orgMembers, error: orgMemberError } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id);
          
        results.checks.organizationMemberships = {
          count: orgMembers?.length || 0,
          data: orgMembers,
          error: orgMemberError ? orgMemberError.message : null
        };
        
        // 3. Vérifier les organisations auxquelles l'utilisateur appartient
        const organizations = [];
        
        if (orgMembers && orgMembers.length > 0) {
          for (const member of orgMembers) {
            const { data: org } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', member.organization_id)
              .single();
              
            if (org) {
              organizations.push(org);
            }
          }
        }
        
        results.checks.organizations = {
          count: organizations.length,
          data: organizations
        };
        
        // 4. Vérifier les informations de boutique pour chaque organisation
        const stores = [];
        
        if (organizations.length > 0) {
          for (const org of organizations) {
            const { data: storeInfo } = await supabase
              .from('store_info')
              .select('*')
              .eq('organization_id', org.id);
              
            if (storeInfo && storeInfo.length > 0) {
              stores.push(...storeInfo);
            }
          }
        }
        
        results.checks.stores = {
          count: stores.length,
          data: stores
        };
        
        // 5. Vérifier les types de produits de l'utilisateur
        const { data: productTypes } = await supabase
          .from('user_product_types')
          .select('*')
          .eq('user_id', user.id);
          
        results.checks.productTypes = {
          count: productTypes?.length || 0,
          data: productTypes
        };
        
        // Vérifier s'il y a des problèmes qui nécessitent une correction
        setShowFixButton(
          !results.checks.userProfile.exists || 
          results.checks.organizationMemberships.count === 0
        );
        
        setDebugInfo(results);
      } catch (error) {
        console.error('Erreur lors du débogage:', error);
        setDebugInfo({ error: String(error) });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkDatabaseState();
  }, [user]);
  
  const fixDatabase = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      let result = '';
      
      // Importer Supabase ici pour éviter les problèmes de rendu côté serveur
      const { supabase } = await import('@/lib/supabase');
      
      // 1. Réparer le profil utilisateur s'il n'existe pas
      if (!debugInfo.checks.userProfile.exists) {
        result += '• Création du profil utilisateur...\n';
        
        const userMetadata = user.user_metadata || {};
        
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            first_name: userMetadata.first_name || '',
            last_name: userMetadata.last_name || '',
            email: user.email || '',
            position: userMetadata.position || '',
            selected_plan: userMetadata.selected_plan || 'ville',
            status: 'active'
          });
          
        if (insertError) {
          result += `  ✘ Échec: ${insertError.message}\n`;
        } else {
          result += '  ✓ Succès\n';
        }
      }
      
      // 2. Si aucune organisation n'existe, en créer une
      if (debugInfo.checks.organizationMemberships.count === 0) {
        result += '• Création d\'une organisation par défaut...\n';
        
        // Récupérer les infos de la boutique depuis le localStorage
        let storeName = 'Ma boutique';
        let storeUrl = 'https://maboutique.com';
        let storeAddress = '';
        
        if (typeof window !== 'undefined') {
          const storeInfo = localStorage.getItem('store_info');
          if (storeInfo) {
            try {
              const parsedInfo = JSON.parse(storeInfo);
              storeName = parsedInfo.siteName || storeName;
              storeUrl = parsedInfo.websiteUrl || storeUrl;
              storeAddress = parsedInfo.storeAddress || storeAddress;
            } catch (e) {
              console.error('Erreur lors de la lecture des infos boutique:', e);
            }
          }
        }
        
        // Créer l'organisation
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: storeName,
            legal_name: storeName,
            address: storeAddress,
            website_url: storeUrl,
            status: 'draft'
          })
          .select();
          
        if (orgError) {
          result += `  ✘ Échec de création de l'organisation: ${orgError.message}\n`;
        } else {
          result += '  ✓ Organisation créée\n';
          
          // Créer la relation utilisateur-organisation
          const organizationId = orgData[0].id;
          
          const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
              organization_id: organizationId,
              user_id: user.id,
              role: 'owner'
            });
            
          if (memberError) {
            result += `  ✘ Échec de création de la relation utilisateur-organisation: ${memberError.message}\n`;
          } else {
            result += '  ✓ Relation utilisateur-organisation créée\n';
          }
          
          // Créer les infos boutique
          const { error: storeError } = await supabase
            .from('store_info')
            .insert({
              organization_id: organizationId,
              site_name: storeName,
              site_url: storeUrl,
              last_sync: new Date().toISOString(),
              is_syncing: false
            });
            
          if (storeError) {
            result += `  ✘ Échec de création des infos boutique: ${storeError.message}\n`;
          } else {
            result += '  ✓ Infos boutique créées\n';
          }
        }
      }
      
      setFixResult(result);
      
      // Rafraîchir les données
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la réparation:', error);
      setFixResult(`Erreur: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-800">Analyse de la base de données...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Vous n'êtes pas connecté</h1>
          <p className="mb-6">Vous devez être connecté pour utiliser cet outil de diagnostic.</p>
          <Link href="/connexion" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Diagnostic de la base de données</h1>
            <div className="flex space-x-3">
              {showFixButton && (
                <button 
                  onClick={fixDatabase}
                  className="px-4 py-2 bg-green-600 text-white rounded-md"
                  disabled={isLoading}
                >
                  Réparer les problèmes
                </button>
              )}
              <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-md">
                Retour au tableau de bord
              </Link>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Informations utilisateur</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <div><strong>ID :</strong> {debugInfo.userId}</div>
              <div><strong>Email :</strong> {debugInfo.email}</div>
              <div>
                <strong>Métadonnées :</strong>{' '}
                <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(debugInfo.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          
          {debugInfo.checks && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Profil utilisateur</h2>
                  <div className={`p-4 rounded-md ${debugInfo.checks.userProfile.exists ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div>
                      <strong>Statut :</strong>{' '}
                      {debugInfo.checks.userProfile.exists ? (
                        <span className="text-green-600">Existe</span>
                      ) : (
                        <span className="text-red-600">N'existe pas</span>
                      )}
                    </div>
                    {debugInfo.checks.userProfile.error && (
                      <div className="text-red-600 mt-2">
                        <strong>Erreur :</strong> {debugInfo.checks.userProfile.error}
                      </div>
                    )}
                    {debugInfo.checks.userProfile.data && (
                      <pre className="bg-white p-2 rounded mt-2 overflow-auto text-sm">
                        {JSON.stringify(debugInfo.checks.userProfile.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-2">Appartenances aux organisations</h2>
                  <div className={`p-4 rounded-md ${debugInfo.checks.organizationMemberships.count > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div>
                      <strong>Nombre :</strong>{' '}
                      {debugInfo.checks.organizationMemberships.count > 0 ? (
                        <span className="text-green-600">{debugInfo.checks.organizationMemberships.count}</span>
                      ) : (
                        <span className="text-red-600">Aucune</span>
                      )}
                    </div>
                    {debugInfo.checks.organizationMemberships.error && (
                      <div className="text-red-600 mt-2">
                        <strong>Erreur :</strong> {debugInfo.checks.organizationMemberships.error}
                      </div>
                    )}
                    {debugInfo.checks.organizationMemberships.data && debugInfo.checks.organizationMemberships.data.length > 0 && (
                      <pre className="bg-white p-2 rounded mt-2 overflow-auto text-sm">
                        {JSON.stringify(debugInfo.checks.organizationMemberships.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Organisations</h2>
                  <div className={`p-4 rounded-md ${debugInfo.checks.organizations.count > 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div>
                      <strong>Nombre :</strong>{' '}
                      {debugInfo.checks.organizations.count > 0 ? (
                        <span className="text-green-600">{debugInfo.checks.organizations.count}</span>
                      ) : (
                        <span className="text-yellow-600">Aucune</span>
                      )}
                    </div>
                    {debugInfo.checks.organizations.data && debugInfo.checks.organizations.data.length > 0 && (
                      <pre className="bg-white p-2 rounded mt-2 overflow-auto text-sm">
                        {JSON.stringify(debugInfo.checks.organizations.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-2">Informations boutiques</h2>
                  <div className={`p-4 rounded-md ${debugInfo.checks.stores.count > 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div>
                      <strong>Nombre :</strong>{' '}
                      {debugInfo.checks.stores.count > 0 ? (
                        <span className="text-green-600">{debugInfo.checks.stores.count}</span>
                      ) : (
                        <span className="text-yellow-600">Aucune</span>
                      )}
                    </div>
                    {debugInfo.checks.stores.data && debugInfo.checks.stores.data.length > 0 && (
                      <pre className="bg-white p-2 rounded mt-2 overflow-auto text-sm">
                        {JSON.stringify(debugInfo.checks.stores.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          
          {fixResult && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Résultat de la réparation</h2>
              <pre className="bg-black text-green-400 p-4 rounded-md overflow-auto">
                {fixResult}
                {isLoading && 'En cours...'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
