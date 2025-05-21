'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { FiHelpCircle } from 'react-icons/fi';

// Interface adaptée à la structure de l'utilisateur dans SupabaseAuthContext
interface FFOVUser {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    position?: string;
    product_types?: string[];
    selected_plan?: 'ville' | 'region' | 'pays';
    full_name?: string;
  };
}

interface UserProfileProps {
  className?: string;
}

export default function UserProfile({ className = '' }: UserProfileProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Gérer les clics à l'extérieur pour fermer le menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extraire les initiales de l'utilisateur adapté à la structure Supabase
  const getInitials = () => {
    if (!user) return 'MB'; // Valeur par défaut
    
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'MB';
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white font-medium"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {getInitials()}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {user ? `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() : 'Utilisateur'}
            </p>
            <p className="text-sm text-gray-500 truncate">{user?.email || 'utilisateur@example.com'}</p>
          </div>
          <Link 
            href="/parametres/compte" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            onClick={() => setIsOpen(false)}
          >
            Paramètres du compte
          </Link>
          <Link 
            href="/aide" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
            onClick={() => setIsOpen(false)}
          >
            <FiHelpCircle className="mr-2" />
            Centre d'aide
          </Link>
          <button
            onClick={handleLogout}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
} 