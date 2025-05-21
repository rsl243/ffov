import React, { useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useGlobalNotification } from './GlobalNotificationProvider';
import NotificationsDropdown from './dashboard/NotificationsDropdown';
import { useUserProfile } from '@/contexts/UserProfileContext';

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ 
  title
}: PageHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { notifications, unreadCount, loading, markAllNotificationsAsRead } = useNotifications();
  const { addNotification } = useGlobalNotification();
  const { profile, loading: profileLoading } = useUserProfile();
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false); // Fermer le menu utilisateur si ouvert
  };
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false); // Fermer les notifications si ouvertes
  };
  
  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    addNotification({ 
      message: 'Toutes les notifications ont été marquées comme lues', 
      type: 'success' 
    });
  };
  
  return (
    <header className="bg-white shadow-sm relative z-20">
      <div className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold font-montserrat">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            className="text-gray-600 hover:text-gray-900 relative"
            onClick={toggleNotifications}
            aria-label="Notifications"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Utiliser le composant NotificationsDropdown avec les notifications centralisées */}
          <NotificationsDropdown 
            notifications={notifications} 
            unreadCount={unreadCount} 
            showNotifications={showNotifications} 
            markAllAsRead={handleMarkAllAsRead} 
            onClose={() => setShowNotifications(false)}
            isLoading={loading} 
          />
          
          <div className="relative">
            <button 
              className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white cursor-pointer"
              onClick={toggleUserMenu}
              aria-label="Menu utilisateur"
            >
              {!profileLoading && profile ? 
                `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}` : 
                '...'}
            </button>
            
            {/* Menu utilisateur */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-30">
                <div className="p-3 border-b border-gray-200">
                  <p className="font-medium">{profile?.fullName || 'Utilisateur'}</p>
                  <p className="text-xs text-gray-500">{profile?.email || 'Chargement...'}</p>
                </div>
                <ul>
                  <li>
                    <Link href="/parametres/compte" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Mon compte
                    </Link>
                  </li>
                  <li>
                    <Link href="/parametres" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Paramètres
                    </Link>
                  </li>
                  <li className="border-t border-gray-100">
                    <Link href="/connexion" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      Déconnexion
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}