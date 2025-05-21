import { supabase } from './supabase';
import { getStoreUrl } from './userStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les données du tableau de bord
export interface Order {
  id: string;
  customer: string;
  amount: string;
  time: string;
  status: string;
  items: number;
  shippingStatus: string;
}

export interface DashboardData {
  lastSync: string;
  products: number;
  sales: {
    today: number;
    total: number;
    amount: string;
    pending: number;
    comparison: string;
  };
  orders: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    returned: number;
  };
  visitors: {
    today: number;
    comparison: string;
  };
  connectedSite: string;
  recentOrders: Order[];
}

export interface OrdersResponse {
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

// Fonction pour obtenir les données du tableau de bord depuis Supabase
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer les informations du magasin
    const { data: storeData } = await supabase
      .from('store_info')
      .select('*')
      .eq('organization_id', user.id)
      .single();
    
    // Récupérer les produits
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
      .eq('organization_id', user.id);
      
    if (productsError) {
      console.error('Erreur lors de la récupération des produits:', productsError);
    }
    
    // Récupérer les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('organization_id', user.id);
      
    if (ordersError) {
      console.error('Erreur lors de la récupération des commandes:', ordersError);
    }
    
    // Récupérer les statistiques de visite
    const { data: visits, error: visitsError } = await supabase
      .from('site_visits')
      .select('*')
      .eq('organization_id', user.id)
      .order('visit_date', { ascending: false })
      .limit(30);
      
    if (visitsError) {
      console.error('Erreur lors de la récupération des visites:', visitsError);
    }
    
    // Calculer les statistiques
    const today = new Date().toISOString().split('T')[0];
    
    // Commandes d'aujourd'hui
    const todayOrders = orders?.filter(order => 
      order.created_at && order.created_at.startsWith(today)
    ) || [];
    
    // Commandes par statut
    const pendingOrders = orders?.filter(order => order.status === 'pending') || [];
    const processingOrders = orders?.filter(order => order.status === 'processing') || [];
    const shippedOrders = orders?.filter(order => order.status === 'shipped') || [];
    const deliveredOrders = orders?.filter(order => order.status === 'delivered') || [];
    const returnedOrders = orders?.filter(order => order.status === 'returned') || [];
    
    // Visites d'aujourd'hui
    const todayVisits = visits?.filter(visit => 
      visit.visit_date && visit.visit_date.startsWith(today)
    ) || [];
    
    // Visites d'hier
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayVisits = visits?.filter(visit => 
      visit.visit_date && visit.visit_date.startsWith(yesterdayStr)
    ) || [];
    
    // Calculer la comparaison des visites
    const visitComparison = yesterdayVisits.length > 0 
      ? `${Math.round((todayVisits.length - yesterdayVisits.length) / yesterdayVisits.length * 100)}%`
      : '+0%';
    
    // Calculer le montant total des ventes
    const totalSalesAmount = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const todaySalesAmount = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    // Formater les commandes récentes
    const recentOrders = (orders || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        customer: order.customer_name || 'Client inconnu',
        amount: formatAmount(order.total_amount || 0),
        time: formatRelativeTime(order.created_at),
        status: order.payment_status === 'paid' ? 'Payée' : 'En attente',
        items: order.items_count || 1,
        shippingStatus: order.shipping_status || 'En attente'
      }));
    
    // Construire l'objet de données du tableau de bord
    const dashboardData: DashboardData = {
      lastSync: `Aujourd'hui à ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      products: products?.[0]?.count || 0,
      sales: {
        today: todayOrders.length,
        total: orders?.length || 0,
        amount: formatAmount(todaySalesAmount),
        pending: pendingOrders.length,
        comparison: '+0%' // À calculer avec des données historiques
      },
      orders: {
        pending: pendingOrders.length,
        processing: processingOrders.length,
        shipped: shippedOrders.length,
        delivered: deliveredOrders.length,
        returned: returnedOrders.length
      },
      visitors: {
        today: todayVisits.length,
        comparison: visitComparison
      },
      connectedSite: storeData?.site_url || getStoreUrl() || 'Non configuré',
      recentOrders
    };
    
    return dashboardData;
  } catch (error) {
    console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    
    // Retourner des données vides en cas d'erreur
    return {
      lastSync: `Aujourd'hui à ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      products: 0,
      sales: {
        today: 0,
        total: 0,
        amount: '0,00 €',
        pending: 0,
        comparison: '+0%'
      },
      orders: {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        returned: 0
      },
      visitors: {
        today: 0,
        comparison: '+0%'
      },
      connectedSite: getStoreUrl() || 'Non configuré',
      recentOrders: []
    };
  }
};

// Fonction pour obtenir les commandes récentes avec pagination
export const getRecentOrders = async (page = 1, limit = 5): Promise<OrdersResponse> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;
    
    // Récupérer le nombre total de commandes
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.id);
    
    // Récupérer les commandes paginées
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('organization_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw error;
    }
    
    // Formater les commandes
    const formattedOrders = (orders || []).map(order => ({
      id: order.id,
      customer: order.customer_name || 'Client inconnu',
      amount: formatAmount(order.total_amount || 0),
      time: formatRelativeTime(order.created_at),
      status: order.payment_status === 'paid' ? 'Payée' : 'En attente',
      items: order.items_count || 1,
      shippingStatus: order.shipping_status || 'En attente'
    }));
    
    return {
      orders: formattedOrders,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes récentes:', error);
    
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

// Fonction pour actualiser les données du tableau de bord
export const refreshDashboardData = async (): Promise<DashboardData> => {
  // Récupérer les données fraîches depuis Supabase
  return getDashboardData();
};
