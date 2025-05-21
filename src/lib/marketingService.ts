import { supabase } from './supabase';
import { format, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

// Interfaces pour le service marketing
export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  date?: string; // Pour filtrage par date
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  lastVisit?: string;
}

export interface AbandonedCart {
  id: string;
  customer: Customer;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalValue: number;
  abandonedSince: string;
  abandonedAt: string; // Date ISO pour le tri
  emailSent: boolean;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discount: number;
  type: 'percentage' | 'fixed' | 'shipping';
  validUntil: string;
  uses: number;
  status: 'active' | 'expired' | 'scheduled';
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  repeatPurchaseRate: number;
  averageOrderValue: number;
  topSources: { name: string; percentage: number }[];
  topCities: { name: string; percentage: number }[];
  demographicData: {
    gender: { name: string; value: number }[];
    ageRanges: { range: string; percentage: number }[];
  };
}

export interface MarketingData {
  popularProducts: Product[];
  abandonedCarts: AbandonedCart[];
  promotions: Promotion[];
  customerAnalytics: CustomerAnalytics;
}

// Fonction pour récupérer les produits populaires
export const getPopularProducts = async (
  dateRange?: { start: string; end: string },
  sortBy: string = 'views',
  sortOrder: 'asc' | 'desc' = 'desc',
  limit: number = 10
): Promise<Product[]> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Construire la requête de base
    let query = supabase
      .from('product_analytics')
      .select('*, product:products(*)')
      .eq('organization_id', user.id);
    
    // Filtrer par date si spécifiée
    if (dateRange && dateRange.start && dateRange.end) {
      query = query.gte('date', dateRange.start).lte('date', dateRange.end);
    }
    
    // Récupérer les données
    const { data, error } = await query.order(sortBy, { ascending: sortOrder === 'asc' }).limit(limit);
    
    if (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
    
    // Transformer les données
    const products: Product[] = (data || []).map(item => {
      const convRate = item.views > 0 ? (item.conversions / item.views) * 100 : 0;
      
      return {
        id: item.product.id || item.id,
        name: item.product.name || 'Produit inconnu',
        imageUrl: item.product.image_url || '/robot-hand.webp',
        views: item.views || 0,
        conversions: item.conversions || 0,
        conversionRate: parseFloat(convRate.toFixed(2)),
        revenue: item.revenue || 0,
        date: item.date
      };
    });
    
    return products;
  } catch (error) {
    console.error('Erreur lors de la récupération des produits populaires:', error);
    
    // Retourner un tableau vide en cas d'erreur
    return [];
  }
};

// Fonction pour récupérer les paniers abandonnés
export const getAbandonedCarts = async (
  days: number = 7,
  emailSent?: boolean
): Promise<AbandonedCart[]> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Calculer la date limite (7 jours en arrière par défaut)
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);
    
    // Construire la requête
    let query = supabase
      .from('abandoned_carts')
      .select('*, customer:customers(*), cart_items:abandoned_cart_items(*)')
      .eq('organization_id', user.id)
      .gte('abandoned_at', limitDate.toISOString());
    
    // Filtrer par statut d'email si spécifié
    if (emailSent !== undefined) {
      query = query.eq('email_sent', emailSent);
    }
    
    // Récupérer les données
    const { data, error } = await query.order('abandoned_at', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des paniers abandonnés:', error);
      throw error;
    }
    
    // Transformer les données
    const abandonedCarts: AbandonedCart[] = (data || []).map(cart => {
      // Calculer la durée depuis l'abandon
      const abandonedAt = new Date(cart.abandoned_at);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - abandonedAt.getTime()) / (1000 * 60 * 60));
      
      let abandonedSince = '';
      if (diffInHours < 24) {
        abandonedSince = `${diffInHours} heures`;
      } else {
        const days = Math.floor(diffInHours / 24);
        abandonedSince = days === 1 ? '1 jour' : `${days} jours`;
      }
      
      // Calculer la valeur totale du panier
      const items = cart.cart_items.map((item: any) => ({
        name: item.product_name || 'Produit inconnu',
        price: item.price || 0,
        quantity: item.quantity || 1
      }));
      
      const totalValue = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      return {
        id: cart.id,
        customer: {
          id: cart.customer?.id || 'unknown',
          name: cart.customer?.name || 'Client inconnu',
          email: cart.customer?.email || 'email@inconnu.com',
          lastVisit: format(new Date(cart.abandoned_at), 'dd/MM/yyyy HH:mm')
        },
        items,
        totalValue,
        abandonedSince,
        abandonedAt: cart.abandoned_at,
        emailSent: cart.email_sent || false
      };
    });
    
    return abandonedCarts;
  } catch (error) {
    console.error('Erreur lors de la récupération des paniers abandonnés:', error);
    
    // Retourner un tableau vide en cas d'erreur
    return [];
  }
};

// Fonction pour marquer un panier abandonné comme ayant reçu un email
export const markCartAsEmailed = async (cartId: string): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Mettre à jour le panier
    const { error } = await supabase
      .from('abandoned_carts')
      .update({ email_sent: true, updated_at: new Date().toISOString() })
      .eq('id', cartId)
      .eq('organization_id', user.id);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du panier abandonné:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du marquage du panier comme ayant reçu un email:', error);
    return false;
  }
};

// Fonction pour créer un code promo
export const createPromotion = async (
  name: string,
  description: string,
  discount: number,
  type: 'percentage' | 'fixed' | 'shipping',
  validUntil: string
): Promise<Promotion | null> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Générer un ID unique
    const id = uuidv4();
    
    // Créer la promotion
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        id,
        organization_id: user.id,
        name,
        description,
        discount,
        type,
        valid_until: validUntil,
        uses: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la promotion:', error);
      throw error;
    }
    
    // Retourner la nouvelle promotion
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      discount: data.discount,
      type: data.type,
      validUntil: data.valid_until,
      uses: data.uses,
      status: data.status
    };
  } catch (error) {
    console.error('Erreur lors de la création de la promotion:', error);
    return null;
  }
};

// Fonction pour récupérer les promotions
export const getPromotions = async (
  status?: 'active' | 'expired' | 'scheduled' | 'all'
): Promise<Promotion[]> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Construire la requête
    let query = supabase
      .from('promotions')
      .select('*')
      .eq('organization_id', user.id);
    
    // Filtrer par statut si spécifié et différent de 'all'
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Récupérer les données
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des promotions:', error);
      throw error;
    }
    
    // Transformer les données
    const promotions: Promotion[] = (data || []).map(promo => ({
      id: promo.id,
      name: promo.name,
      description: promo.description,
      discount: promo.discount,
      type: promo.type,
      validUntil: format(new Date(promo.valid_until), 'dd/MM/yyyy'),
      uses: promo.uses,
      status: promo.status
    }));
    
    return promotions;
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    
    // Retourner un tableau vide en cas d'erreur
    return [];
  }
};

// Fonction pour récupérer les analytics clients
export const getCustomerAnalytics = async (): Promise<CustomerAnalytics> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer le nombre total de clients
    const { count: totalCustomers, error: countError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.id);
    
    if (countError) {
      console.error('Erreur lors du comptage des clients:', countError);
      throw countError;
    }
    
    // Récupérer les nouveaux clients ce mois-ci
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const { count: newCustomersThisMonth, error: newCustomersError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.id)
      .gte('created_at', firstDayOfMonth.toISOString());
    
    if (newCustomersError) {
      console.error('Erreur lors du comptage des nouveaux clients:', newCustomersError);
      throw newCustomersError;
    }
    
    // Récupérer les commandes pour calculer le taux de clients fidèles et le panier moyen
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('customer_id, total_amount')
      .eq('organization_id', user.id);
    
    if (ordersError) {
      console.error('Erreur lors de la récupération des commandes:', ordersError);
      throw ordersError;
    }
    
    // Calculer le taux de clients fidèles (qui ont commandé plus d'une fois)
    const customerOrderCounts: Record<string, number> = {};
    let totalOrderAmount = 0;
    
    (orders || []).forEach(order => {
      const customerId = order.customer_id;
      customerOrderCounts[customerId] = (customerOrderCounts[customerId] || 0) + 1;
      totalOrderAmount += order.total_amount || 0;
    });
    
    const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const repeatPurchaseRate = totalCustomers ? (repeatCustomers / totalCustomers) * 100 : 0;
    
    // Calculer le panier moyen
    const averageOrderValue = orders?.length ? totalOrderAmount / orders.length : 0;
    
    // Récupérer les sources d'acquisition
    const { data: sources, error: sourcesError } = await supabase
      .from('customer_sources')
      .select('source, count')
      .eq('organization_id', user.id)
      .order('count', { ascending: false });
    
    if (sourcesError) {
      console.error('Erreur lors de la récupération des sources d\'acquisition:', sourcesError);
      throw sourcesError;
    }
    
    // Calculer le pourcentage pour chaque source
    const totalSourceCount = (sources || []).reduce((sum, item) => sum + (item.count || 0), 0);
    const topSources = (sources || []).map(item => ({
      name: item.source || 'Autre',
      percentage: totalSourceCount ? Math.round((item.count || 0) / totalSourceCount * 100) : 0
    }));
    
    // Récupérer les villes principales
    const { data: cities, error: citiesError } = await supabase
      .from('customer_cities')
      .select('city, count')
      .eq('organization_id', user.id)
      .order('count', { ascending: false });
    
    if (citiesError) {
      console.error('Erreur lors de la récupération des villes:', citiesError);
      throw citiesError;
    }
    
    // Calculer le pourcentage pour chaque ville
    const totalCityCount = (cities || []).reduce((sum, item) => sum + (item.count || 0), 0);
    const topCities = (cities || []).map(item => ({
      name: item.city || 'Autre',
      percentage: totalCityCount ? Math.round((item.count || 0) / totalCityCount * 100) : 0
    }));
    
    // Récupérer les données démographiques (genre)
    const { data: genderData, error: genderError } = await supabase
      .from('customer_demographics')
      .select('gender, count')
      .eq('organization_id', user.id)
      .eq('type', 'gender');
    
    if (genderError) {
      console.error('Erreur lors de la récupération des données sur le genre:', genderError);
      throw genderError;
    }
    
    // Formater les données sur le genre
    const gender = (genderData || []).map(item => ({
      name: item.gender === 'male' ? 'Hommes' : 'Femmes',
      value: item.count || 0
    }));
    
    // Récupérer les données démographiques (âge)
    const { data: ageData, error: ageError } = await supabase
      .from('customer_demographics')
      .select('age_range, count')
      .eq('organization_id', user.id)
      .eq('type', 'age')
      .order('age_range');
    
    if (ageError) {
      console.error('Erreur lors de la récupération des données sur l\'âge:', ageError);
      throw ageError;
    }
    
    // Formater les données sur l'âge
    const totalAgeCount = (ageData || []).reduce((sum, item) => sum + (item.count || 0), 0);
    const ageRanges = (ageData || []).map(item => ({
      range: item.age_range || 'Inconnu',
      percentage: totalAgeCount ? Math.round((item.count || 0) / totalAgeCount * 100) : 0
    }));
    
    // Construire et retourner l'objet d'analytics
    return {
      totalCustomers: totalCustomers || 0,
      newCustomersThisMonth: newCustomersThisMonth || 0,
      repeatPurchaseRate: parseFloat(repeatPurchaseRate.toFixed(1)),
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      topSources,
      topCities,
      demographicData: {
        gender,
        ageRanges
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics clients:', error);
    
    // Retourner des données par défaut en cas d'erreur
    return {
      totalCustomers: 0,
      newCustomersThisMonth: 0,
      repeatPurchaseRate: 0,
      averageOrderValue: 0,
      topSources: [],
      topCities: [],
      demographicData: {
        gender: [],
        ageRanges: []
      }
    };
  }
};

// Fonction pour récupérer toutes les données marketing en une seule fois
export const getAllMarketingData = async (): Promise<MarketingData> => {
  try {
    // Récupérer les différentes données en parallèle
    const [
      popularProducts,
      abandonedCarts,
      promotions,
      customerAnalytics
    ] = await Promise.all([
      getPopularProducts(),
      getAbandonedCarts(),
      getPromotions(),
      getCustomerAnalytics()
    ]);
    
    return {
      popularProducts,
      abandonedCarts,
      promotions,
      customerAnalytics
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de toutes les données marketing:', error);
    
    // Retourner des données vides en cas d'erreur
    return {
      popularProducts: [],
      abandonedCarts: [],
      promotions: [],
      customerAnalytics: {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        repeatPurchaseRate: 0,
        averageOrderValue: 0,
        topSources: [],
        topCities: [],
        demographicData: {
          gender: [],
          ageRanges: []
        }
      }
    };
  }
};
