"use client";

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { FiShoppingBag, FiTruck, FiEye, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';
import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useRouter } from 'next/navigation';
import { getDashboardData, getRecentOrders, refreshDashboardData, DashboardData, Order } from '@/lib/dashboardService';
import { getNotifications, getUnreadCount, markAllAsRead, Notification as AppNotification, createNotification } from '@/lib/notificationsService';
import SkeletonLoader from '@/components/dashboard/SkeletonLoader';

// Chargement paresseux des composants
const DateFilter = lazy(() => import('@/components/dashboard/DateFilter'));
const StatCard = lazy(() => import('@/components/dashboard/StatCard'));
const OrderStatus = lazy(() => import('@/components/dashboard/OrderStatus'));
const RecentOrders = lazy(() => import('@/components/dashboard/RecentOrders'));
const NotificationsDropdown = lazy(() => import('@/components/dashboard/NotificationsDropdown'));

// Note: Nous utilisons l'interface Notification importée depuis notificationsService.ts

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState('today');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Charger les données initiales du tableau de bord
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await getDashboardData();
        setDashboardData(data);
        setLoadingData(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données du tableau de bord:", error);
        setLoadingData(false);
      }
    };

    const loadRecentOrders = async () => {
      try {
        const result = await getRecentOrders();
        setRecentOrders(result.orders);
        setLoadingOrders(false);
      } catch (error) {
        console.error("Erreur lors du chargement des commandes récentes:", error);
        setLoadingOrders(false);
      }
    };

    const loadNotifications = async () => {
      try {
        const notifs = await getNotifications(10);
        setNotifications(notifs);
        const count = await getUnreadCount();
        setUnreadCount(count);
        setLoadingNotifications(false);
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
        setLoadingNotifications(false);
      }
    };

    if (!loading && user) {
      loadDashboardData();
      loadRecentOrders();
      loadNotifications();
    }
  }, [user, loading]);

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/connexion');
    }
  }, [user, loading, router]);

  // Fonction pour marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    }
  };

  // Fonction pour actualiser les données du tableau de bord
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const refreshedData = await refreshDashboardData();
      setDashboardData(refreshedData);
      
      // Ajouter une nouvelle notification
      const newNotification = await createNotification(
        "Données actualisées",
        "Le tableau de bord a été mis à jour avec succès",
        "system"
      );
      
      if (newNotification) {
        setNotifications([newNotification, ...notifications]);
        setUnreadCount(prev => prev + 1);
      }
      
      // Actualiser également les notifications
      const notifs = await getNotifications(10);
      setNotifications(notifs);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Erreur lors de l'actualisation des données:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fonction pour formater la date du jour
  const getTodayDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date().toLocaleDateString('fr-FR', options);
  };

  // Obtenir le libellé de la période sélectionnée
  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'today':
        return "aujourd'hui";
      case 'week':
        return "cette semaine";
      case 'month':
        return "ce mois";
      default:
        return "aujourd'hui";
    }
  };

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b flex items-center justify-between px-6 py-3">
        <h1 className="text-xl font-semibold">Tableau de bord</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              className="relative p-1 text-gray-400 hover:text-gray-500"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount}
                </span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            
            {/* Dropdown des notifications avec chargement paresseux */}
            <Suspense fallback={null}>
              {showNotifications && (
                <NotificationsDropdown 
                  notifications={notifications}
                  unreadCount={unreadCount}
                  showNotifications={showNotifications}
                  markAllAsRead={handleMarkAllAsRead}
                  onClose={() => setShowNotifications(false)}
                  isLoading={loadingNotifications}
                />
              )}
            </Suspense>
          </div>
          <UserProfile />
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {/* Date et filtres avec chargement paresseux */}
        <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded mb-6"></div>}>
          {loadingData ? (
            <div className="h-16 bg-gray-100 animate-pulse rounded mb-6"></div>
          ) : (
            <DateFilter 
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              lastSync={dashboardData?.lastSync || `Aujourd'hui à ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`}
              isRefreshing={isRefreshing}
              handleRefresh={handleRefresh}
            />
          )}
        </Suspense>
        
        {/* Cartes des chiffres clés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Suspense fallback={<SkeletonLoader type="card" />}>
            {loadingData ? (
              <SkeletonLoader type="card" />
            ) : (
              <StatCard
                title="Ventes du jour"
                value={dashboardData?.sales.today || 0}
                subValue={dashboardData?.sales.amount || '0,00 €'}
                comparison={dashboardData?.sales.comparison || '+0%'}
                icon={<FiShoppingBag className="h-6 w-6 text-white" />}
                iconBgColor="bg-blue-500"
                linkText="Voir les ventes"
                linkHref="/ventes"
              />
            )}
          </Suspense>
          
          <Suspense fallback={<SkeletonLoader type="card" />}>
            {loadingData ? (
              <SkeletonLoader type="card" />
            ) : (
              <StatCard
                title="Commandes en cours"
                value={(dashboardData?.orders.pending || 0) + (dashboardData?.orders.processing || 0)}
                subValue={`${dashboardData?.orders.pending || 0} en attente, ${dashboardData?.orders.processing || 0} en préparation`}
                icon={<FiTruck className="h-6 w-6 text-white" />}
                iconBgColor="bg-orange-500"
                linkText="Gérer les commandes"
                linkHref="/commandes"
              />
            )}
          </Suspense>
          
          <Suspense fallback={<SkeletonLoader type="card" />}>
            {loadingData ? (
              <SkeletonLoader type="card" />
            ) : (
              <StatCard
                title="Visiteurs aujourd'hui"
                value={dashboardData?.visitors.today || 0}
                comparison={dashboardData?.visitors.comparison || '+0%'}
                icon={<FiEye className="h-6 w-6 text-white" />}
                iconBgColor="bg-green-500"
                linkText="Voir les statistiques"
                linkHref="/statistiques"
              />
            )}
          </Suspense>
          
          <Suspense fallback={<SkeletonLoader type="card" />}>
            {loadingData ? (
              <SkeletonLoader type="card" />
            ) : (
              <StatCard
                title="Produits"
                value={dashboardData?.products || 0}
                subValue={`Site connecté: ${dashboardData?.connectedSite || 'Non configuré'}`}
                icon={<FiCalendar className="h-6 w-6 text-white" />}
                iconBgColor="bg-purple-500"
                linkText="Gérer les produits"
                linkHref="/produits"
              />
            )}
          </Suspense>
        </div>
        
        {/* État des commandes */}
        {loadingData ? (
          <SkeletonLoader type="status" />
        ) : (
          <Suspense fallback={<SkeletonLoader type="status" />}>
            <OrderStatus 
              pending={dashboardData?.orders.pending || 0}
              processing={dashboardData?.orders.processing || 0}
              shipped={dashboardData?.orders.shipped || 0}
              delivered={dashboardData?.orders.delivered || 0}
              returned={dashboardData?.orders.returned || 0}
            />
          </Suspense>
        )}
        
        {/* Commandes récentes */}
        {loadingOrders ? (
          <SkeletonLoader type="table" />
        ) : (
          <Suspense fallback={<SkeletonLoader type="table" />}>
            {recentOrders.length > 0 ? (
              <RecentOrders orders={recentOrders} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-500">Aucune commande récente à afficher.</p>
                <p className="mt-2 text-sm text-gray-400">Les nouvelles commandes apparaîtront ici.</p>
              </div>
            )}
          </Suspense>
        )}
      </main>
    </div>
  );
}
