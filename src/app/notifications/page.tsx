"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { FiBell, FiCheck, FiChevronRight } from 'react-icons/fi';
import Sidebar from '@/components/Sidebar';

export default function NotificationsPage() {
  // Données factices pour les notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Nouvelle commande", message: "Une nouvelle commande a été passée", time: "Il y a 10 minutes", read: false },
    { id: 2, title: "Stock faible", message: "Le produit 'iPhone 15 Pro' est presque en rupture", time: "Il y a 1 heure", read: false },
    { id: 3, title: "Paiement reçu", message: "Le paiement de la commande #78523 a été confirmé", time: "Il y a 3 heures", read: false },
    { id: 4, title: "Nouveau message", message: "Un client a posé une question sur sa commande", time: "Il y a 5 heures", read: true },
    { id: 5, title: "Livraison effectuée", message: "La commande #98765 a été livrée avec succès", time: "Hier", read: true },
    { id: 6, title: "Nouvel avis client", message: "Un client a laissé un avis 5 étoiles pour le produit 'AirPods Pro'", time: "Hier", read: true },
    { id: 7, title: "Promotion terminée", message: "La promotion 'Soldes d'été' est maintenant terminée", time: "Il y a 2 jours", read: true },
    { id: 8, title: "Mise à jour logicielle", message: "Une nouvelle version du logiciel est disponible", time: "Il y a 3 jours", read: true }
  ]);

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  // Obtenir le nombre de notifications non lues
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Notifications" />
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Toutes les notifications</h1>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <FiCheck className="mr-1" /> Tout marquer comme lu
                </button>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow divide-y">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <FiBell className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune notification</h3>
                  <p className="text-gray-500">Vous n'avez pas encore de notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                              Nouveau
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-400">{notification.time}</p>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <FiChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}