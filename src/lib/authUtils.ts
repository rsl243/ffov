// Utilitaires d'authentification simplifiés pour la phase de test
import { SubscriptionPlan } from './userPlan';

// Types pour l'authentification
export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  position?: string;
  productTypes?: string[];
  selectedPlan?: SubscriptionPlan;
}

// Fonction pour enregistrer un nouvel utilisateur
export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  position: string,
  productTypes: string[],
  selectedPlan: SubscriptionPlan
): Promise<boolean> => {
  try {
    // Simulation d'un délai d'inscription
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Créer un utilisateur fictif
    const user: User = {
      id: Date.now().toString(),
      fullName: `${firstName} ${lastName}`,
      email,
      position,
      productTypes,
      selectedPlan
    };
    
    // Enregistrer l'utilisateur dans le localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('faet_user', JSON.stringify(user));
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return false;
  }
};

// Fonction pour récupérer l'utilisateur actuel
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const storedUser = localStorage.getItem('faet_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

// Fonction pour mettre à jour le plan de l'utilisateur
export const updateUserSubscriptionPlan = (plan: SubscriptionPlan): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const storedUser = localStorage.getItem('faet_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      user.selectedPlan = plan;
      localStorage.setItem('faet_user', JSON.stringify(user));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du plan:', error);
    return false;
  }
};
