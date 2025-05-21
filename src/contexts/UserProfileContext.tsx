'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './SupabaseAuthContext';
import { setUserProfileCache, setUpdateProfileCallback } from '@/lib/userPlan';
import { syncStoreInfoToProfile, syncProfileToStoreInfo } from '@/lib/storeProfileSync';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  company?: string;
  selectedPlan: 'ville' | 'region' | 'pays';
  productTypes?: string[];
  address?: string;
  // Information sur la boutique
  storeUrl?: string;
  storeName?: string;
  storeAddress?: string;
  storeCreatedAt?: string; // Date de création de la boutique
  createdAt: string; // Date de création du profil utilisateur
  updatedAt: string;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  fullName: '',
  selectedPlan: 'ville',
  storeUrl: '',
  storeName: '',
  storeAddress: '',
  storeCreatedAt: '',
  createdAt: '',
  updatedAt: ''
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  
  // Initialiser le callback pour updateUserPlan
  useEffect(() => {
    // Fournir le callback de mise à jour du profil au module userPlan
    setUpdateProfileCallback(async (updates) => {
      if (profile) {
        await updateProfile(updates);
      }
    });
    
    // Nettoyer le callback lors du démontage du composant
    return () => setUpdateProfileCallback(null);
  }, []);

  // Convertir les données utilisateur de Supabase en profil utilisateur
  const mapUserToProfile = (userData: any): UserProfile => {
    if (!userData) return DEFAULT_PROFILE;
    
    const metadata = userData.user_metadata || {};
    const firstName = metadata.first_name || '';
    const lastName = metadata.last_name || '';
    
    return {
      id: userData.id || '',
      email: userData.email || '',
      firstName: firstName,
      lastName: lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      phone: metadata.phone || '',
      avatar: metadata.avatar_url || '',
      company: metadata.company || '',
      selectedPlan: metadata.selected_plan || 'ville',
      productTypes: metadata.product_types || [],
      address: metadata.address || '',
      // Informations sur la boutique
      storeUrl: metadata.store_url || '',
      storeName: metadata.store_name || '',
      storeAddress: metadata.store_address || '',
      createdAt: userData.created_at || new Date().toISOString(),
      updatedAt: userData.updated_at || new Date().toISOString()
    };
  };

  // Fonction pour charger le profil utilisateur avec timeout de sécurité
  const loadProfile = async (forceRefresh = false): Promise<void> => {
    // Timeout de sécurité pour éviter un blocage infini
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Timeout de chargement du profil dépassé');
        setLoading(false);
        setError(new Error('Le chargement du profil a pris trop de temps. Veuillez réessayer.'));
      }
    }, 7000); // 7 secondes maximum pour le chargement
    try {
      // Réinitialiser l'erreur au début
      setError(null);
      
      // Ne pas charger si aucun utilisateur n'est connecté
      if (!user) {
        console.log('Aucun utilisateur connecté, profil non chargé');
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // Limiter les rechargements fréquents (pas plus d'une fois toutes les 5 secondes) sauf si forceRefresh est true
      const now = Date.now();
      if (!forceRefresh && now - lastSyncTime < 5000 && profile) {
        console.log('Profil déjà chargé récemment, utilisation du cache');
        return;
      }
      
      console.log('Chargement du profil utilisateur depuis Supabase...');
      setLastSyncTime(now);
      setLoading(true);
      
      // Récupérer les informations utilisateur depuis Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (userData && userData.user) {
        // Récupérer d'éventuelles informations complémentaires depuis une table profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = pas de résultat (normal si nouveau user)
          console.warn('Erreur lors de la récupération des données de profil:', profileError);
        }
        
        // Combiner les données utilisateur et le profil
        const combinedProfile = mapUserToProfile(userData.user);
        
        if (profileData) {
          // Ajouter les données supplémentaires du profil si elles existent
          Object.assign(combinedProfile, {
            phone: profileData.phone || combinedProfile.phone,
            company: profileData.company || combinedProfile.company,
            address: profileData.address || combinedProfile.address,
            // Ajouter les données de la boutique depuis le profil Supabase si elles existent
            storeUrl: profileData.store_url || combinedProfile.storeUrl,
            storeName: profileData.store_name || combinedProfile.storeName,
            storeAddress: profileData.store_address || combinedProfile.storeAddress
          });
        }
        
        // Synchroniser avec les informations de boutique depuis le localStorage
        const profileWithStoreInfo = syncStoreInfoToProfile(combinedProfile);
        
        setProfile(profileWithStoreInfo);
        
        // Mettre à jour le cache du profil utilisateur dans le module userPlan
        setUserProfileCache(profileWithStoreInfo);
        
        // Synchroniser avec localStorage pour la compatibilité avec l'ancien système
        if (typeof window !== 'undefined') {
          localStorage.setItem('faet_user', JSON.stringify({
            id: combinedProfile.id,
            fullName: combinedProfile.fullName,
            email: combinedProfile.email,
            productTypes: combinedProfile.productTypes,
            selectedPlan: combinedProfile.selectedPlan
          }));
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du profil:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
      // Nettoyer le timeout
      clearTimeout(loadingTimeout);
    }
  };

  // Mettre à jour le profil utilisateur
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error("Non authentifié ou profil non chargé");
    }
    
    setLoading(true);

    try {
      setLoading(true);
      
      // Préparer les données pour la mise à jour de Supabase Auth
      const authData: any = {};
      
      // Mapper les champs du profil aux champs d'authentification Supabase
      if (updates.firstName !== undefined) authData.first_name = updates.firstName;
      if (updates.lastName !== undefined) authData.last_name = updates.lastName;
      if (updates.productTypes !== undefined) authData.product_types = updates.productTypes;
      if (updates.selectedPlan !== undefined) authData.selected_plan = updates.selectedPlan;
      
      // Mettre à jour les métadonnées d'authentification si nécessaire
      if (Object.keys(authData).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: authData
        });
        
        if (authError) throw authError;
      }
      
      // Vérifier si une table profiles existe et si oui, mettre à jour ou créer le profil
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id);
        
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.warn('Erreur lors de la vérification du profil:', profileCheckError);
      }
      
      // Préparer les données pour la table profiles
      const profileUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
      if (updates.company !== undefined) profileUpdates.company = updates.company;
      if (updates.address !== undefined) profileUpdates.address = updates.address;
      
      // Mise à jour ou insertion dans la table profiles
      if (profileData && profileData.length > 0) {
        // Le profil existe, le mettre à jour
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);
          
        if (updateError) throw updateError;
      } else {
        // Le profil n'existe pas, le créer
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            ...profileUpdates,
            created_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      }
      
      // Si des informations de boutique sont mises à jour, les synchroniser également
      if (updates.storeUrl || updates.storeName || updates.storeAddress) {
        // Créer un objet temporaire avec les données actuelles et les mises à jour
        const tempProfile = { ...profile, ...updates };
        // Synchroniser vers le localStorage
        syncProfileToStoreInfo(tempProfile);
      }
      
      // Rafraîchir le profil
      await loadProfile();
      
      // Mettre à jour le localStorage pour compatibilité
      if (profile && typeof window !== 'undefined') {
        const updatedProfile = { ...profile, ...updates };
        localStorage.setItem('faet_user', JSON.stringify({
          id: updatedProfile.id,
          fullName: `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim(),
          email: updatedProfile.email,
          productTypes: updatedProfile.productTypes,
          selectedPlan: updatedProfile.selectedPlan
        }));
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir le profil manuellement
  const refreshProfile = async (): Promise<void> => {
    try {
      console.log('Rafraîchissement du profil demandé');
      await loadProfile(true);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du profil:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Effet pour charger le profil au démarrage ou quand l'utilisateur change
  useEffect(() => {
    loadProfile();
    
    // Mettre en place un écouteur d'événements pour les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Événement d\'authentification détecté:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Recharger le profil avec les nouvelles données
        await loadProfile(true);
      } else if (event === 'SIGNED_OUT') {
        // Effacer le profil
        setProfile(null);
      }
    });
    
    // Nettoyer l'écouteur d'événements
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [user]);

  // Écouter les changements d'authentification en temps réel
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });
    
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
