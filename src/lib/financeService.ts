import { supabase } from './supabase';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface pour les statistiques financières
export interface FinancialStats {
  revenue: {
    total: number;
    previousPeriod: number;
    changePercent: number;
  };
  sales: {
    total: number;
    previousPeriod: number;
    changePercent: number;
  };
  averageOrderValue: {
    current: number;
    previousPeriod: number;
    changePercent: number;
  };
  refunds: {
    total: number;
    previousPeriod: number;
    changePercent: number;
  };
}

// Interface pour les transactions
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'payment' | 'refund' | 'fee' | 'payout';
  status: 'completed' | 'pending' | 'failed';
  customer?: {
    name: string;
    id: string;
  };
  order?: {
    id: string;
  };
  description: string;
  paymentMethod?: string;
}

// Interface pour les réponses paginées de transactions
export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface pour le plan d'abonnement
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  mostPopular?: boolean;
}

// Interface pour l'abonnement de l'utilisateur
export interface UserSubscription {
  planId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  canCancel: boolean;
}

// Interface pour les paiements anticipés
export interface UpcomingPayment {
  id: string;
  date: string;
  amount: number;
  description: string;
}

// Fonction pour obtenir les statistiques financières
export const getFinancialStats = async (
  period: 'month' | 'quarter' | 'year' = 'month'
): Promise<FinancialStats> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Déterminer les dates pour la période actuelle et la période précédente
    const now = new Date();
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date = now;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;
    
    switch (period) {
      case 'month':
        currentPeriodStart = startOfMonth(now);
        previousPeriodEnd = subMonths(currentPeriodStart, 1);
        previousPeriodStart = startOfMonth(previousPeriodEnd);
        break;
      case 'quarter':
        // Pour simplifier, on considère un trimestre comme 3 mois
        currentPeriodStart = subMonths(now, 3);
        previousPeriodEnd = subMonths(currentPeriodStart, 1);
        previousPeriodStart = subMonths(previousPeriodEnd, 3);
        break;
      case 'year':
        // Pour simplifier, on considère une année comme 12 mois
        currentPeriodStart = subMonths(now, 12);
        previousPeriodEnd = subMonths(currentPeriodStart, 1);
        previousPeriodStart = subMonths(previousPeriodEnd, 12);
        break;
    }
    
    // Formater les dates pour les requêtes Supabase
    const currentStartFormatted = currentPeriodStart.toISOString();
    const currentEndFormatted = currentPeriodEnd.toISOString();
    const previousStartFormatted = previousPeriodStart.toISOString();
    const previousEndFormatted = previousPeriodEnd.toISOString();
    
    // Récupérer les commandes pour la période actuelle
    const { data: currentOrders, error: currentOrdersError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('organization_id', user.id)
      .gte('created_at', currentStartFormatted)
      .lte('created_at', currentEndFormatted);
    
    if (currentOrdersError) {
      console.error('Erreur lors de la récupération des commandes actuelles:', currentOrdersError);
      throw currentOrdersError;
    }
    
    // Récupérer les commandes pour la période précédente
    const { data: previousOrders, error: previousOrdersError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('organization_id', user.id)
      .gte('created_at', previousStartFormatted)
      .lte('created_at', previousEndFormatted);
    
    if (previousOrdersError) {
      console.error('Erreur lors de la récupération des commandes précédentes:', previousOrdersError);
      throw previousOrdersError;
    }
    
    // Récupérer les remboursements pour la période actuelle
    const { data: currentRefunds, error: currentRefundsError } = await supabase
      .from('transactions')
      .select('id, amount, created_at')
      .eq('organization_id', user.id)
      .eq('type', 'refund')
      .gte('created_at', currentStartFormatted)
      .lte('created_at', currentEndFormatted);
    
    if (currentRefundsError) {
      console.error('Erreur lors de la récupération des remboursements actuels:', currentRefundsError);
      throw currentRefundsError;
    }
    
    // Récupérer les remboursements pour la période précédente
    const { data: previousRefunds, error: previousRefundsError } = await supabase
      .from('transactions')
      .select('id, amount, created_at')
      .eq('organization_id', user.id)
      .eq('type', 'refund')
      .gte('created_at', previousStartFormatted)
      .lte('created_at', previousEndFormatted);
    
    if (previousRefundsError) {
      console.error('Erreur lors de la récupération des remboursements précédents:', previousRefundsError);
      throw previousRefundsError;
    }
    
    // Calculer les statistiques pour la période actuelle
    const currentCompletedOrders = currentOrders?.filter(order => order.status === 'accepted') || [];
    const currentRevenue = currentCompletedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const currentSalesCount = currentCompletedOrders.length;
    const currentAOV = currentSalesCount > 0 ? currentRevenue / currentSalesCount : 0;
    const currentRefundsTotal = currentRefunds?.reduce((sum, refund) => sum + (refund.amount || 0), 0) || 0;
    
    // Calculer les statistiques pour la période précédente
    const previousCompletedOrders = previousOrders?.filter(order => order.status === 'accepted') || [];
    const previousRevenue = previousCompletedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const previousSalesCount = previousCompletedOrders.length;
    const previousAOV = previousSalesCount > 0 ? previousRevenue / previousSalesCount : 0;
    const previousRefundsTotal = previousRefunds?.reduce((sum, refund) => sum + (refund.amount || 0), 0) || 0;
    
    // Calculer les pourcentages de changement
    const calculateChangePercent = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const revenueChangePercent = calculateChangePercent(currentRevenue, previousRevenue);
    const salesChangePercent = calculateChangePercent(currentSalesCount, previousSalesCount);
    const aovChangePercent = calculateChangePercent(currentAOV, previousAOV);
    const refundsChangePercent = calculateChangePercent(currentRefundsTotal, previousRefundsTotal);
    
    return {
      revenue: {
        total: currentRevenue,
        previousPeriod: previousRevenue,
        changePercent: revenueChangePercent
      },
      sales: {
        total: currentSalesCount,
        previousPeriod: previousSalesCount,
        changePercent: salesChangePercent
      },
      averageOrderValue: {
        current: currentAOV,
        previousPeriod: previousAOV,
        changePercent: aovChangePercent
      },
      refunds: {
        total: currentRefundsTotal,
        previousPeriod: previousRefundsTotal,
        changePercent: refundsChangePercent
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques financières:', error);
    
    // Retourner des statistiques vides en cas d'erreur
    return {
      revenue: {
        total: 0,
        previousPeriod: 0,
        changePercent: 0
      },
      sales: {
        total: 0,
        previousPeriod: 0,
        changePercent: 0
      },
      averageOrderValue: {
        current: 0,
        previousPeriod: 0,
        changePercent: 0
      },
      refunds: {
        total: 0,
        previousPeriod: 0,
        changePercent: 0
      }
    };
  }
};

// Fonction pour récupérer les transactions
export const getTransactions = async (
  page = 1,
  limit = 10,
  type?: 'payment' | 'refund' | 'fee' | 'payout' | 'all',
  status?: 'completed' | 'pending' | 'failed' | 'all',
  startDate?: string,
  endDate?: string,
  searchTerm?: string
): Promise<TransactionsResponse> => {
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
      .from('transactions')
      .select('*, customer:customers(*), order:orders(*)')
      .eq('organization_id', user.id);
    
    // Filtrer par type si spécifié
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    
    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Filtrer par date si spécifiée
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // Filtrer par terme de recherche si spécifié
    if (searchTerm) {
      query = query.or(`description.ilike.%${searchTerm}%,customer.name.ilike.%${searchTerm}%,order.id.ilike.%${searchTerm}%`);
    }
    
    // Récupérer toutes les transactions pour le comptage
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('organization_id', user.id);
    
    // Compter manuellement le nombre total de transactions
    const count = allTransactions?.length || 0;
    
    // Récupérer les transactions paginées
    const { data: transactions, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      throw error;
    }
    
    // Formater les transactions
    const formattedTransactions: Transaction[] = (transactions || []).map(transaction => ({
      id: transaction.id,
      date: transaction.created_at,
      amount: transaction.amount || 0,
      type: transaction.type || 'payment',
      status: transaction.status || 'completed',
      customer: transaction.customer ? {
        name: transaction.customer.name || 'Client inconnu',
        id: transaction.customer.id
      } : undefined,
      order: transaction.order ? {
        id: transaction.order.id
      } : undefined,
      description: transaction.description || '',
      paymentMethod: transaction.payment_method || ''
    }));
    
    return {
      transactions: formattedTransactions,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    
    // Retourner une réponse vide en cas d'erreur
    return {
      transactions: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

// Fonction pour récupérer les plans d'abonnement disponibles
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer les plans d'abonnement
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });
    
    if (error) {
      console.error('Erreur lors de la récupération des plans d\'abonnement:', error);
      throw error;
    }
    
    // Formater les plans d'abonnement
    const formattedPlans: SubscriptionPlan[] = (plans || []).map(plan => ({
      id: plan.id,
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || 0,
      billingCycle: plan.billing_cycle || 'monthly',
      features: plan.features || [],
      mostPopular: plan.most_popular || false
    }));
    
    return formattedPlans;
  } catch (error) {
    console.error('Erreur lors de la récupération des plans d\'abonnement:', error);
    
    // Retourner une liste vide en cas d'erreur
    return [];
  }
};

// Fonction pour récupérer l'abonnement actuel de l'utilisateur
export const getUserSubscription = async (): Promise<UserSubscription | null> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer l'abonnement de l'utilisateur
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération de l\'abonnement:', error);
      throw error;
    }
    
    if (!subscription) {
      return null;
    }
    
    // Formater l'abonnement
    return {
      planId: subscription.plan_id,
      status: subscription.status || 'active',
      currentPeriodEnd: subscription.current_period_end,
      canCancel: subscription.can_cancel || false
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return null;
  }
};

// Fonction pour mettre à jour l'abonnement de l'utilisateur
export const updateUserSubscription = async (
  planId: string
): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer l'abonnement actuel
    const { data: currentSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    const now = new Date().toISOString();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthIso = nextMonth.toISOString();
    
    if (currentSubscription) {
      // Mettre à jour l'abonnement existant
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          updated_at: now,
          current_period_end: nextMonthIso
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
        return false;
      }
    } else {
      // Créer un nouvel abonnement
      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          created_at: now,
          updated_at: now,
          current_period_end: nextMonthIso,
          can_cancel: true
        });
      
      if (error) {
        console.error('Erreur lors de la création de l\'abonnement:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    return false;
  }
};

// Fonction pour annuler l'abonnement de l'utilisateur
export const cancelUserSubscription = async (): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Mettre à jour le statut de l'abonnement
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
    return false;
  }
};

// Fonction pour récupérer les paiements à venir
export const getUpcomingPayments = async (): Promise<UpcomingPayment[]> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer l'abonnement de l'utilisateur
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', user.id)
      .single();
    
    if (!subscription || subscription.status !== 'active') {
      return [];
    }
    
    // Créer un paiement à venir basé sur l'abonnement
    const nextPaymentDate = new Date(subscription.current_period_end);
    
    return [
      {
        id: `upcoming_${subscription.id}`,
        date: nextPaymentDate.toISOString(),
        amount: subscription.plan?.price || 0,
        description: `Renouvellement de l'abonnement ${subscription.plan?.name || 'Inconnu'}`
      }
    ];
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements à venir:', error);
    return [];
  }
};
