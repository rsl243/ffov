import { supabase } from './supabase';

// Types des préférences utilisateur
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en' | 'es' | 'de';
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: 'EUR' | 'USD' | 'GBP' | 'CAD';
}

// Préférences par défaut
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'fr',
  notificationsEnabled: true,
  emailNotifications: true,
  timezone: 'Europe/Paris',
  dateFormat: 'DD/MM/YYYY',
  currency: 'EUR'
};

/**
 * Récupère les préférences de l'utilisateur
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return DEFAULT_PREFERENCES;
    }
    
    // Récupérer les préférences depuis la table 'user_preferences'
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Erreur lors de la récupération des préférences:', error);
      return DEFAULT_PREFERENCES;
    }
    
    // Si aucune préférence trouvée, retourner les préférences par défaut
    if (!data) {
      return DEFAULT_PREFERENCES;
    }
    
    // Fusionner les préférences par défaut avec celles de l'utilisateur
    return {
      ...DEFAULT_PREFERENCES,
      theme: data.theme || DEFAULT_PREFERENCES.theme,
      language: data.language || DEFAULT_PREFERENCES.language,
      notificationsEnabled: data.notifications_enabled !== undefined ? data.notifications_enabled : DEFAULT_PREFERENCES.notificationsEnabled,
      emailNotifications: data.email_notifications !== undefined ? data.email_notifications : DEFAULT_PREFERENCES.emailNotifications,
      timezone: data.timezone || DEFAULT_PREFERENCES.timezone,
      dateFormat: data.date_format || DEFAULT_PREFERENCES.dateFormat,
      currency: data.currency || DEFAULT_PREFERENCES.currency
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences utilisateur:', error);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Met à jour les préférences de l'utilisateur
 */
export const updateUserPreferences = async (updates: Partial<UserPreferences>): Promise<UserPreferences> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Convertir les préférences au format de la base de données
    const dbUpdates: Record<string, any> = {
      theme: updates.theme,
      language: updates.language,
      notifications_enabled: updates.notificationsEnabled,
      email_notifications: updates.emailNotifications,
      timezone: updates.timezone,
      date_format: updates.dateFormat,
      currency: updates.currency,
      updated_at: new Date().toISOString()
    };
    
    // Supprimer les valeurs undefined
    Object.keys(dbUpdates).forEach(key => {
      if (dbUpdates[key] === undefined) {
        delete dbUpdates[key];
      }
    });
    
    // Vérifier si un enregistrement existe déjà pour cet utilisateur
    const { data: existingData, error: checkError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id);
    
    if (checkError) {
      console.warn('Erreur lors de la vérification des préférences existantes:', checkError);
    }
    
    // Mettre à jour ou insérer les préférences
    let result;
    if (existingData && existingData.length > 0) {
      result = await supabase
        .from('user_preferences')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .select('*')
        .single();
    } else {
      result = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          ...dbUpdates,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();
    }
    
    if (result.error) {
      throw result.error;
    }
    
    // Stocker également dans le localStorage pour un accès rapide
    if (typeof window !== 'undefined') {
      const currentPrefs = localStorage.getItem('user_preferences') 
        ? JSON.parse(localStorage.getItem('user_preferences') || '{}')
        : {};
        
      localStorage.setItem('user_preferences', JSON.stringify({
        ...currentPrefs,
        ...updates
      }));
    }
    
    // Récupérer les préférences mises à jour
    return await getUserPreferences();
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences utilisateur:', error);
    throw error;
  }
};

/**
 * Charge les préférences utilisateur à partir du localStorage (plus rapide)
 * Utilise les préférences par défaut si aucune préférence n'est trouvée
 */
export const getLocalUserPreferences = (): UserPreferences => {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  
  const storedPrefs = localStorage.getItem('user_preferences');
  if (!storedPrefs) {
    return DEFAULT_PREFERENCES;
  }
  
  try {
    const parsedPrefs = JSON.parse(storedPrefs);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsedPrefs
    };
  } catch (error) {
    console.warn('Erreur lors de la lecture des préférences locales:', error);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Applique le thème choisi par l'utilisateur
 */
export const applyUserTheme = (theme: 'light' | 'dark' | 'system'): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  const root = window.document.documentElement;
  
  // Supprimer les anciennes classes de thème
  root.classList.remove('light', 'dark');
  
  // Ajouter la nouvelle classe de thème
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
  
  // Stocker dans localStorage
  localStorage.setItem('theme', theme);
};

/**
 * Applique la langue choisie par l'utilisateur
 */
export const applyUserLanguage = (language: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Stocker dans localStorage pour les pages qui en ont besoin
  localStorage.setItem('language', language);
  
  // Mettre à jour l'attribut lang du HTML
  document.documentElement.setAttribute('lang', language);
};
