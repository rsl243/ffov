"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { signIn, signOut, signUp, getCurrentUser, updateUserProfile, supabase } from '@/lib/supabase';
import { initSessionTracking, cleanupSessionTracking, isSessionExpired, updateLastActivity } from '@/lib/sessionManager';

// Type personnalisé qui étend User de Supabase pour les données spécifiques à FFOV
interface FFOVUser extends User {
  user_metadata: {
    first_name: string;
    last_name: string;
    position?: string;
    product_types?: string[];
    selected_plan?: 'ville' | 'region' | 'pays';
    full_name?: string;
  };
}

interface AuthContextType {
  user: FFOVUser | null;
  loading: boolean;
  error: Error | null;
  register: (email: string, password: string, firstName: string, lastName: string, selectedPlan: 'ville' | 'region' | 'pays') => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: { first_name?: string; last_name?: string; position?: string; email?: string; phone?: string; product_types?: string[]; }) => Promise<void>;
  updateUserPlan: (plan: 'ville' | 'region' | 'pays') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FFOVUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté
    const checkUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser() as FFOVUser | null;
        
        // Pour la compatibilité, vérifier aussi le localStorage
        const storedUser = typeof window !== 'undefined' 
          ? localStorage.getItem('faet_user') 
          : null;
          
        if (currentUser) {
          setUser(currentUser);
          
          // Synchroniser avec localStorage pour la compatibilité avec l'ancien système
          if (typeof window !== 'undefined') {
            const userData = {
              id: currentUser.id,
              fullName: `${currentUser.user_metadata?.first_name || ''} ${currentUser.user_metadata?.last_name || ''}`.trim(),
              email: currentUser.email || '',
              position: currentUser.user_metadata?.position,
              productTypes: currentUser.user_metadata?.product_types,
              selectedPlan: currentUser.user_metadata?.selected_plan
            };
            localStorage.setItem('faet_user', JSON.stringify(userData));
          }
        } else if (storedUser) {
          // Utiliser les données du localStorage comme fallback
          const parsedUser = JSON.parse(storedUser);
          console.log('Utilisateur chargé depuis localStorage:', parsedUser);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification de l'utilisateur:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    selectedPlan: 'ville' | 'region' | 'pays'
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      console.log('INSCRIPTION AVEC CONTEXTE:', { email, firstName, lastName, selectedPlan });
      
      // Version simplifiée pour débugage
      try {
        // Étape 1: Créer l'utilisateur Supabase
        const authResponse = await signUp(email, password, firstName, lastName);
        console.log('RÉPONSE SUPABASE AUTH:', {
          success: !!authResponse,
          userId: authResponse?.user?.id,
          hasSession: !!authResponse?.session
        });
        
        if (!authResponse || !authResponse.user) {
          throw new Error('Aucun utilisateur créé suite à l\'inscription');
        }
        
        // Étape 2: Mise à jour du plan utilisateur
        const { data, error: updateError } = await supabase.auth.updateUser({
          data: { selected_plan: selectedPlan }
        });
        
        if (updateError) {
          console.error('Erreur lors de la mise à jour du plan:', updateError);
        } else {
          console.log('Plan utilisateur mis à jour avec succès');
        }
        
        // Étape 3: Enregistrement dans localStorage pour compatibilité
        if (typeof window !== 'undefined') {
          const userData = {
            id: authResponse.user.id,
            fullName: `${firstName} ${lastName}`,
            email: authResponse.user.email,
            selectedPlan
          };
          localStorage.setItem('faet_user', JSON.stringify(userData));
          console.log('Utilisateur enregistré dans localStorage');
        }
        
        // Étape 4: Mise à jour du contexte utilisateur
        if (data?.user) {
          setUser(data.user as FFOVUser);
          console.log('Contexte utilisateur mis à jour');
        } else if (authResponse.user) {
          setUser(authResponse.user as FFOVUser);
          console.log('Contexte utilisateur mis à jour depuis la réponse d\'authentification');
        }
      } catch (innerError) {
        console.error('Erreur interne lors de l\'inscription:', innerError);
        throw innerError;
      }
      
      return true;
    } catch (err) {
      console.error("Erreur lors de l'inscription:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Réinitialiser les données de session locales par sécurité
      updateLastActivity(); // Initialiser l'activité utilisateur
      
      // Tentative d'authentification
      try {
        const data = await signIn(email, password);
        const user = data.user;
        
        if (user) {
          // Pour la compatibilité, enregistrer dans localStorage
          if (typeof window !== 'undefined') {
            const userData = {
              id: user.id,
              fullName: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
              email: user.email || '',
              productTypes: user.user_metadata?.product_types,
              selectedPlan: user.user_metadata?.selected_plan
            };
            localStorage.setItem('faet_user', JSON.stringify(userData));
            console.log('Connexion réussie et données utilisateur enregistrées');
          }
          
          setUser(user as FFOVUser);
          return true;
        } else {
          setError(new Error('Impossible de récupérer les informations utilisateur.'));
          return false;
        }
      } catch (loginError) {
        // Traduction des erreurs techniques en messages utilisateur
        let errorMessage = 'Impossible de se connecter.';
        
        if (loginError instanceof Error) {
          const errorMsg = loginError.message;
          if (errorMsg.includes('Invalid login credentials')) {
            errorMessage = 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
          } else if (errorMsg.includes('Email not confirmed')) {
            errorMessage = 'Votre email n\'a pas été confirmé. Vérifiez votre boîte mail.';
          } else if (errorMsg.includes('rate limit')) {
            errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
          }
        }
        
        setError(new Error(errorMessage));
        return false;
      }
    } catch (err) {
      console.error("Erreur grave lors de la connexion:", err);
      setError(err instanceof Error ? err : new Error('Une erreur inconnue est survenue lors de la connexion.'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Déconnecter l'utilisateur via Supabase
      await signOut();
      
      // Nettoyer toutes les données utilisateur du localStorage
      if (typeof window !== 'undefined') {
        // Données de base
        localStorage.removeItem('faet_user');
        
        // Préférences utilisateur
        localStorage.removeItem('user_preferences');
        
        // Thème et langue (conservés pour les utilisateurs non connectés)
        // localStorage.removeItem('theme');
        // localStorage.removeItem('language');
        
        // Jetons d'authentification (déjà nettoyés par Supabase mais vérification supplémentaire)
        localStorage.removeItem('supabase.auth.token');
        
        // Données de cache
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache_') || key.startsWith('user_data_')) {
            localStorage.removeItem(key);
          }
        });
        
        console.log('Toutes les données utilisateur ont été nettoyées du localStorage');
      }
      
      // Réinitialiser l'état de l'utilisateur
      setUser(null);
      
      // Rediriger vers la page de connexion
      router.push('/connexion');
    } catch (err) {
      console.error("Erreur de déconnexion:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { 
    first_name?: string; 
    last_name?: string; 
    position?: string; 
    email?: string; 
    phone?: string; 
  }) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await updateUserProfile(updates);
      
      if (updatedUser && typeof window !== 'undefined') {
        // Mettre à jour aussi dans le localStorage
        const storedUser = localStorage.getItem('faet_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const userData = {
            ...parsedUser,
            fullName: updates.first_name || updates.last_name 
              ? `${updates.first_name || parsedUser.first_name || ''} ${updates.last_name || parsedUser.last_name || ''}`.trim()
              : parsedUser.fullName,
            email: updates.email || parsedUser.email,
            position: updates.position || parsedUser.position
          };
          localStorage.setItem('faet_user', JSON.stringify(userData));
        }
      }
      
      setUser(updatedUser as FFOVUser);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserPlan = async (plan: 'ville' | 'region' | 'pays') => {
    try {
      setLoading(true);
      setError(null);
      
      // Mise à jour des métadonnées utilisateur
      const { data } = await supabase.auth.updateUser({
        data: {
          selected_plan: plan
        }
      });
      
      // Mettre à jour aussi dans localStorage
      if (typeof window !== 'undefined' && user) {
        const storedUser = localStorage.getItem('faet_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          localStorage.setItem('faet_user', JSON.stringify({
            ...parsedUser,
            selectedPlan: plan
          }));
        }
      }
      
      setUser(data.user as FFOVUser);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du plan:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialiser le tracking de session
  useEffect(() => {
    // Initialiser le suivi d'activité utilisateur
    initSessionTracking();
    
    // Vérifier périodiquement si la session est expirée
    const sessionCheckInterval = setInterval(() => {
      if (user && isSessionExpired()) {
        console.log('Session expirée après inactivité. Déconnexion automatique.');
        logout(); // Déconnecter l'utilisateur
      }
    }, 60000); // Vérifier toutes les minutes
    
    // Nettoyer les écouteurs lors du démontage
    return () => {
      cleanupSessionTracking();
      clearInterval(sessionCheckInterval);
    };
  }, [user]); // Dépend de l'utilisateur connecté
  
  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout, updateProfile, updateUserPlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un SupabaseAuthProvider");
  }
  return context;
};
