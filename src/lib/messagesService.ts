import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface pour les conversations
export interface Conversation {
  id: string;
  sender: 'user' | 'customer';
  content: string;
  time: string;
  read: boolean;
  createdAt: string;
}

// Interface pour les messages
export interface Message {
  id: string;
  customerId: string;
  customerName: string;
  lastMessage: string;
  minutes: number;
  unread: boolean;
  conversations: Conversation[];
  lastUpdated: string;
  status: 'open' | 'resolved' | 'pending';
}

// Interface pour les réponses paginées
export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Fonction pour formater le temps relatif
const formatRelativeTime = (date: string): string => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Date inconnue';
  }
};

// Fonction pour obtenir les minutes depuis le dernier message
const getMinutesSinceLastMessage = (date: string): number => {
  try {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    return Math.floor(diffMs / (1000 * 60));
  } catch (error) {
    console.error('Erreur de calcul de temps:', error);
    return 0;
  }
};

// Fonction pour récupérer les messages
export const getMessages = async (
  page = 1,
  limit = 10,
  status?: 'open' | 'resolved' | 'pending' | 'all',
  searchTerm?: string
): Promise<MessagesResponse> => {
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
      .from('customer_messages')
      .select('*, customer:customers(*)')
      .eq('organization_id', user.id);
    
    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Filtrer par terme de recherche si spécifié
    if (searchTerm) {
      query = query.or(`content.ilike.%${searchTerm}%,customer.name.ilike.%${searchTerm}%`);
    }
    
    // Récupérer tous les messages pour le comptage
    const { data: allMessages } = await supabase
      .from('customer_messages')
      .select('id')
      .eq('organization_id', user.id);
    
    // Compter manuellement le nombre total de messages
    const count = allMessages?.length || 0;
    
    // Récupérer les messages paginés
    const { data: messages, error } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
    
    // Pour chaque message, récupérer les conversations associées
    const formattedMessages: Message[] = await Promise.all((messages || []).map(async (message) => {
      // Récupérer les conversations du message
      const { data: conversations, error: conversationsError } = await supabase
        .from('message_conversations')
        .select('*')
        .eq('message_id', message.id)
        .order('created_at', { ascending: true });
      
      if (conversationsError) {
        console.error('Erreur lors de la récupération des conversations:', conversationsError);
      }
      
      // Formater les conversations
      const formattedConversations: Conversation[] = (conversations || []).map(conv => ({
        id: conv.id,
        sender: conv.sender,
        content: conv.content,
        time: formatRelativeTime(conv.created_at),
        read: conv.read,
        createdAt: conv.created_at
      }));
      
      // Calculer le nombre de minutes depuis le dernier message
      const minutes = getMinutesSinceLastMessage(message.updated_at);
      
      // Calculer si des messages non lus existent
      const unread = formattedConversations.some(conv => 
        conv.sender === 'customer' && !conv.read
      );
      
      return {
        id: message.id,
        customerId: message.customer?.id || '',
        customerName: message.customer?.name || 'Client inconnu',
        lastMessage: message.content || '',
        minutes,
        unread,
        conversations: formattedConversations,
        lastUpdated: message.updated_at,
        status: message.status || 'open'
      };
    }));
    
    return {
      messages: formattedMessages,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    
    // Retourner une réponse vide en cas d'erreur
    return {
      messages: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

// Fonction pour envoyer un nouveau message
export const sendMessage = async (
  customerId: string,
  content: string
): Promise<Message | null> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    const now = new Date().toISOString();
    
    // Vérifier s'il existe déjà une conversation avec ce client
    const { data: existingMessage } = await supabase
      .from('customer_messages')
      .select('*')
      .eq('customer_id', customerId)
      .eq('organization_id', user.id)
      .single();
    
    let messageId;
    
    if (existingMessage) {
      // Mettre à jour le message existant
      messageId = existingMessage.id;
      
      await supabase
        .from('customer_messages')
        .update({
          content,
          updated_at: now,
          status: 'open'
        })
        .eq('id', messageId);
    } else {
      // Créer un nouveau message
      messageId = `msg_${uuidv4()}`;
      
      await supabase
        .from('customer_messages')
        .insert({
          id: messageId,
          customer_id: customerId,
          organization_id: user.id,
          content,
          status: 'open',
          created_at: now,
          updated_at: now
        });
    }
    
    // Ajouter la conversation
    const conversationId = `conv_${uuidv4()}`;
    
    await supabase
      .from('message_conversations')
      .insert({
        id: conversationId,
        message_id: messageId,
        sender: 'user',
        content,
        read: true,
        created_at: now,
        updated_at: now
      });
    
    // Récupérer le message mis à jour
    const updatedMessage = await getMessageById(messageId);
    
    return updatedMessage;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    return null;
  }
};

// Fonction pour obtenir un message par ID
export const getMessageById = async (
  messageId: string
): Promise<Message | null> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer le message
    const { data: message, error } = await supabase
      .from('customer_messages')
      .select('*, customer:customers(*)')
      .eq('id', messageId)
      .eq('organization_id', user.id)
      .single();
    
    if (error || !message) {
      console.error('Erreur lors de la récupération du message:', error);
      return null;
    }
    
    // Récupérer les conversations du message
    const { data: conversations, error: conversationsError } = await supabase
      .from('message_conversations')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });
    
    if (conversationsError) {
      console.error('Erreur lors de la récupération des conversations:', conversationsError);
    }
    
    // Formater les conversations
    const formattedConversations: Conversation[] = (conversations || []).map(conv => ({
      id: conv.id,
      sender: conv.sender,
      content: conv.content,
      time: formatRelativeTime(conv.created_at),
      read: conv.read,
      createdAt: conv.created_at
    }));
    
    // Calculer le nombre de minutes depuis le dernier message
    const minutes = getMinutesSinceLastMessage(message.updated_at);
    
    // Calculer si des messages non lus existent
    const unread = formattedConversations.some(conv => 
      conv.sender === 'customer' && !conv.read
    );
    
    return {
      id: message.id,
      customerId: message.customer?.id || '',
      customerName: message.customer?.name || 'Client inconnu',
      lastMessage: message.content || '',
      minutes,
      unread,
      conversations: formattedConversations,
      lastUpdated: message.updated_at,
      status: message.status || 'open'
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du message:', error);
    return null;
  }
};

// Fonction pour marquer les messages d'un client comme lus
export const markMessagesAsRead = async (
  messageId: string
): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Marquer toutes les conversations comme lues
    const { error } = await supabase
      .from('message_conversations')
      .update({ read: true })
      .eq('message_id', messageId)
      .eq('sender', 'customer');
    
    if (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du marquage des messages comme lus:', error);
    return false;
  }
};

// Fonction pour mettre à jour le statut d'un message
export const updateMessageStatus = async (
  messageId: string,
  status: 'open' | 'resolved' | 'pending'
): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Mettre à jour le statut du message
    const { error } = await supabase
      .from('customer_messages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('organization_id', user.id);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du statut du message:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du message:', error);
    return false;
  }
};

// Fonction pour obtenir les statistiques des messages
export const getMessagesStats = async (): Promise<{
  total: number;
  open: number;
  resolved: number;
  pending: number;
}> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Récupérer tous les messages
    const { data: messages, error } = await supabase
      .from('customer_messages')
      .select('id, status')
      .eq('organization_id', user.id);
    
    if (error) {
      console.error('Erreur lors de la récupération des statistiques des messages:', error);
      throw error;
    }
    
    // Calculer les statistiques
    const total = messages?.length || 0;
    const open = messages?.filter(message => message.status === 'open').length || 0;
    const resolved = messages?.filter(message => message.status === 'resolved').length || 0;
    const pending = messages?.filter(message => message.status === 'pending').length || 0;
    
    return {
      total,
      open,
      resolved,
      pending
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des messages:', error);
    
    // Retourner des statistiques vides en cas d'erreur
    return {
      total: 0,
      open: 0,
      resolved: 0,
      pending: 0
    };
  }
};
