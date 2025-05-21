import { supabase } from './supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createNewClientNotification } from './notificationUtils';

// Interface pour les clients
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: string;
  lastOrder: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// Interface pour les réponses paginées
export interface ClientsResponse {
  clients: Client[];
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
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return date;
  }
};

// Fonction pour obtenir les clients depuis Supabase
export const getClients = async (
  page = 1, 
  limit = 10, 
  status?: 'active' | 'inactive' | 'all',
  searchTerm?: string
): Promise<ClientsResponse> => {
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
      .from('customers')
      .select('*')
      .eq('organization_id', user.id);
    
    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Filtrer par terme de recherche si spécifié
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }
    
    // Récupérer tous les clients pour le comptage
    const { data: allClients } = await supabase
      .from('customers')
      .select('id')
      .eq('organization_id', user.id);
    
    // Compter manuellement le nombre total de clients
    const count = allClients?.length || 0;
    
    // Récupérer les clients paginés
    const { data: clients, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
    
    // Pour chaque client, récupérer ses commandes
    const formattedClients: Client[] = await Promise.all((clients || []).map(async (client) => {
      // Récupérer les commandes du client
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', client.id)
        .eq('organization_id', user.id);
      
      if (ordersError) {
        console.error('Erreur lors de la récupération des commandes du client:', ordersError);
      }
      
      // Calculer le nombre total de commandes
      const totalOrders = orders?.length || 0;
      
      // Calculer le montant total dépensé
      const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      // Trouver la date de la dernière commande
      let lastOrderDate = '';
      if (orders && orders.length > 0) {
        // Trier les commandes par date décroissante
        const sortedOrders = [...orders].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        lastOrderDate = sortedOrders[0]?.created_at || '';
      }
      
      return {
        id: client.id,
        name: client.name || 'Client inconnu',
        email: client.email || '',
        phone: client.phone || '',
        totalOrders,
        totalSpent: formatAmount(totalSpent),
        lastOrder: lastOrderDate ? formatDate(lastOrderDate) : 'Aucune commande',
        address: client.address || '',
        status: client.status || 'active',
        createdAt: client.created_at,
        updatedAt: client.updated_at
      };
    }));
    
    return {
      clients: formattedClients,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    
    // Retourner une réponse vide en cas d'erreur
    return {
      clients: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

// Fonction pour créer un nouveau client
export const createClient = async (
  clientData: {
    name: string;
    email: string;
    phone: string;
    address: string;
  }
): Promise<Client | null> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Vérifier si le client existe déjà (par email)
    const { data: existingClients } = await supabase
      .from('customers')
      .select('*')
      .eq('email', clientData.email)
      .eq('organization_id', user.id);
    
    if (existingClients && existingClients.length > 0) {
      throw new Error('Un client avec cet email existe déjà');
    }
    
    // Préparer les données du nouveau client
    const now = new Date().toISOString();
    const newClient = {
      id: `client_${Date.now()}`,
      organization_id: user.id,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      status: 'active',
      created_at: now,
      updated_at: now
    };
    
    // Insérer le nouveau client
    const { data, error } = await supabase
      .from('customers')
      .insert(newClient)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
    
    // Créer une notification pour le nouveau client
    try {
      await createNewClientNotification(data.name || 'Client inconnu', data.id);
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas faire échouer l'opération si la notification échoue
    }
    
    // Retourner le client formaté
    return {
      id: data.id,
      name: data.name || 'Client inconnu',
      email: data.email || '',
      phone: data.phone || '',
      totalOrders: 0,
      totalSpent: formatAmount(0),
      lastOrder: 'Aucune commande',
      address: data.address || '',
      status: data.status || 'active',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    return null;
  }
};

// Fonction pour mettre à jour un client
export const updateClient = async (
  clientId: string,
  clientData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    status?: 'active' | 'inactive';
  }
): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Préparer les données de mise à jour
    const updateData = {
      ...clientData,
      updated_at: new Date().toISOString()
    };
    
    // Mettre à jour le client
    const { error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', clientId)
      .eq('organization_id', user.id);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    return false;
  }
};

// Fonction pour envoyer une relance à un client
export const sendClientReminder = async (
  clientId: string,
  reminderData: {
    subject: string;
    message: string;
  }
): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer les informations du client
    const { data: client, error: clientError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', clientId)
      .eq('organization_id', user.id)
      .single();
    
    if (clientError || !client) {
      console.error('Erreur lors de la récupération du client:', clientError);
      return false;
    }
    
    // Enregistrer la relance dans la base de données
    const now = new Date().toISOString();
    const reminder = {
      id: `reminder_${Date.now()}`,
      organization_id: user.id,
      customer_id: clientId,
      subject: reminderData.subject,
      message: reminderData.message,
      status: 'sent',
      created_at: now,
      updated_at: now
    };
    
    const { error: reminderError } = await supabase
      .from('customer_reminders')
      .insert(reminder);
    
    if (reminderError) {
      console.error('Erreur lors de l\'enregistrement de la relance:', reminderError);
      return false;
    }
    
    // Dans une application réelle, on enverrait ici un email au client
    // Pour cette démo, on simule juste un succès
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la relance:', error);
    return false;
  }
};

// Fonction pour envoyer une promotion à un client
export const sendClientPromotion = async (
  clientId: string,
  promotionData: {
    code: string;
    discount: number;
    expirationDate: string;
    message: string;
  }
): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer les informations du client
    const { data: client, error: clientError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', clientId)
      .eq('organization_id', user.id)
      .single();
    
    if (clientError || !client) {
      console.error('Erreur lors de la récupération du client:', clientError);
      return false;
    }
    
    // Créer le code promo dans la base de données
    const now = new Date().toISOString();
    const promotion = {
      id: `promo_${Date.now()}`,
      organization_id: user.id,
      customer_id: clientId,
      code: promotionData.code,
      discount: promotionData.discount,
      expiration_date: promotionData.expirationDate,
      message: promotionData.message,
      status: 'active',
      created_at: now,
      updated_at: now
    };
    
    const { error: promoError } = await supabase
      .from('customer_promotions')
      .insert(promotion);
    
    if (promoError) {
      console.error('Erreur lors de la création de la promotion:', promoError);
      return false;
    }
    
    // Dans une application réelle, on enverrait ici un email au client
    // Pour cette démo, on simule juste un succès
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la promotion:', error);
    return false;
  }
};

// Fonction pour obtenir les statistiques des clients
export const getClientsStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer tous les clients
    const { data: clients, error } = await supabase
      .from('customers')
      .select('id, status, created_at')
      .eq('organization_id', user.id);
    
    if (error) {
      console.error('Erreur lors de la récupération des statistiques des clients:', error);
      throw error;
    }
    
    // Calculer les statistiques
    const total = clients?.length || 0;
    const active = clients?.filter(client => client.status === 'active').length || 0;
    const inactive = clients?.filter(client => client.status === 'inactive').length || 0;
    
    // Calculer le nombre de nouveaux clients ce mois-ci
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = clients?.filter(client => {
      const createdAt = new Date(client.created_at);
      return createdAt >= firstDayOfMonth;
    }).length || 0;
    
    return {
      total,
      active,
      inactive,
      newThisMonth
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des clients:', error);
    
    // Retourner des statistiques vides en cas d'erreur
    return {
      total: 0,
      active: 0,
      inactive: 0,
      newThisMonth: 0
    };
  }
};
