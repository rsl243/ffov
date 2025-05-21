'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  DEFAULT_PREFERENCES, 
  UserPreferences, 
  getUserPreferences, 
  updateUserPreferences,
  getLocalUserPreferences,
  applyUserTheme,
  applyUserLanguage
} from '@/lib/userPreferencesService';
import { useUserProfile } from './UserProfileContext';

interface UserPreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  error: Error | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  setLanguage: (language: 'fr' | 'en' | 'es' | 'de') => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Charger les préférences utilisateur
  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      // D'abord charger depuis le localStorage pour une réponse rapide
      const localPrefs = getLocalUserPreferences();
      setPreferences(localPrefs);
      
      // Appliquer les préférences visuelles immédiatement
      applyUserTheme(localPrefs.theme);
      applyUserLanguage(localPrefs.language);
      
      // Si l'utilisateur est connecté, charger depuis la base de données
      if (profile) {
        const dbPrefs = await getUserPreferences();
        setPreferences(dbPrefs);
        
        // Si les préférences de la base de données sont différentes, appliquer les nouvelles
        if (dbPrefs.theme !== localPrefs.theme) {
          applyUserTheme(dbPrefs.theme);
        }
        if (dbPrefs.language !== localPrefs.language) {
          applyUserLanguage(dbPrefs.language);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des préférences:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour les préférences utilisateur
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      setLoading(true);
      
      // Mise à jour locale immédiate pour une UI réactive
      setPreferences(prevPrefs => ({
        ...prevPrefs,
        ...updates
      }));
      
      // Appliquer les changements visuels immédiatement si nécessaire
      if (updates.theme) {
        applyUserTheme(updates.theme);
      }
      
      if (updates.language) {
        applyUserLanguage(updates.language);
      }
      
      // Si l'utilisateur est connecté, persister dans la base de données
      if (profile) {
        await updateUserPreferences(updates);
      } else {
        // Sinon, stocker uniquement dans localStorage
        const currentPrefs = getLocalUserPreferences();
        localStorage.setItem('user_preferences', JSON.stringify({
          ...currentPrefs,
          ...updates
        }));
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des préférences:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Recharger les préférences en cas d'erreur pour revenir à l'état précédent
      await loadPreferences();
    } finally {
      setLoading(false);
    }
  };

  // Définir le thème (raccourci)
  const setTheme = async (theme: 'light' | 'dark' | 'system') => {
    await updatePreferences({ theme });
  };

  // Définir la langue (raccourci)
  const setLanguage = async (language: 'fr' | 'en' | 'es' | 'de') => {
    await updatePreferences({ language });
  };

  // Charger les préférences au démarrage et quand le profil change
  useEffect(() => {
    loadPreferences();
  }, [profile?.id]);

  return (
    <UserPreferencesContext.Provider value={{
      preferences,
      loading,
      error,
      updatePreferences,
      setTheme,
      setLanguage
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error("useUserPreferences doit être utilisé à l'intérieur d'un UserPreferencesProvider");
  }
  return context;
};
