// Types partagés pour les articles et commandes
export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  customer: string;
  amount: number;
  items: OrderItem[];
  status: 'pending' | 'accepted' | 'refused';
  address: string;
  reason?: 'rupture_stock' | 'adresse_incorrecte' | 'livraison_non_disponible' | 'retrait_non_disponible' | 'autre';
  relativeTime?: string;
  deliveryType?: 'delivery' | 'phygital';
}

// Types pour la page Finance
export interface Transaction {
  id: number;
  date: string;
  type: 'Vente' | 'Commission' | 'Retour';
  amount: number;
  status: string;
  customer: string;
}

export interface FinancialData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  commissions: {
    total: number;
    thisMonth: number;
    pending: number;
  };
  returns: {
    total: number;
    count: number;
    pending: number;
  };
  subscription: {
    type: string;
    nextBilling: string;
    amount: string;
    status: string;
  };
  transactions: Transaction[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
}

// Types pour les composants partagés
export interface SidebarProps {
  activePage?: string;
}

export interface PageHeaderProps {
  title: string;
  notificationCount?: number;
  userInitials?: string;
}

// Types pour l'authentification
export interface User {
  id: string;
  email: string;
  name?: string;
} 