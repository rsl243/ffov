// Interface pour les livraisons compatible avec l'API Supabase
export interface Shipment {
  id: string;
  orderId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    firstName?: string; // Pour la compatibilité avec l'ancienne interface
    lastName?: string;  // Pour la compatibilité avec l'ancienne interface
  };
  status: 'prepared' | 'in_transit' | 'delivered' | 'ready_for_pickup' | 'picked_up' | 'canceled';
  currentStatus?: 'prepared' | 'in_transit' | 'delivered' | 'ready_for_pickup' | 'picked_up' | 'canceled'; // Pour la compatibilité avec l'ancienne interface
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  estimatedDeliveryDate?: string; // Pour la compatibilité avec l'ancienne interface
  actualDeliveryDate?: string; // Pour la compatibilité avec l'ancienne interface
  shippingAddress?: string;
  deliveryAddress?: string; // Pour la compatibilité avec l'ancienne interface
  shippingMethod: 'home_delivery' | 'store_pickup';
  storeLocation?: string;
  store?: { // Pour la compatibilité avec l'ancienne interface
    name: string;
    address?: string;
    phone?: string;
  };
  relayPoint?: { // Pour la compatibilité avec l'ancienne interface
    name: string;
    address: string;
  };
  lastUpdate: string;
  lastUpdated?: string; // Pour la compatibilité avec l'ancienne interface
  history: {
    date: string;
    status: string;
    location?: string;
    comment?: string;
  }[];
  statusHistory?: { // Pour la compatibilité avec l'ancienne interface
    status: string;
    timestamp: string;
    comment?: string;
  }[];
  pickupCode?: string;
  items?: { // Pour la compatibilité avec l'ancienne interface
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount?: number; // Pour la compatibilité avec l'ancienne interface
  cancellationReason?: string; // Pour la compatibilité avec l'ancienne interface
}

// Fonction pour convertir entre les formats d'interface
export function normalizeShipment(shipment: any): Shipment {
  return {
    id: shipment.id,
    orderId: shipment.orderId || shipment.order_id,
    customer: {
      name: shipment.customer?.name || `${shipment.customer?.firstName || ''} ${shipment.customer?.lastName || ''}`.trim(),
      phone: shipment.customer?.phone || '',
      email: shipment.customer?.email || '',
      firstName: shipment.customer?.firstName,
      lastName: shipment.customer?.lastName
    },
    status: shipment.status || shipment.currentStatus || 'prepared',
    currentStatus: shipment.status || shipment.currentStatus || 'prepared',
    trackingNumber: shipment.trackingNumber || shipment.tracking_number,
    carrier: shipment.carrier,
    estimatedDelivery: shipment.estimatedDelivery || shipment.estimatedDeliveryDate,
    estimatedDeliveryDate: shipment.estimatedDelivery || shipment.estimatedDeliveryDate,
    actualDeliveryDate: shipment.actualDeliveryDate,
    shippingAddress: shipment.shippingAddress || shipment.deliveryAddress,
    deliveryAddress: shipment.shippingAddress || shipment.deliveryAddress,
    shippingMethod: shipment.shippingMethod || 'home_delivery',
    storeLocation: shipment.storeLocation || shipment.store?.name,
    store: shipment.store || (shipment.storeLocation ? { name: shipment.storeLocation } : undefined),
    relayPoint: shipment.relayPoint,
    lastUpdate: shipment.lastUpdate || shipment.lastUpdated || new Date().toISOString(),
    lastUpdated: shipment.lastUpdate || shipment.lastUpdated || new Date().toISOString(),
    history: shipment.history || shipment.statusHistory?.map((entry: any) => ({
      date: entry.timestamp,
      status: entry.status,
      comment: entry.comment
    })) || [],
    statusHistory: shipment.statusHistory || shipment.history?.map((entry: any) => ({
      status: entry.status,
      timestamp: entry.date,
      comment: entry.comment
    })) || [],
    pickupCode: shipment.pickupCode,
    items: shipment.items || [],
    totalAmount: shipment.totalAmount || 0,
    cancellationReason: shipment.cancellationReason
  };
}
