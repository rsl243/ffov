'use client';

// Types pour les données utilisateur
export interface StoreInfo {
  siteName: string;
  websiteUrl: string;
  storeAddress: string;
  createdAt: string;
}

export interface UserStoreData {
  storeInfo?: StoreInfo;
}

// Clé pour le stockage local
const USER_STORE_KEY = 'faet_user_store';

/**
 * Sauvegarde les données utilisateur dans le stockage local
 */
export const saveUserStoreData = (data: UserStoreData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Récupérer les données existantes
    const existingDataStr = localStorage.getItem(USER_STORE_KEY);
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : {};
    
    // Fusionner avec les nouvelles données
    const updatedData = { ...existingData, ...data };
    
    // Sauvegarder dans le stockage local
    localStorage.setItem(USER_STORE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
  }
};

/**
 * Sauvegarde les informations de la boutique
 */
export const saveStoreInfo = (siteName: string, websiteUrl: string, storeAddress: string): void => {
  const storeInfo: StoreInfo = {
    siteName,
    websiteUrl,
    storeAddress,
    createdAt: new Date().toISOString(),
  };
  
  saveUserStoreData({ storeInfo });
  
  // Sauvegarder également l'URL dans un cookie pour que l'API puisse y accéder
  if (typeof document !== 'undefined') {
    document.cookie = `faet_website_url=${encodeURIComponent(websiteUrl)};path=/;max-age=31536000`;
  }
};

/**
 * Récupère les données utilisateur du stockage local
 */
export const getUserStoreData = (): UserStoreData => {
  if (typeof window === 'undefined') return {};
  
  try {
    const dataStr = localStorage.getItem(USER_STORE_KEY);
    return dataStr ? JSON.parse(dataStr) : {};
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return {};
  }
};

/**
 * Récupère les informations de la boutique
 */
export const getStoreInfo = (): StoreInfo | undefined => {
  const userData = getUserStoreData();
  return userData.storeInfo;
};

/**
 * Récupère l'URL de la boutique
 */
export const getStoreUrl = (): string => {
  const storeInfo = getStoreInfo();
  return storeInfo?.websiteUrl || '';
};

/**
 * Récupère l'adresse de la boutique
 */
export const getStoreAddress = (): string => {
  const storeInfo = getStoreInfo();
  return storeInfo?.storeAddress || '';
}; 