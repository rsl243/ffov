// Types pour la gestion des livraisons
export type ShipmentStatus = 
  | "pending" 
  | "processing" 
  | "prepared" 
  | "in_transit" 
  | "delivered" 
  | "ready_for_pickup" 
  | "picked_up" 
  | "cancelled" 
  | "returned" 
  | "failed_delivery";

export type ShipmentMethod = 
  | "home_delivery" 
  | "store_pickup" 
  | "relay_point" 
  | "express";

export type StatusHistoryEntry = {
  status: ShipmentStatus;
  timestamp: string;
  comment?: string;
};

export type ShipmentItem = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
};

export type Address = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type Store = {
  id: string;
  name: string;
  address: Address;
  phone: string;
  openingHours?: string;
};

export type RelayPoint = {
  id: string;
  name: string;
  address: Address;
  phone: string;
  openingHours?: string;
};

export type Shipment = {
  id: string;
  orderId: string;
  orderDate: string;
  trackingNumber: string;
  currentStatus: ShipmentStatus;
  statusHistory: StatusHistoryEntry[];
  customer: Customer;
  shippingMethod: ShipmentMethod;
  deliveryAddress?: Address;
  store?: Store;
  relayPoint?: RelayPoint;
  carrier: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  items: ShipmentItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  lastUpdated: string;
}; 