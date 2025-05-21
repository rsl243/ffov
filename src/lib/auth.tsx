'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

// Types pour l'authentification
export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  position?: string;
  productTypes?: string[];
  selectedPlan?: 'ville' | 'region' | 'pays';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, firstName: string, lastName: string, position: string, productTypes: string[], selectedPlan: 'ville' | 'region' | 'pays') => Promise<boolean>;
  updateUserPlan: (plan: 'ville' | 'region' | 'pays') => void;
}

// État initial du contexte d'authentification
const initialState: AuthContextType = {
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  updateUserPlan: () => {},
};

// Création du contexte
const AuthContext = createContext<AuthContextType>(initialState);

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Provider pour le contexte d'authentification
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    // Vérifier que nous sommes dans un environnement navigateur
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    const checkUser = async () => {
      try {
        // Simuler une vérification d'authentification
        const storedUser = localStorage.getItem('faet_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simulation d'une connexion (à remplacer par un appel API réel)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Pour la démo, on crée un utilisateur fictif
      const mockedUser: User = {
        id: '1',
        fullName: email.includes('john') ? 'John Satia' : 'Marcel Beliveau',
        email,
      };
      
      // Enregistrer l'utilisateur dans le stockage local
      if (typeof window !== 'undefined') {
        localStorage.setItem('faet_user', JSON.stringify(mockedUser));
      }
      setUser(mockedUser);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('faet_user');
    }
    setUser(null);
    router.push('/connexion');
  };

  // Fonction d'inscription
  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    position: string,
    productTypes: string[],
    selectedPlan: 'ville' | 'region' | 'pays'
  ): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simulation d'une inscription (à remplacer par un appel API réel)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Pour la démo, on crée un utilisateur fictif avec toutes les informations
      const mockedUser: User = {
        id: '1',
        fullName: `${firstName} ${lastName}`,
        email,
        position,
        productTypes,
        selectedPlan
      };
      
      // Enregistrer l'utilisateur dans le stockage local
      if (typeof window !== 'undefined') {
        localStorage.setItem('faet_user', JSON.stringify(mockedUser));
      }
      setUser(mockedUser);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour le plan de l'utilisateur
  const updateUserPlan = (plan: 'ville' | 'region' | 'pays') => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      selectedPlan: plan
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('faet_user', JSON.stringify(updatedUser));
    }
    
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        updateUserPlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 