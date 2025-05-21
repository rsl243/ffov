import { createClient } from '@supabase/supabase-js';

// Utilisation des variables d'environnement pour les clés Supabase
// Fallback sur les valeurs codées en dur uniquement en dernier recours pour le développement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfmbqktwssnygknfrdib.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJxa3R3c3NueWdrbmZyZGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNDQzOTYsImV4cCI6MjA2MjgyMDM5Nn0.TEO2GG2eCPUBkZfGbVsXAEP5gr-CyUJA3n5m2o_4Me4';

// Vérifier que les variables d'environnement sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erreur critique: Les variables d\'environnement pour Supabase ne sont pas définies.');
}

// Avertissement de sécurité si on utilise les valeurs codées en dur
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Avertissement de sécurité: Utilisation des clés Supabase codées en dur. ' +
              'Créez un fichier .env.local basé sur .env.example pour une sécurité optimale.');
}

// Créer un client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour s'inscrire
// Note: position et productTypes sont optionnels et ne sont plus utilisés dans l'inscription initiale
export async function signUp(email: string, password: string, firstName: string, lastName: string, position?: string, productTypes?: string[]) {
  console.log('DÉBUT INSCRIPTION SIMPLIFIÉE:', { email, password: '***', firstName, lastName });
  
  try {
    // Version ultra-simplifiée pour identifier le problème
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });
    
    console.log('RÉSULTAT INSCRIPTION:', {
      success: !error,
      userId: data?.user?.id,
      hasSession: !!data?.session,
      error: error ? error.message : null
    });
    
    if (error) {
      console.error('ERREUR INSCRIPTION DÉTAILS:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('ERREUR GÉNÉRALE INSCRIPTION:', error);
    throw error;
  }
}

// Fonction pour se connecter
export async function signIn(email: string, password: string) {
  console.log('Tentative de connexion avec:', { email });
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.log('Résultat de la connexion:', { success: !error, session: !!data.session });
    
    if (error) {
      console.error('Erreur de connexion:', error.message);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erreur générale dans signIn:', error);
    throw error;
  }
}

// Fonction pour se déconnecter
export async function signOut() {
  console.log('Tentative de déconnexion');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Fonction pour récupérer l'utilisateur actuel
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// Fonction pour récupérer la session
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Fonction pour mettre à jour le profil utilisateur
export async function updateUserProfile(updates: {
  first_name?: string;
  last_name?: string;
  position?: string;
  email?: string;
  phone?: string;
}) {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  });
  
  if (error) throw error;
  return data.user;
}
