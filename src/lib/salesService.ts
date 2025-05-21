import { supabase } from './supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Order } from './types';
import { createOrderStatusNotification } from './notificationUtils';

// Interface pour les réponses paginées
export interface SalesResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Fonction pour formater la date relative en français
const formatRelativeTime = (date: string): string => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Date inconnue';
  }
};

// Fonction pour formater un montant en euros
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Fonction pour formater la date au format français
const formatDate = (date: string): string => {
  try {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return date;
  }
};

// Fonction pour obtenir les ventes depuis Supabase
export const getSales = async (
  page = 1, 
  limit = 10, 
  status?: 'pending' | 'accepted' | 'refused' | 'all',
  searchTerm?: string,
  minAmount?: number,
  maxAmount?: number,
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'all'
): Promise<SalesResponse> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;
    
    // Construire la requête de base
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('organization_id', user.id);
    
    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Filtrer par terme de recherche si spécifié
    if (searchTerm) {
      query = query.or(`customer_name.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
    }
    
    // Filtrer par montant si spécifié
    if (minAmount !== undefined) {
      query = query.gte('total_amount', minAmount);
    }
    
    if (maxAmount !== undefined) {
      query = query.lte('total_amount', maxAmount);
    }
    
    // Filtrer par période si spécifiée
    if (period && period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          query = query.gte('created_at', startDate.toISOString());
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          query = query.gte('created_at', startDate.toISOString());
          break;
      }
    }
    
    // Récupérer toutes les commandes pour le comptage
    // Cette approche est plus simple et évite les problèmes avec l'API Supabase
    const { data: allOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('organization_id', user.id);
    
    // Compter manuellement le nombre total de commandes
    const count = allOrders?.length || 0;
    
    // Récupérer les commandes paginées
    const { data: orders, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Erreur lors de la récupération des ventes:', error);
      throw error;
    }
    
    // Formater les commandes pour correspondre à l'interface Order
    const formattedOrders: Order[] = (orders || []).map(order => ({
      id: order.id,
      date: formatDate(order.created_at),
      customer: order.customer_name || 'Client inconnu',
      amount: order.total_amount || 0,
      items: order.items || [],
      status: order.status || 'pending',
      reason: order.refusal_reason,
      address: order.shipping_address || '',
      relativeTime: formatRelativeTime(order.created_at)
    }));
    
    return {
      orders: formattedOrders,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    
    // Retourner une réponse vide en cas d'erreur
    return {
      orders: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

// Fonction pour mettre à jour le statut d'une commande
export const updateOrderStatus = async (
  orderId: string, 
  status: 'accepted' | 'refused',
  options?: {
    reason?: string;
    deliveryType?: 'delivery' | 'phygital';
    sellerMessage?: string;
  }
): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Préparer les données de mise à jour
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    // Ajouter les options si présentes
    if (options) {
      if (status === 'refused' && options.reason) {
        updateData.refusal_reason = options.reason;
      }
      
      if (status === 'accepted') {
        if (options.deliveryType) {
          updateData.delivery_type = options.deliveryType;
        }
        
        if (options.sellerMessage) {
          updateData.seller_message = options.sellerMessage;
        }
      }
    }
    
    // Mettre à jour la commande
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('organization_id', user.id)
      .select('id, customer_name');
    
    if (error) {
      console.error('Erreur lors de la mise à jour du statut de la commande:', error);
      return false;
    }
    
    // Créer une notification pour ce changement de statut
    try {
      if (data && data.length > 0) {
        await createOrderStatusNotification(orderId, status);
      }
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas faire échouer l'opération si la notification échoue
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la commande:', error);
    return false;
  }
};

// Fonction pour obtenir les statistiques de ventes
export const getSalesStats = async (): Promise<{
  pending: number;
  accepted: number;
  refused: number;
  total: number;
  totalAmount: string;
  todayAmount: string;
}> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer toutes les commandes
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('organization_id', user.id);
    
    if (error) {
      console.error('Erreur lors de la récupération des statistiques de ventes:', error);
      throw error;
    }
    
    // Calculer les statistiques
    const pending = orders?.filter(order => order.status === 'pending').length || 0;
    const accepted = orders?.filter(order => order.status === 'accepted').length || 0;
    const refused = orders?.filter(order => order.status === 'refused').length || 0;
    const total = orders?.length || 0;
    
    // Calculer le montant total des ventes
    const totalAmount = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    
    // Calculer le montant des ventes d'aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders?.filter(order => order.created_at && order.created_at.startsWith(today)) || [];
    const todayAmount = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    return {
      pending,
      accepted,
      refused,
      total,
      totalAmount: formatAmount(totalAmount),
      todayAmount: formatAmount(todayAmount)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de ventes:', error);
    
    // Retourner des statistiques vides en cas d'erreur
    return {
      pending: 0,
      accepted: 0,
      refused: 0,
      total: 0,
      totalAmount: '0,00 €',
      todayAmount: '0,00 €'
    };
  }
};
