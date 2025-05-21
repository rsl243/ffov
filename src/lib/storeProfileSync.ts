'use client';

import { UserProfile } from '@/contexts/UserProfileContext';
import { getStoreInfo, getStoreUrl, getStoreAddress, saveStoreInfo } from './userStore';

/**
 * Synchronise les informations de la boutique entre le localStorage et le profil utilisateur
 * Cette fonction charge les informations du localStorage et les met à disposition du profil
 */
export function syncStoreInfoToProfile(profile: UserProfile): UserProfile {
  try {
    // Récupérer les informations de la boutique depuis localStorage
    const storeInfo = getStoreInfo();
    const storeUrl = getStoreUrl();
    const storeAddress = getStoreAddress();
    
    // Créer un nouvel objet profile avec les informations mises à jour
    const updatedProfile = { ...profile };
    
    // Mettre à jour les informations de la boutique si elles existent dans le localStorage
    if (storeInfo) {
      updatedProfile.storeName = storeInfo.siteName || updatedProfile.storeName;
      updatedProfile.storeCreatedAt = storeInfo.createdAt || updatedProfile.storeCreatedAt;
    }
    
    if (storeUrl) {
      updatedProfile.storeUrl = storeUrl || updatedProfile.storeUrl;
    }
    
    if (storeAddress) {
      updatedProfile.storeAddress = storeAddress || updatedProfile.storeAddress;
    }
    
    return updatedProfile;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des informations de la boutique:', error);
    return profile;
  }
}

/**
 * Synchronise les informations du profil utilisateur vers le localStorage
 * Cette fonction est appelée après la mise à jour du profil
 */
export function syncProfileToStoreInfo(profile: UserProfile): void {
  try {
    if (profile.storeName || profile.storeUrl || profile.storeAddress) {
      saveStoreInfo(
        profile.storeName || '',
        profile.storeUrl || '',
        profile.storeAddress || ''
      );
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation du profil vers les informations de la boutique:', error);
  }
}

/**
 * Initialise l'URL de la boutique à partir du nom de domaine si disponible
 */
export function formatStoreUrl(url: string): string {
  if (!url) return '';
  
  // Si l'URL contient déjà http:// ou https://, extraire le domaine
  if (url.includes('://')) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  }
  
  return url;
}
