// Utilitaires pour la création de notifications communes
import { createNotification } from './notificationsService';

/**
 * Crée une notification de nouvelle commande
 * @param orderId Identifiant de la commande
 * @param customerName Nom du client
 * @returns Identifiant de la notification créée
 */
export const createOrderNotification = async (orderId: string, customerName: string) => {
  return await createNotification(
    'Nouvelle commande',
    `Commande ${orderId} reçue de ${customerName}`,
    'order',
    orderId
  );
};

/**
 * Crée une notification de changement de statut de commande
 * @param orderId Identifiant de la commande
 * @param status Nouveau statut
 * @returns Identifiant de la notification créée
 */
export const createOrderStatusNotification = async (orderId: string, status: 'accepted' | 'refused' | 'pending') => {
  const statusText = {
    accepted: 'acceptée',
    refused: 'refusée',
    pending: 'en attente'
  }[status];
  
  return await createNotification(
    'Statut de commande modifié',
    `La commande ${orderId} est maintenant ${statusText}`,
    'order',
    orderId
  );
};

/**
 * Crée une notification d'alerte de stock
 * @param productName Nom du produit
 * @param stock Quantité restante
 * @param productId Identifiant du produit
 * @returns Identifiant de la notification créée
 */
export const createLowStockNotification = async (productName: string, stock: number, productId: string) => {
  return await createNotification(
    'Stock faible',
    `Le stock de "${productName}" est faible (${stock} restants)`,
    'stock',
    productId
  );
};

/**
 * Crée une notification de nouveau client
 * @param clientName Nom du client
 * @param clientId Identifiant du client
 * @returns Identifiant de la notification créée
 */
export const createNewClientNotification = async (clientName: string, clientId: string) => {
  return await createNotification(
    'Nouveau client',
    `${clientName} vient de s'inscrire`,
    'other',
    clientId
  );
};

/**
 * Crée une notification de nouveau message
 * @param senderName Nom de l'expéditeur
 * @param messagePreview Aperçu du message
 * @param conversationId Identifiant de la conversation
 * @returns Identifiant de la notification créée
 */
export const createNewMessageNotification = async (senderName: string, messagePreview: string, conversationId: string) => {
  return await createNotification(
    'Nouveau message',
    `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
    'other',
    conversationId
  );
};

/**
 * Crée une notification de paiement reçu
 * @param amount Montant du paiement
 * @param orderId Identifiant de la commande
 * @returns Identifiant de la notification créée
 */
export const createPaymentReceivedNotification = async (amount: number, orderId: string) => {
  const formattedAmount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  
  return await createNotification(
    'Paiement reçu',
    `Paiement de ${formattedAmount} reçu pour la commande ${orderId}`,
    'payment',
    orderId
  );
};

/**
 * Crée une notification de synchronisation
 * @param vendorName Nom du vendeur/site
 * @param status Statut de la synchronisation
 * @param productsCount Nombre de produits synchronisés
 * @param vendorId Identifiant du vendeur
 * @returns Identifiant de la notification créée
 */
export const createSyncNotification = async (
  vendorName: string, 
  status: 'started' | 'completed' | 'failed', 
  productsCount?: number,
  vendorId?: string
) => {
  let message = '';
  let title = '';
  
  switch (status) {
    case 'started':
      title = 'Synchronisation démarrée';
      message = `La synchronisation des produits de ${vendorName} a commencé`;
      break;
    case 'completed':
      title = 'Synchronisation terminée';
      message = `La synchronisation des produits de ${vendorName} est terminée${productsCount ? ` (${productsCount} produits)` : ''}`;
      break;
    case 'failed':
      title = 'Échec de synchronisation';
      message = `La synchronisation des produits de ${vendorName} a échoué`;
      break;
  }
  
  return await createNotification(
    title,
    message,
    'system',
    vendorId
  );
};
