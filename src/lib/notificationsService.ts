import { supabase } from './supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'order' | 'stock' | 'payment' | 'system' | 'other';
  relatedId?: string;
}

/**
 * Récupère les notifications de l'utilisateur actuel
 * @param limit Nombre maximum de notifications à récupérer
 * @param onlyUnread Si true, ne récupère que les notifications non lues
 * @returns Liste des notifications
 */
export const getNotifications = async (limit: number = 10, onlyUnread: boolean = false): Promise<Notification[]> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Construire la requête de base
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Ajouter le filtre pour les notifications non lues si nécessaire
    if (onlyUnread) {
      query = query.eq('is_read', false);
    }
    
    // Exécuter la requête
    const { data, error } = await query;
    
    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
    
    // Transformer les données pour correspondre à l'interface Notification
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      time: formatRelativeTime(item.created_at),
      isRead: item.is_read,
      type: item.type || 'other',
      relatedId: item.related_id
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return [];
  }
};

/**
 * Récupère le nombre de notifications non lues
 * @returns Nombre de notifications non lues
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Compter les notifications non lues
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Erreur lors du comptage des notifications non lues:', error);
    return 0;
  }
};

/**
 * Marque une notification comme lue
 * @param notificationId ID de la notification à marquer comme lue
 * @returns true si l'opération a réussi, false sinon
 */
export const markAsRead = async (notificationId: number): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Mettre à jour la notification
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    return false;
  }
};

/**
 * Marque toutes les notifications comme lues
 * @returns true si l'opération a réussi, false sinon
 */
export const markAllAsRead = async (): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Mettre à jour toutes les notifications
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    return false;
  }
};

/**
 * Crée une nouvelle notification
 * @param title Titre de la notification
 * @param message Message de la notification
 * @param type Type de notification
 * @param relatedId ID associé (commande, produit, etc.)
 * @returns La notification créée ou null en cas d'erreur
 */
export const createNotification = async (
  title: string,
  message: string,
  type: 'order' | 'stock' | 'payment' | 'system' | 'other' = 'system',
  relatedId?: string
): Promise<Notification | null> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Créer la notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        related_id: relatedId,
        user_id: user.id,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return null;
    }
    
    // Convertir la réponse au format Notification
    return {
      id: data.id,
      title: data.title,
      message: data.message,
      time: formatRelativeTime(data.created_at),
      isRead: data.is_read,
      type: data.type,
      relatedId: data.related_id
    };
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    return null;
  }
};

/**
 * Supprime une notification
 * @param notificationId ID de la notification à supprimer
 * @returns true si l'opération a réussi, false sinon
 */
export const deleteNotification = async (notificationId: number): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Supprimer la notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    return false;
  }
};

// Fonction utilitaire pour formater le temps relatif
const formatRelativeTime = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Date inconnue';
  }
};
