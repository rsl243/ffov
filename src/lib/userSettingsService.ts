import { supabase } from './supabase';

// Types pour les paramètres utilisateur
export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
  emailNotifications: boolean;
  smsNotifications: boolean;
  dashboardLayout: 'default' | 'compact' | 'expanded';
  defaultView: 'dashboard' | 'sales' | 'clients' | 'marketing' | 'analytics' | 'finance';
  currency: 'EUR' | 'USD' | 'GBP';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '24h' | '12h';
  createdAt: string;
  updatedAt: string;
}

// Paramètres par défaut
const defaultSettings: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: 'system',
  language: 'fr',
  emailNotifications: true,
  smsNotifications: false,
  dashboardLayout: 'default',
  defaultView: 'dashboard',
  currency: 'EUR',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h'
};

/**
 * Récupérer les paramètres de l'utilisateur actuel
 */
export const getUserSettings = async (): Promise<UserSettings | null> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer les paramètres de l'utilisateur
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      // Si l'erreur est "No rows found", créer les paramètres par défaut
      if (error.code === 'PGRST116') {
        return await createDefaultUserSettings(user.id);
      }
      
      console.error('Erreur lors de la récupération des paramètres utilisateur:', error);
      throw error;
    }
    
    // Formater et retourner les paramètres
    return {
      id: data.id,
      userId: data.user_id,
      theme: data.theme || defaultSettings.theme,
      language: data.language || defaultSettings.language,
      emailNotifications: data.email_notifications ?? defaultSettings.emailNotifications,
      smsNotifications: data.sms_notifications ?? defaultSettings.smsNotifications,
      dashboardLayout: data.dashboard_layout || defaultSettings.dashboardLayout,
      defaultView: data.default_view || defaultSettings.defaultView,
      currency: data.currency || defaultSettings.currency,
      dateFormat: data.date_format || defaultSettings.dateFormat,
      timeFormat: data.time_format || defaultSettings.timeFormat,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres utilisateur:', error);
    return null;
  }
};

/**
 * Créer les paramètres par défaut pour un nouvel utilisateur
 */
export const createDefaultUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const now = new Date().toISOString();
    
    // Créer les paramètres par défaut
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        theme: defaultSettings.theme,
        language: defaultSettings.language,
        email_notifications: defaultSettings.emailNotifications,
        sms_notifications: defaultSettings.smsNotifications,
        dashboard_layout: defaultSettings.dashboardLayout,
        default_view: defaultSettings.defaultView,
        currency: defaultSettings.currency,
        date_format: defaultSettings.dateFormat,
        time_format: defaultSettings.timeFormat,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création des paramètres utilisateur par défaut:', error);
      throw error;
    }
    
    // Formater et retourner les paramètres
    return {
      id: data.id,
      userId: data.user_id,
      theme: data.theme,
      language: data.language,
      emailNotifications: data.email_notifications,
      smsNotifications: data.sms_notifications,
      dashboardLayout: data.dashboard_layout,
      defaultView: data.default_view,
      currency: data.currency,
      dateFormat: data.date_format,
      timeFormat: data.time_format,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Erreur lors de la création des paramètres utilisateur par défaut:', error);
    return null;
  }
};

/**
 * Mettre à jour les paramètres de l'utilisateur
 */
export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings | null> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Formater les données pour Supabase
    const updateData = {
      theme: settings.theme,
      language: settings.language,
      email_notifications: settings.emailNotifications,
      sms_notifications: settings.smsNotifications,
      dashboard_layout: settings.dashboardLayout,
      default_view: settings.defaultView,
      currency: settings.currency,
      date_format: settings.dateFormat,
      time_format: settings.timeFormat,
      updated_at: new Date().toISOString()
    };
    
    // Supprimer les propriétés undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    
    // Mettre à jour les paramètres
    const { data, error } = await supabase
      .from('user_settings')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la mise à jour des paramètres utilisateur:', error);
      throw error;
    }
    
    // Formater et retourner les paramètres mis à jour
    return {
      id: data.id,
      userId: data.user_id,
      theme: data.theme,
      language: data.language,
      emailNotifications: data.email_notifications,
      smsNotifications: data.sms_notifications,
      dashboardLayout: data.dashboard_layout,
      defaultView: data.default_view,
      currency: data.currency,
      dateFormat: data.date_format,
      timeFormat: data.time_format,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres utilisateur:', error);
    return null;
  }
};

/**
 * Appliquer les préférences de thème de l'utilisateur
 */
export const applyUserTheme = async (): Promise<void> => {
  try {
    const settings = await getUserSettings();
    
    if (!settings) return;
    
    const theme = settings.theme;
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Si le thème est "system", vérifier les préférences du système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'application du thème utilisateur:', error);
  }
};

/**
 * Formater la date selon les préférences de l'utilisateur
 */
export const formatDateForUser = async (date: Date | string): Promise<string> => {
  try {
    const settings = await getUserSettings();
    
    if (!settings) {
      // Format par défaut
      return new Date(date).toLocaleDateString('fr-FR');
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (settings.dateFormat) {
      case 'DD/MM/YYYY':
        return dateObj.toLocaleDateString('fr-FR');
      case 'MM/DD/YYYY':
        return dateObj.toLocaleDateString('en-US');
      case 'YYYY-MM-DD':
        return dateObj.toISOString().split('T')[0];
      default:
        return dateObj.toLocaleDateString('fr-FR');
    }
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return new Date(date).toLocaleDateString('fr-FR');
  }
};

/**
 * Formater l'heure selon les préférences de l'utilisateur
 */
export const formatTimeForUser = async (time: Date | string): Promise<string> => {
  try {
    const settings = await getUserSettings();
    
    if (!settings) {
      // Format par défaut
      return new Date(time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    
    const timeObj = typeof time === 'string' ? new Date(time) : time;
    
    switch (settings.timeFormat) {
      case '24h':
        return timeObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      case '12h':
        return timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      default:
        return timeObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
  } catch (error) {
    console.error('Erreur lors du formatage de l\'heure:', error);
    return new Date(time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
};

/**
 * Formater un montant selon les préférences de devise de l'utilisateur
 */
export const formatCurrencyForUser = async (amount: number): Promise<string> => {
  try {
    const settings = await getUserSettings();
    
    if (!settings) {
      // Format par défaut (EUR)
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    }
    
    switch (settings.currency) {
      case 'EUR':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
      case 'USD':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
      case 'GBP':
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
      default:
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    }
  } catch (error) {
    console.error('Erreur lors du formatage du montant:', error);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
};
