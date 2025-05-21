'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';

export interface GlobalNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface GlobalNotificationProviderProps {
  children: React.ReactNode;
}

// Créer un contexte pour le gestionnaire de notifications
export const GlobalNotificationContext = React.createContext<{
  addNotification: (notification: Omit<GlobalNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}>({
  addNotification: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},
});

export const GlobalNotificationProvider: React.FC<GlobalNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);

  // Ajouter une nouvelle notification
  const addNotification = (notification: Omit<GlobalNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);

    // Supprimer automatiquement la notification après la durée spécifiée
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  // Supprimer une notification par son ID
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  // Supprimer toutes les notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Icônes par type de notification
  const getIcon = (type: GlobalNotification['type']) => {
    switch (type) {
      case 'success':
        return <FiCheck className="text-white" size={18} />;
      case 'error':
        return <FiX className="text-white" size={18} />;
      case 'warning':
        return <FiAlertCircle className="text-white" size={18} />;
      case 'info':
        return <FiInfo className="text-white" size={18} />;
    }
  };

  // Couleurs par type de notification
  const getColors = (type: GlobalNotification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <GlobalNotificationContext.Provider value={{ addNotification, removeNotification, clearNotifications }}>
      {children}

      {/* Container des notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center justify-between p-4 rounded-md shadow-md max-w-md transition-all duration-300 ease-in-out ${getColors(
              notification.type
            )}`}
            style={{ minWidth: '300px' }}
          >
            <div className="flex items-center">
              <div className="mr-3 flex items-center justify-center">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">{notification.message}</div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-3 hover:opacity-75 focus:outline-none text-white"
            >
              <FiX size={18} />
            </button>
          </div>
        ))}
      </div>
    </GlobalNotificationContext.Provider>
  );
};

// Hook pour utiliser le gestionnaire de notifications
export const useGlobalNotification = () => {
  const context = React.useContext(GlobalNotificationContext);
  
  if (!context) {
    throw new Error('useGlobalNotification must be used within a GlobalNotificationProvider');
  }
  
  return context;
};
