"use client";

import React, { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiCreditCard, FiShoppingBag, FiPercent, FiDollarSign, FiCheckCircle, FiFilter, FiCalendar, FiSearch, FiDownload } from 'react-icons/fi';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { FinancialStats, Transaction, SubscriptionPlan, UserSubscription, getFinancialStats, getTransactions, getSubscriptionPlans, getUserSubscription, updateUserSubscription, cancelUserSubscription, getUpcomingPayments } from '@/lib/financeService';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FinancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resume');
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    revenue: { total: 0, previousPeriod: 0, changePercent: 0 },
    sales: { total: 0, previousPeriod: 0, changePercent: 0 },
    averageOrderValue: { current: 0, previousPeriod: 0, changePercent: 0 },
    refunds: { total: 0, previousPeriod: 0, changePercent: 0 }
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    stats: true,
    transactions: true,
    plans: true,
    subscription: true
  });
  const [statsPeriod, setStatsPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [transactionFilters, setTransactionFilters] = useState({
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Récupérer les statistiques financières au chargement
  useEffect(() => {
    const loadFinancialStats = async () => {
      if (!user) return;
      
      setLoading(prev => ({ ...prev, stats: true }));
      try {
        const stats = await getFinancialStats(statsPeriod);
        setFinancialStats(stats);
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };
    
    loadFinancialStats();
  }, [user, statsPeriod]);
  
  // Récupérer les transactions au chargement
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user) return;
      
      setLoading(prev => ({ ...prev, transactions: true }));
      try {
        const response = await getTransactions(
          currentPage,
          10,
          transactionFilters.type as any,
          transactionFilters.status as any,
          transactionFilters.startDate,
          transactionFilters.endDate,
          transactionFilters.searchTerm
        );
        setTransactions(response.transactions);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error("Erreur lors du chargement des transactions:", error);
      } finally {
        setLoading(prev => ({ ...prev, transactions: false }));
      }
    };
    
    loadTransactions();
  }, [user, currentPage, transactionFilters]);
  
  // Récupérer les plans d'abonnement au chargement
  useEffect(() => {
    const loadSubscriptionPlans = async () => {
      if (!user) return;
      
      setLoading(prev => ({ ...prev, plans: true }));
      try {
        const plans = await getSubscriptionPlans();
        setSubscriptionPlans(plans);
      } catch (error) {
        console.error("Erreur lors du chargement des plans d'abonnement:", error);
      } finally {
        setLoading(prev => ({ ...prev, plans: false }));
      }
    };
    
    loadSubscriptionPlans();
  }, [user]);
  
  // Récupérer l'abonnement de l'utilisateur au chargement
  useEffect(() => {
    const loadUserSubscription = async () => {
      if (!user) return;
      
      setLoading(prev => ({ ...prev, subscription: true }));
      try {
        const subscription = await getUserSubscription();
        setUserSubscription(subscription);
        if (subscription) {
          setCurrentPlan(subscription.planId);
          
          // Récupérer les paiements à venir
          const payments = await getUpcomingPayments();
          setUpcomingPayments(payments);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'abonnement:", error);
      } finally {
        setLoading(prev => ({ ...prev, subscription: false }));
      }
    };
    
    loadUserSubscription();
  }, [user]);
  
  // Gérer le changement de période des statistiques
  const handlePeriodChange = (period: 'month' | 'quarter' | 'year') => {
    setStatsPeriod(period);
  };
  
  // Gérer la pagination des transactions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Gérer le changement de filtre des transactions
  const handleFilterChange = (filter: string, value: string) => {
    setTransactionFilters(prev => ({ ...prev, [filter]: value }));
    setCurrentPage(1); // Réinitialiser la pagination
  };
  
  // Gérer le changement de plan d'abonnement
  const handlePlanChange = async (planId: string) => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, subscription: true }));
    try {
      const success = await updateUserSubscription(planId);
      if (success) {
        setCurrentPlan(planId);
        // Recharger l'abonnement
        const subscription = await getUserSubscription();
        setUserSubscription(subscription);
        // Recharger les paiements à venir
        const payments = await getUpcomingPayments();
        setUpcomingPayments(payments);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'abonnement:", error);
    } finally {
      setLoading(prev => ({ ...prev, subscription: false }));
    }
  };
  
  // Gérer l'annulation de l'abonnement
  const handleCancelSubscription = async () => {
    if (!user || !userSubscription) return;
    
    setLoading(prev => ({ ...prev, subscription: true }));
    try {
      const success = await cancelUserSubscription();
      if (success) {
        // Recharger l'abonnement
        const subscription = await getUserSubscription();
        setUserSubscription(subscription);
        setShowCancelConfirm(false);
        // Réinitialiser les paiements à venir
        setUpcomingPayments([]);
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation de l'abonnement:", error);
    } finally {
      setLoading(prev => ({ ...prev, subscription: false }));
    }
  };
  // Rendu du résumé financier
  const renderFinancialSummary = () => {
    return (
      <div className="p-6">
        {/* Période de statistiques */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Résumé financier</h2>
            <div className="flex space-x-2">
              <Button 
                variant={statsPeriod === 'month' ? "default" : "outline"}
                onClick={() => handlePeriodChange('month')}
              >
                Ce mois
              </Button>
              <Button 
                variant={statsPeriod === 'quarter' ? "default" : "outline"}
                onClick={() => handlePeriodChange('quarter')}
              >
                Ce trimestre
              </Button>
              <Button 
                variant={statsPeriod === 'year' ? "default" : "outline"}
                onClick={() => handlePeriodChange('year')}
              >
                Cette année
              </Button>
            </div>
          </div>
        </div>
        
        {/* Statistiques financières */}
        {loading.stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financialStats.revenue.total)}</div>
                <p className={`text-xs flex items-center ${financialStats.revenue.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialStats.revenue.changePercent >= 0 ? (
                    <FiArrowUp className="mr-1" />
                  ) : (
                    <FiArrowDown className="mr-1" />
                  )}
                  {formatPercent(Math.abs(financialStats.revenue.changePercent))} par rapport à {
                    statsPeriod === 'month' ? 'la période précédente' :
                    statsPeriod === 'quarter' ? 'au trimestre précédent' :
                    'l\'année précédente'
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialStats.sales.total}</div>
                <p className={`text-xs flex items-center ${financialStats.sales.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialStats.sales.changePercent >= 0 ? (
                    <FiArrowUp className="mr-1" />
                  ) : (
                    <FiArrowDown className="mr-1" />
                  )}
                  {formatPercent(Math.abs(financialStats.sales.changePercent))} par rapport à {
                    statsPeriod === 'month' ? 'la période précédente' :
                    statsPeriod === 'quarter' ? 'au trimestre précédent' :
                    'l\'année précédente'
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financialStats.averageOrderValue.current)}</div>
                <p className={`text-xs flex items-center ${financialStats.averageOrderValue.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialStats.averageOrderValue.changePercent >= 0 ? (
                    <FiArrowUp className="mr-1" />
                  ) : (
                    <FiArrowDown className="mr-1" />
                  )}
                  {formatPercent(Math.abs(financialStats.averageOrderValue.changePercent))} par rapport à {
                    statsPeriod === 'month' ? 'la période précédente' :
                    statsPeriod === 'quarter' ? 'au trimestre précédent' :
                    'l\'année précédente'
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Remboursements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financialStats.refunds.total)}</div>
                <p className={`text-xs flex items-center ${financialStats.refunds.changePercent <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialStats.refunds.changePercent <= 0 ? (
                    <FiArrowDown className="mr-1" />
                  ) : (
                    <FiArrowUp className="mr-1" />
                  )}
                  {formatPercent(Math.abs(financialStats.refunds.changePercent))} par rapport à {
                    statsPeriod === 'month' ? 'la période précédente' :
                    statsPeriod === 'quarter' ? 'au trimestre précédent' :
                    'l\'année précédente'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Paiements à venir */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Paiements à venir</h2>
          {upcomingPayments.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">Aucun paiement à venir.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(payment.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    );
  };
  
  // Rendu des transactions
  const renderTransactions = () => {
    return (
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-semibold mb-4 md:mb-0">Transactions</h2>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 w-60"
                value={transactionFilters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>
            
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              value={transactionFilters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="payment">Paiements</option>
              <option value="refund">Remboursements</option>
              <option value="fee">Frais</option>
              <option value="payout">Versements</option>
            </select>
            
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              value={transactionFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Complétés</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoués</option>
            </select>
            
            <Button variant="outline">
              <FiDownload className="mr-2" />
              Exporter
            </Button>
          </div>
        </div>
        
        {/* Filtres de date */}
        <div className="mb-6 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="date"
                className="pl-10"
                value={transactionFilters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="date"
                className="pl-10"
                value={transactionFilters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Tableau des transactions */}
        <Card>
          {loading.transactions ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Aucune transaction trouvée.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(transaction.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.description}
                        {transaction.order && (
                          <span className="text-xs text-gray-500 block">
                            Commande #{transaction.order.id}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.customer?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          transaction.type === 'payment' ? 'default' :
                          transaction.type === 'refund' ? 'destructive' :
                          transaction.type === 'fee' ? 'secondary' :
                          'outline'
                        }>
                          {transaction.type === 'payment' ? 'Paiement' :
                           transaction.type === 'refund' ? 'Remboursement' :
                           transaction.type === 'fee' ? 'Frais' :
                           'Versement'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          transaction.type === 'payment' ? 'text-green-600' :
                          transaction.type === 'refund' ? 'text-red-600' :
                          transaction.type === 'fee' ? 'text-orange-600' :
                          'text-blue-600'
                        }>
                          {transaction.type === 'refund' || transaction.type === 'fee' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {transaction.status === 'completed' ? 'Complété' :
                           transaction.status === 'pending' ? 'En attente' :
                           'Échoué'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex justify-between border-t">
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <div className="text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </div>
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  };
  // Rendu des plans d'abonnement
  const renderSubscriptionPlans = () => {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Plans d'abonnement</h2>
          <p className="text-gray-500 mt-1">Choisissez le plan qui correspond le mieux à vos besoins.</p>
        </div>
        
        {loading.plans ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex">
                        <div className="h-4 w-4 bg-gray-200 rounded-full mr-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-4">
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.mostPopular ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.mostPopular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-xs">
                    Populaire
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                    <span className="text-gray-500 ml-2">/ {plan.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex">
                        <FiCheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-1" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={currentPlan === plan.id ? "outline" : "default"}
                    disabled={loading.subscription || (currentPlan === plan.id && userSubscription?.status === 'active')}
                    onClick={() => handlePlanChange(plan.id)}
                  >
                    {currentPlan === plan.id && userSubscription?.status === 'active' 
                      ? 'Plan actuel' 
                      : currentPlan === plan.id && userSubscription?.status === 'canceled'
                      ? 'Réactiver ce plan'
                      : 'Sélectionner ce plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Statut de l'abonnement */}
        {userSubscription && (
          <div className="mt-10">
            <Card>
              <CardHeader>
                <CardTitle>Votre abonnement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Statut</p>
                    <Badge variant={userSubscription.status === 'active' ? 'default' : 'destructive'}>
                      {userSubscription.status === 'active' ? 'Actif' : 'Annulé'}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">Prochain renouvellement</p>
                    <p className="font-medium">
                      {userSubscription.status === 'active' 
                        ? format(new Date(userSubscription.currentPeriodEnd), 'dd MMMM yyyy', { locale: fr }) 
                        : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    {userSubscription.status === 'active' && userSubscription.canCancel ? (
                      showCancelConfirm ? (
                        <div className="flex space-x-2">
                          <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                            Non
                          </Button>
                          <Button variant="destructive" onClick={handleCancelSubscription}>
                            Oui, annuler
                          </Button>
                        </div>
                      ) : (
                        <Button variant="destructive" onClick={() => setShowCancelConfirm(true)}>
                          Annuler l'abonnement
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
      {/* Top Navigation */}
      <PageHeader title="Finance" />
      
      {/* Tabs */}
      <Tabs defaultValue="resume" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b bg-transparent p-0">
          <TabsTrigger
            value="resume"
            className="px-6 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none"
          >
            Résumé financier
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="px-6 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none"
          >
            Transactions
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="px-6 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none"
          >
            Abonnement
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="resume" className="mt-0 p-0">
          {renderFinancialSummary()}
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-0 p-0">
          {renderTransactions()}
        </TabsContent>
        
        <TabsContent value="subscription" className="mt-0 p-0">
          {renderSubscriptionPlans()}
        </TabsContent>
      </Tabs>
    </>
  );
}
