import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitaires pour formatage des données et styles
 */

// Utilitaire pour les classes conditionnelles
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatage des prix
export const formatCurrency = (value: number): string => {
  return value.toFixed(2) + ' €';
};

// Formatage des pourcentages
export const formatPercent = (value: number): string => {
  return value.toFixed(2) + '%';
};

// Formatage des dates (simple)
export const formatDate = (dateString: string): string => {
  // Supposant que dateString est au format DD/MM/YYYY HH:MM
  return dateString;
};

// Formatage relatif du temps (il y a X heures/minutes)
export const formatRelativeTime = (minutes: number): string => {
  if (minutes < 60) {
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(minutes / 60);
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
};

// Conversion des statuts en français
export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'En attente',
    'accepted': 'Acceptée',
    'refused': 'Refusée',
    'completed': 'Complétée',
    'processing': 'En traitement',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée'
  };
  
  return statusMap[status.toLowerCase()] || status;
};

// Conversion des raisons de refus en texte lisible
export const getRefusalReasonLabel = (reason: string): string => {
  const reasonMap: Record<string, string> = {
    'rupture_stock': 'Rupture de stock',
    'adresse_incorrecte': 'Adresse incorrecte',
    'livraison_non_disponible': 'Livraison à domicile non disponible',
    'retrait_non_disponible': 'Retrait en boutique non disponible',
    'autre': 'Autre raison'
  };
  
  return reasonMap[reason] || reason;
};

// Tronquer le texte pour éviter les débordements
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Fonctions pour la gestion des livraisons
export function getShipmentMethodLabel(method: string): string {
  const methods: Record<string, string> = {
    "home_delivery": "Livraison à domicile",
    "store_pickup": "Retrait en boutique",
    "relay_point": "Point relais",
    "express": "Livraison express",
  };
  
  return methods[method] || method;
}

export function getShipmentStatusLabel(status: string): string {
  const statuses: Record<string, string> = {
    "pending": "En attente",
    "processing": "En traitement",
    "prepared": "Préparé",
    "in_transit": "En transit",
    "delivered": "Livré",
    "ready_for_pickup": "Prêt pour retrait",
    "picked_up": "Retiré",
    "cancelled": "Annulé",
    "returned": "Retourné",
    "failed_delivery": "Échec de livraison"
  };
  
  return statuses[status] || status;
}

export function getShipmentStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "pending":
      return { bg: "bg-yellow-100", text: "text-yellow-800" };
    case "processing":
      return { bg: "bg-blue-100", text: "text-blue-800" };
    case "prepared":
      return { bg: "bg-indigo-100", text: "text-indigo-800" };
    case "in_transit":
      return { bg: "bg-purple-100", text: "text-purple-800" };
    case "delivered":
      return { bg: "bg-green-100", text: "text-green-800" };
    case "ready_for_pickup":
      return { bg: "bg-cyan-100", text: "text-cyan-800" };
    case "picked_up":
      return { bg: "bg-green-100", text: "text-green-800" };
    case "cancelled":
      return { bg: "bg-red-100", text: "text-red-800" };
    case "returned":
      return { bg: "bg-orange-100", text: "text-orange-800" };
    case "failed_delivery":
      return { bg: "bg-red-100", text: "text-red-800" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-800" };
  }
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Supprimer tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  
  // Format français: XX XX XX XX XX
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  return phone;
} 