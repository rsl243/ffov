/**
 * Module de journalisation pour l'application FFOV
 * Permet de tracer les opérations et les erreurs lors de la synchronisation
 */

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '');
    }
  },
  
  // Fonction spécifique pour la synchronisation des produits
  syncProduct: (vendorId: string, productData: any, status: 'success' | 'partial' | 'error', missingFields?: string[]) => {
    const logData = {
      vendorId,
      productId: productData.externalId || 'unknown',
      status,
      missingFields: missingFields || [],
      timestamp: new Date().toISOString()
    };
    
    if (status === 'partial') {
      console.warn(`[SYNC] Synchronisation partielle du produit - Champs manquants: ${missingFields?.join(', ')}`, logData);
    } else if (status === 'error') {
      console.error(`[SYNC] Erreur de synchronisation du produit`, logData);
    } else {
      console.log(`[SYNC] Synchronisation réussie du produit`, logData);
    }
    
    return logData;
  }
};
