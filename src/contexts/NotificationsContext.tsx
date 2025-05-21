'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification, Notification } from '@/lib/notificationsService';
import { useAuth } from './SupabaseAuthContext';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addNotification: (title: string, message: string, type: 'order' | 'stock' | 'payment' | 'system' | 'other', relatedId?: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const notifs = await getNotifications(10);
      setNotifications(notifs);
      
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      
      // Mettre à jour l'état local
      setNotifications(prevNotifs => 
        prevNotifs.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      
      // Réduire le compteur de notifications non lues
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await markAllAsRead();
      
      // Mettre à jour l'état local
      setNotifications(prevNotifs => 
        prevNotifs.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Mettre à jour le compteur
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };

  const addNotification = async (
    title: string, 
    message: string, 
    type: 'order' | 'stock' | 'payment' | 'system' | 'other' = 'system',
    relatedId?: string
  ) => {
    try {
      const newNotif = await createNotification(title, message, type, relatedId);
      if (newNotif) {
        // Ajouter la nouvelle notification à l'état local
        setNotifications(prev => [newNotif, ...prev].slice(0, 10));
        
        // Augmenter le compteur de notifications non lues
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
    }
  };

  // Charger les notifications au démarrage et quand l'utilisateur change
  useEffect(() => {
    refreshNotifications();
    
    // Rafraîchir les notifications toutes les 60 secondes
    const intervalId = setInterval(refreshNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
