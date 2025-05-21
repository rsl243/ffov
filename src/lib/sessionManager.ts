/**
 * Gestionnaire de sessions pour l'application FFOV
 * Permet de gérer l'expiration des sessions et rafraîchissement des tokens
 */

// Durée maximum d'inactivité (en millisecondes) avant déconnexion automatique
// 30 minutes = 30 * 60 * 1000 ms
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Clé utilisée dans le localStorage
const LAST_ACTIVITY_KEY = 'faet_last_activity';

/**
 * Enregistre l'heure de la dernière activité de l'utilisateur
 */
export const updateLastActivity = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }
};

/**
 * Vérifie si la session est expirée basée sur l'inactivité
 * @returns {boolean} Vrai si la session est expirée
 */
export const isSessionExpired = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  
  if (!lastActivity) {
    return true; // Si pas d'activité enregistrée, considérer comme expirée
  }
  
  const lastActivityTime = parseInt(lastActivity, 10);
  const currentTime = Date.now();
  const timeSinceLastActivity = currentTime - lastActivityTime;
  
  return timeSinceLastActivity > SESSION_TIMEOUT;
};

/**
 * Initialise les écouteurs d'événements pour suivre l'activité utilisateur
 */
export const initSessionTracking = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Mettre à jour l'activité sur les événements utilisateur
  const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
  
  events.forEach(event => {
    window.addEventListener(event, updateLastActivity);
  });
  
  // Initialiser au chargement
  updateLastActivity();
};

/**
 * Nettoie les écouteurs d'événements
 */
export const cleanupSessionTracking = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
  
  events.forEach(event => {
    window.removeEventListener(event, updateLastActivity);
  });
};
