import { useState, useEffect } from 'react';

// Interface pour l'utilisateur
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  fullName: string;
}

// Interface pour le retour du hook useAuth
export interface AuthReturn {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

// Hook d'authentification simplifié
export default function useAuth(): AuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simuler un délai de chargement pour l'authentification
    const timer = setTimeout(() => {
      // Simuler un utilisateur connecté
      setUser({
        id: 1,
        name: 'Utilisateur Test',
        email: 'test@example.com',
        role: 'admin',
        fullName: 'Michel Blanc' // Nom complet pour les initiales
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Fonction de déconnexion
  const logout = () => {
    // Dans une vraie application, vous feriez ici une requête API pour déconnecter l'utilisateur
    setUser(null);
    // Redirection vers la page de connexion (dans une vraie application)
    // window.location.href = '/connexion';
  };

  return { user, loading, logout };
}
