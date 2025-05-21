import { supabase } from './supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Shipment, normalizeShipment } from './types/shipment';

// Interface pour les réponses paginées
export interface ShipmentsResponse {
  shipments: Shipment[];
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

// Fonction pour générer un code de retrait pour les commandes en mode phygital
export function generatePickupCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres
}

// Fonction pour obtenir les livraisons depuis Supabase
export const getShipments = async (
  page = 1, 
  limit = 10, 
  status?: 'prepared' | 'in_transit' | 'delivered' | 'ready_for_pickup' | 'picked_up' | 'canceled' | 'all',
  searchTerm?: string,
  shippingMethod?: 'home_delivery' | 'store_pickup' | 'all'
): Promise<ShipmentsResponse> => {
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
      .from('shipments')
      .select('*')
      .eq('organization_id', user.id);
    
    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Filtrer par méthode d'expédition si spécifiée
    if (shippingMethod && shippingMethod !== 'all') {
      query = query.eq('shipping_method', shippingMethod);
    }
    
    // Filtrer par terme de recherche si spécifié
    if (searchTerm) {
      query = query.or(`customer_name.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%,tracking_number.ilike.%${searchTerm}%`);
    }
    
    // Récupérer toutes les livraisons pour le comptage
    const { data: allShipments } = await supabase
      .from('shipments')
      .select('id')
      .eq('organization_id', user.id);
    
    // Compter manuellement le nombre total de livraisons
    const count = allShipments?.length || 0;
    
    // Récupérer les livraisons paginées
    const { data: shipments, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Erreur lors de la récupération des livraisons:', error);
      throw error;
    }
    
    // Formater les livraisons pour correspondre à l'interface Shipment
    const formattedShipments: Shipment[] = (shipments || []).map(shipment => ({
      id: shipment.id,
      orderId: shipment.order_id,
      customer: {
        name: shipment.customer_name || 'Client inconnu',
        phone: shipment.customer_phone || '',
        email: shipment.customer_email || ''
      },
      status: shipment.status || 'prepared',
      trackingNumber: shipment.tracking_number,
      carrier: shipment.carrier,
      estimatedDelivery: shipment.estimated_delivery ? formatDate(shipment.estimated_delivery) : undefined,
      shippingAddress: shipment.shipping_address,
      shippingMethod: shipment.shipping_method || 'home_delivery',
      storeLocation: shipment.store_location,
      lastUpdate: formatDate(shipment.updated_at || shipment.created_at),
      history: shipment.history || [],
      pickupCode: shipment.pickup_code || (shipment.shipping_method === 'store_pickup' ? generatePickupCode() : undefined)
    }));
    
    return {
      shipments: formattedShipments,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des livraisons:', error);
    
    // Retourner une réponse vide en cas d'erreur
    return {
      shipments: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

// Fonction pour mettre à jour le statut d'une livraison
export const updateShipmentStatus = async (
  shipmentId: string, 
  status: 'prepared' | 'in_transit' | 'delivered' | 'ready_for_pickup' | 'picked_up' | 'canceled',
  comment?: string,
  location?: string
): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer la livraison actuelle pour obtenir l'historique
    const { data: currentShipment, error: fetchError } = await supabase
      .from('shipments')
      .select('history')
      .eq('id', shipmentId)
      .eq('organization_id', user.id)
      .single();
    
    if (fetchError) {
      console.error('Erreur lors de la récupération de la livraison:', fetchError);
      return false;
    }
    
    // Créer une nouvelle entrée d'historique
    const now = new Date();
    const historyEntry = {
      date: formatDate(now.toISOString()),
      status: status,
      location: location || '',
      comment: comment || ''
    };
    
    // Mettre à jour l'historique
    const history = [...(currentShipment?.history || []), historyEntry];
    
    // Préparer les données de mise à jour
    const updateData = {
      status,
      updated_at: now.toISOString(),
      history
    };
    
    // Mettre à jour la livraison
    const { error } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', shipmentId)
      .eq('organization_id', user.id);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du statut de la livraison:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la livraison:', error);
    return false;
  }
};

// Fonction pour créer une nouvelle livraison à partir d'une commande acceptée
export const createShipmentFromOrder = async (
  orderId: string,
  shippingMethod: 'home_delivery' | 'store_pickup',
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  },
  shippingAddress?: string,
  storeLocation?: string
): Promise<string | null> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    const now = new Date();
    const formattedNow = formatDate(now.toISOString());
    
    // Générer un numéro de suivi pour les livraisons à domicile
    const trackingNumber = shippingMethod === 'home_delivery' 
      ? `FBE${Math.floor(Math.random() * 100000000)}FR` 
      : undefined;
    
    // Générer un code de retrait pour les retraits en magasin
    const pickupCode = shippingMethod === 'store_pickup' 
      ? generatePickupCode() 
      : undefined;
    
    // Créer l'historique initial
    const initialHistory = [{
      date: formattedNow,
      status: 'prepared',
      location: shippingMethod === 'store_pickup' ? storeLocation : 'Entrepôt',
      comment: 'Commande préparée'
    }];
    
    // Préparer les données de la nouvelle livraison
    const shipmentData = {
      id: `SHIP-${Date.now()}`,
      order_id: orderId,
      organization_id: user.id,
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      customer_email: customerInfo.email,
      status: 'prepared',
      tracking_number: trackingNumber,
      carrier: shippingMethod === 'home_delivery' ? 'Transporteur Standard' : undefined,
      estimated_delivery: shippingMethod === 'home_delivery' 
        ? new Date(now.setDate(now.getDate() + 3)).toISOString() 
        : undefined,
      shipping_address: shippingAddress,
      shipping_method: shippingMethod,
      store_location: storeLocation,
      pickup_code: pickupCode,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      history: initialHistory
    };
    
    // Insérer la nouvelle livraison
    const { data, error } = await supabase
      .from('shipments')
      .insert(shipmentData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la livraison:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Erreur lors de la création de la livraison:', error);
    return null;
  }
};

// Fonction pour obtenir les statistiques des livraisons
export const getShipmentsStats = async (): Promise<{
  prepared: number;
  in_transit: number;
  delivered: number;
  ready_for_pickup: number;
  picked_up: number;
  canceled: number;
  total: number;
}> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer toutes les livraisons
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('status')
      .eq('organization_id', user.id);
    
    if (error) {
      console.error('Erreur lors de la récupération des statistiques de livraisons:', error);
      throw error;
    }
    
    // Calculer les statistiques
    const prepared = shipments?.filter(shipment => shipment.status === 'prepared').length || 0;
    const in_transit = shipments?.filter(shipment => shipment.status === 'in_transit').length || 0;
    const delivered = shipments?.filter(shipment => shipment.status === 'delivered').length || 0;
    const ready_for_pickup = shipments?.filter(shipment => shipment.status === 'ready_for_pickup').length || 0;
    const picked_up = shipments?.filter(shipment => shipment.status === 'picked_up').length || 0;
    const canceled = shipments?.filter(shipment => shipment.status === 'canceled').length || 0;
    const total = shipments?.length || 0;
    
    return {
      prepared,
      in_transit,
      delivered,
      ready_for_pickup,
      picked_up,
      canceled,
      total
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de livraisons:', error);
    
    // Retourner des statistiques vides en cas d'erreur
    return {
      prepared: 0,
      in_transit: 0,
      delivered: 0,
      ready_for_pickup: 0,
      picked_up: 0,
      canceled: 0,
      total: 0
    };
  }
};
