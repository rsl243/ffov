import React from 'react';
import Link from 'next/link';
import { FiHome, FiShoppingBag, FiUser, FiCreditCard, FiTruck, FiTag, FiUsers, FiMap, FiGlobe, FiLayers, FiBell, FiDatabase, FiLock, FiFileText, FiMapPin } from 'react-icons/fi';

export default function ParametresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Barre latérale des paramètres */}
      <aside className="w-64 bg-[#1a1a1a] text-white">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold font-montserrat">
              <span className="text-gradient">FAET</span>
            </Link>
          </div>
        </div>
        
        <nav className="p-2 font-montserrat">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/parametres" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiHome className="mr-3" /> Général
              </Link>
            </li>
            <li>
              <Link 
                href="/parametres/compte" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiUser className="mr-3" /> Compte
              </Link>
            </li>
            <li>
              <Link 
                href="/parametres/facturation" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiFileText className="mr-3" /> Facturation
              </Link>
            </li>
            <li>
              <Link 
                href="/parametres/utilisateurs" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiUsers className="mr-3" /> Utilisateurs
              </Link>
            </li>
            <li>
              <Link 
                href="/parametres/paiement" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiCreditCard className="mr-3" /> Moyens de paiement
              </Link>
            </li>
            <li>
              <Link 
                href="/parametres/expedition" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiTruck className="mr-3" /> Expédition et livraison
              </Link>
            </li>
            <li>
              <Link 
                href="/parametres/notifications" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiBell className="mr-3" /> Notifications
              </Link>
            </li>
            <li>
              <Link 
                href="/parametres/politiques" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiFileText className="mr-3" /> Politiques
              </Link>
            </li>
            <li>
              <Link 
                href="/parametres/entreprise" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiFileText className="mr-3" /> Entreprise
              </Link>
            </li>
            <li>
              <Link 
                href="/parametres/emplacements" 
                className="flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base hover:bg-gray-800 text-white"
              >
                <FiMapPin className="mr-3" /> Emplacements
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
} 