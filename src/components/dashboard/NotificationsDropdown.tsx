import React from 'react';
import Link from 'next/link';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead?: boolean;
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  showNotifications: boolean;
  markAllAsRead: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  unreadCount,
  showNotifications,
  markAllAsRead,
  onClose,
  isLoading = false
}) => {
  if (!showNotifications) return null;
  
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Marquer tout comme lu
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Chargement des notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Aucune notification
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div key={notif.id} className={`p-4 hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                    <p className="text-sm text-gray-500 truncate">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-2 border-t bg-gray-50">
        <Link 
          href="/notifications" 
          className="block w-full px-3 py-2 text-xs text-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
          onClick={onClose}
        >
          Voir toutes les notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
