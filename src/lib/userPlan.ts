// Utilitaires pour gérer le plan tarifaire de l'utilisateur

// Types d'offres
export type SubscriptionPlan = 'ville' | 'region' | 'pays';

// Interface pour l'offre tarifaire
export interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  price: number;
  maxLocations: number | null; // null signifie illimité
  regionRestriction: boolean;
  commission: string;
  commissionDetails: string;
  description: string;
  features: string[];
  limitations: string[];
  advantages: string[];
}

// Définition des plans tarifaires
export const pricingPlans: Record<SubscriptionPlan, PlanInfo> = {
  'ville': {
    id: 'ville',
    name: 'VILLE',
    price: 10,
    maxLocations: 3,
    regionRestriction: false,
    commission: '1.5% HT par vente',
    commissionDetails: '1.5% HT part vente',
    description: 'Commission de 1.5% HT par vente, limité à 3 boutiques et compte partagé',
    features: ['Visibilité', 'Base de données', 'Statistiques', 'Des données'],
    limitations: ['3 boutiques', 'Compte partagé'],
    advantages: ['En direct', 'Markéting']
  },
  'region': {
    id: 'region',
    name: 'RÉGION',
    price: 35,
    maxLocations: null, // illimité dans une région
    regionRestriction: true,
    commission: '2.5% HT à partir de 5000€ de CA par mois',
    commissionDetails: '2.5% HT à partir de 5000€ de CA par mois',
    description: 'Commission de 2.5% HT à partir de 5000€ de CA par mois, boutiques illimitées dans la région choisie',
    features: ['Visibilité', 'Base de données', 'Statistiques', 'Des données'],
    limitations: ['Limité à une seule région géographique'],
    advantages: ['Boutiques illimitées dans la région', 'Gestion hiérarchique des comptes (managers, vendeurs)', 'Centralisation des données', 'En direct', 'Markéting']
  },
  'pays': {
    id: 'pays',
    name: 'PAYS',
    price: 100,
    maxLocations: null, // illimité
    regionRestriction: false,
    commission: '2.5% HT par vente',
    commissionDetails: '2.5% HT part vente',
    description: 'Commission de 2.5% HT par vente, boutiques illimitées dans tout le pays',
    features: ['Visibilité', 'Base de données', 'Statistiques', 'Des données'],
    limitations: [],
    advantages: ['Boutiques illimitées dans tout le pays', 'Gestion hiérarchique complète (siège, régions, boutiques)', 'Centralisation nationale des données', 'En direct', 'Markéting avancé']
  }
};

// Import local pour éviter les dépendances circulaires
let userProfileCache: { selectedPlan: SubscriptionPlan } | null = null;

// Permet de définir le cache du profil utilisateur depuis l'extérieur
export function setUserProfileCache(profile: { selectedPlan: SubscriptionPlan } | null): void {
  userProfileCache = profile;
}

// Récupérer le plan tarifaire de l'utilisateur
export function getUserPlan(): SubscriptionPlan {
  // Utiliser le cache s'il est disponible (côté client)
  if (userProfileCache) {
    return userProfileCache.selectedPlan;
  }
  
  if (typeof window === 'undefined') {
    return 'ville'; // Valeur par défaut côté serveur
  }
  
  try {
    // Fallback sur localStorage pour compatibilité
    const storedUser = JSON.parse(localStorage.getItem('faet_user') || '{}');
    return storedUser.selectedPlan || 'ville';
  } catch (error) {
    console.error('Erreur lors de la récupération du plan:', error);
    return 'ville'; // Valeur par défaut en cas d'erreur
  }
}

// Récupérer les informations complètes du plan tarifaire de l'utilisateur
export function getUserPlanInfo(): PlanInfo {
  const planId = getUserPlan();
  return pricingPlans[planId];
}

// Type pour la fonction de mise à jour du profil
type UpdateProfileFunction = (updates: { selectedPlan: SubscriptionPlan }) => Promise<void>;

// Variable pour stocker la fonction de mise à jour du profil
let updateProfileCallback: UpdateProfileFunction | null = null;

// Permet de définir la fonction de mise à jour du profil depuis l'extérieur
export function setUpdateProfileCallback(callback: UpdateProfileFunction | null): void {
  updateProfileCallback = callback;
}

// Mettre à jour le plan tarifaire de l'utilisateur
export async function updateUserPlan(plan: SubscriptionPlan): Promise<boolean> {
  // Si on a un callback de mise à jour de profil, on l'utilise (prioritaire)
  if (updateProfileCallback) {
    try {
      await updateProfileCallback({ selectedPlan: plan });
      // Mettre à jour aussi le cache local
      if (userProfileCache) {
        userProfileCache.selectedPlan = plan;
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plan via le profil:', error);
      // On essaie la méthode de secours (localStorage)
    }
  }
  
  // Méthode de secours avec localStorage
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const storedUser = JSON.parse(localStorage.getItem('faet_user') || '{}');
    const updatedUser = {
      ...storedUser,
      selectedPlan: plan
    };
    localStorage.setItem('faet_user', JSON.stringify(updatedUser));
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du plan:', error);
    return false;
  }
}
