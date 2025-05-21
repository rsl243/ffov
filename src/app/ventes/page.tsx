"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FiHome, FiShoppingBag, FiBox, FiUsers, FiMessageSquare, FiTruck, FiDollarSign, FiPieChart, FiSpeaker, FiPercent, FiPlus, FiChevronRight, FiChevronDown, FiSettings, FiLink, FiFilter, FiCalendar, FiCheckCircle, FiXCircle, FiAlertCircle, FiChevronUp, FiSearch, FiChevronLeft } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { Order } from '@/lib/types';
import { getStatusLabel, getRefusalReasonLabel } from '@/lib/utils';
import { addShipment } from '@/app/livraisons/page';
import { useRouter } from 'next/navigation';
import { getSales, updateOrderStatus, getSalesStats } from '@/lib/salesService';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function VentesPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refusalReason, setRefusalReason] = useState<'rupture_stock' | 'adresse_incorrecte' | 'livraison_non_disponible' | 'retrait_non_disponible' | 'autre'>('rupture_stock');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'accept' | 'refuse'>('accept');
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'refused' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les filtres
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [hasManyItems, setHasManyItems] = useState(false);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageSize] = useState(10);
  
  // État pour le chargement
  const [loading, setLoading] = useState(true);
  
  // États pour les statistiques
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    refused: 0,
    total: 0,
    totalAmount: '0,00 €',
    todayAmount: '0,00 €'
  });
  
  // Refs pour détecter les clics à l'extérieur des dropdowns
  const filtersRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  // Ajouter ces états supplémentaires au début de votre composant
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [acceptMode, setAcceptMode] = useState<'delivery' | 'phygital'>('delivery');
  const [sellerMessage, setSellerMessage] = useState('');
  const [showAcceptOptionsModal, setShowAcceptOptionsModal] = useState(false);

  const router = useRouter();

  // État pour le message de succès
  const [successMessage, setSuccessMessage] = useState('');
  
  // Charger les ventes et les statistiques
  useEffect(() => {
    if (authLoading || !user) return;
    
    const loadSales = async () => {
      setLoading(true);
      try {
        // Convertir les valeurs des filtres
        const minAmountValue = minAmount ? parseFloat(minAmount) : undefined;
        const maxAmountValue = maxAmount ? parseFloat(maxAmount) : undefined;
        
        // Récupérer les ventes
        const result = await getSales(
          currentPage,
          pageSize,
          activeTab === 'all' ? undefined : activeTab,
          searchTerm || undefined,
          minAmountValue,
          maxAmountValue,
          selectedPeriod === 'all' ? undefined : selectedPeriod as any
        );
        
        setOrders(result.orders);
        setTotalPages(result.totalPages);
        setTotalOrders(result.total);
        
        // Récupérer les statistiques
        const statsResult = await getSalesStats();
        setStats(statsResult);
      } catch (error) {
        console.error('Erreur lors du chargement des ventes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSales();
  }, [user, authLoading, currentPage, pageSize, activeTab, searchTerm, minAmount, maxAmount, selectedPeriod, hasManyItems]);

  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFiltersDropdown(false);
      }
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setMinAmount('');
    setMaxAmount('');
    setHasManyItems(false);
    setShowFiltersDropdown(false);
  };
  
  // Réinitialiser la période
  const resetPeriod = () => {
    setSelectedPeriod('all');
    setShowPeriodDropdown(false);
  };
  const handleAccept = (order: Order) => {
    setSelectedOrder(order);
    setModalType('accept');
    setShowModal(true);
  };

  const handleRefuse = (order: Order) => {
    setSelectedOrder(order);
    setModalType('refuse');
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedOrder) return;
    
    try {
      if (modalType === 'accept') {
        // Mettre à jour le statut de la commande
        const success = await updateOrderStatus(selectedOrder.id, 'accepted', {
          deliveryType: acceptMode,
          sellerMessage: sellerMessage
        });
        
        if (success) {
          // Mettre à jour l'état local
          setOrders(orders.map(o => {
            if (o.id === selectedOrder.id) {
              return { ...o, status: 'accepted', deliveryType: acceptMode };
            }
            return o;
          }));
          
          // Création d'expédition temporairement désactivée pour compatibilité avec les données réelles
          /* 
          // Cette partie a été commentée pour éviter les erreurs de type avec les données réelles
          // Elle sera réactivée lorsque le système d'expédition sera mis à jour pour utiliser les données Supabase
          if (typeof addShipment === 'function') {
            const now = new Date().toISOString();
            
            // Créer un objet d'expédition
            const newShipment = {
              // Propriétés de l'expédition
            };
            
            // Ajouter l'expédition
            // addShipment(newShipment);
          }
          */
          
          setSuccessMessage(`La commande ${selectedOrder.id} a été acceptée avec succès.`);
        }
      } else {
        // Mettre à jour le statut de la commande
        const success = await updateOrderStatus(selectedOrder.id, 'refused', {
          reason: refusalReason
        });
        
        if (success) {
          // Mettre à jour l'état local
          setOrders(orders.map(o => {
            if (o.id === selectedOrder.id) {
              return { ...o, status: 'refused', reason: refusalReason };
            }
            return o;
          }));
          
          setSuccessMessage(`La commande ${selectedOrder.id} a été refusée.`);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la commande:', error);
    } finally {
      setShowModal(false);
      setShowAcceptOptionsModal(false);
      setSellerMessage('');
      
      // Recharger les statistiques
      getSalesStats().then(setStats);
    }
  };

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  if (!authLoading && !user) {
    router.push('/connexion');
    return null;
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader title="Ventes" />
        
        <main className="flex-1 overflow-y-auto p-6">
        {/* Message de succès */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{successMessage}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccessMessage('')}>
              <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Fermer</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}
          
          {/* Statistiques des ventes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <FiShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Ventes du jour</p>
                  <p className="text-xl font-semibold">{stats.todayAmount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                  <FiCheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Commandes acceptées</p>
                  <p className="text-xl font-semibold">{stats.accepted}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                  <FiAlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Commandes en attente</p>
                  <p className="text-xl font-semibold">{stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
                  <FiXCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Commandes refusées</p>
                  <p className="text-xl font-semibold">{stats.refused}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtres et recherche */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex space-x-2 mb-4 md:mb-0">
                  <button 
                    className={`px-4 py-2 rounded-md ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => setActiveTab('pending')}
                  >
                    En attente ({stats.pending})
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md ${activeTab === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => setActiveTab('accepted')}
                  >
                    Acceptées ({stats.accepted})
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md ${activeTab === 'refused' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => setActiveTab('refused')}
                  >
                    Refusées ({stats.refused})
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md ${activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => setActiveTab('all')}
                  >
                    Toutes ({stats.total})
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  {/* Filtre par période */}
                  <div className="relative" ref={periodRef}>
                    <button 
                      className="flex items-center px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200"
                      onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                    >
                      <FiCalendar className="mr-2" />
                      <span>
                        {selectedPeriod === 'all' && 'Toutes les périodes'}
                        {selectedPeriod === 'today' && "Aujourd'hui"}
                        {selectedPeriod === 'yesterday' && 'Hier'}
                        {selectedPeriod === 'week' && '7 derniers jours'}
                        {selectedPeriod === 'month' && '30 derniers jours'}
                      </span>
                      {showPeriodDropdown ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
                    </button>
                    
                    {showPeriodDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button 
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => { setSelectedPeriod('all'); setShowPeriodDropdown(false); }}
                          >
                            Toutes les périodes
                          </button>
                          <button 
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => { setSelectedPeriod('today'); setShowPeriodDropdown(false); }}
                          >
                            Aujourd'hui
                          </button>
                          <button 
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => { setSelectedPeriod('yesterday'); setShowPeriodDropdown(false); }}
                          >
                            Hier
                          </button>
                          <button 
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => { setSelectedPeriod('week'); setShowPeriodDropdown(false); }}
                          >
                            7 derniers jours
                          </button>
                          <button 
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => { setSelectedPeriod('month'); setShowPeriodDropdown(false); }}
                          >
                            30 derniers jours
                          </button>
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button 
                              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                              onClick={resetPeriod}
                            >
                              Réinitialiser
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Filtres avancés */}
                  <div className="relative" ref={filtersRef}>
                    <button 
                      className="flex items-center px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200"
                      onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                    >
                      <FiFilter className="mr-2" />
                      <span>Filtres</span>
                      {showFiltersDropdown ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
                    </button>
                    
                    {showFiltersDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10">
                        <div className="p-4">
                          <h3 className="text-lg font-medium mb-3">Filtres avancés</h3>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                placeholder="Min"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                              />
                              <input
                                type="number"
                                placeholder="Max"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={hasManyItems}
                                onChange={(e) => setHasManyItems(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Plusieurs articles</span>
                            </label>
                          </div>
                          
                          <div className="flex justify-end">
                            <button 
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                              onClick={resetFilters}
                            >
                              Réinitialiser
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Recherche */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 pl-10 bg-gray-100 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tableau des commandes */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement des commandes...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Aucune commande trouvée.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">{order.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.date}</div>
                          <div className="text-xs text-gray-500">{order.relativeTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.customer}</div>
                          <div className="text-xs text-gray-500">{order.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.amount.toFixed(2)} €</div>
                          <div className="text-xs text-gray-500">{order.items.length} article(s)</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : order.status === 'accepted' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {getStatusLabel(order.status)}
                          </span>
                          {order.status === 'refused' && order.reason && (
                            <div className="text-xs text-gray-500 mt-1">
                              Motif: {getRefusalReasonLabel(order.reason)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.status === 'pending' ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAccept(order)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => handleRefuse(order)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                              >
                                Refuser
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetailsModal(true);
                              }}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            >
                              Détails
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Affichage de <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> à{' '}
                      <span className="font-medium">{Math.min(currentPage * pageSize, totalOrders)}</span> sur{' '}
                      <span className="font-medium">{totalOrders}</span> résultats
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Précédent</span>
                        <FiChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Afficher les numéros de page */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = i + 1;
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Suivant</span>
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      
      {/* Modal pour accepter ou refuser une commande */}
      {showModal && selectedOrder && (
        <Modal
          isOpen={showModal}
          title={modalType === 'accept' ? 'Accepter la commande' : 'Refuser la commande'}
          onClose={() => setShowModal(false)}
        >
          {modalType === 'accept' ? (
            <div>
              <p className="mb-4">Vous êtes sur le point d'accepter la commande <span className="font-semibold">{selectedOrder.id}</span>.</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de livraison</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={acceptMode === 'delivery'}
                      onChange={() => setAcceptMode('delivery')}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Livraison à domicile</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={acceptMode === 'phygital'}
                      onChange={() => setAcceptMode('phygital')}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Retrait en magasin</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message au client (optionnel)</label>
                <textarea
                  value={sellerMessage}
                  onChange={(e) => setSellerMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Informations complémentaires pour le client..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmAction}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Confirmer
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4">Vous êtes sur le point de refuser la commande <span className="font-semibold">{selectedOrder.id}</span>.</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif du refus</label>
                <select
                  value={refusalReason}
                  onChange={(e) => setRefusalReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="rupture_stock">Rupture de stock</option>
                  <option value="adresse_incorrecte">Adresse de livraison incorrecte</option>
                  <option value="livraison_non_disponible">Livraison non disponible dans cette zone</option>
                  <option value="retrait_non_disponible">Retrait en magasin non disponible</option>
                  <option value="autre">Autre raison</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmAction}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
