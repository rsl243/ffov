"use client";

import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiShoppingCart, FiUsers, FiTag, FiSearch, FiFilter, FiCalendar, FiEye, FiShoppingBag, FiArrowUp, FiArrowDown, FiMail, FiCheckCircle, FiPlus, FiUserPlus, FiRefreshCw, FiStar, FiClock, FiAlertCircle, FiX, FiDownload, FiFileText } from 'react-icons/fi';
import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { 
  Product, 
  AbandonedCart, 
  Promotion, 
  CustomerAnalytics, 
  getAllMarketingData, 
  getPopularProducts, 
  getAbandonedCarts, 
  createPromotion, 
  markCartAsEmailed,
  getPromotions,
  getCustomerAnalytics 
} from '@/lib/marketingService';
import Notification from '@/components/Notification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MarketingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'carts' | 'customers' | 'promotions'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [promoData, setPromoData] = useState({
    code: '',
    reduction: 10,
    dateExpiration: '',
    message: '',
  });
  const [notification, setNotification] = useState({ show: false, message: '' });
  
  // État pour les données marketing
  const [marketingData, setMarketingData] = useState<{
    popularProducts: Product[];
    abandonedCarts: AbandonedCart[];
    promotions: Promotion[];
    customerAnalytics: CustomerAnalytics;
  }>({
    popularProducts: [],
    abandonedCarts: [],
    promotions: [],
    customerAnalytics: {
      totalCustomers: 0,
      newCustomersThisMonth: 0,
      repeatPurchaseRate: 0,
      averageOrderValue: 0,
      topSources: [],
      topCities: [],
      demographicData: {
        gender: [],
        ageRanges: []
      }
    }
  });
  
  // État pour le chargement
  const [loading, setLoading] = useState({
    products: true,
    carts: true,
    promotions: true,
    analytics: true,
    all: true
  });
  
  // Ajout de l'état pour les filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: {
      start: '',
      end: ''
    },
    minViews: 0,
    minConversions: 0,
    minRevenue: 0,
    sortBy: 'views', // 'views', 'conversions', 'conversionRate', 'revenue'
    sortOrder: 'desc' // 'asc', 'desc'
  });

  // État pour le modal d'export
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');

  // Formatage des nombres pour l'affichage
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num);
  };

  const formatPercent = (num: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(num/100);
  };
  // Correction: Importer depuis marketingService, pas financeService
  useEffect(() => {
    if (!user) return;
    
    // Récupérer toutes les données marketing au chargement
    const fetchAllMarketingData = async () => {
      setLoading(prev => ({ ...prev, all: true }));
      try {
        const data = await getAllMarketingData();
        setMarketingData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des données marketing:", error);
      } finally {
        setLoading(prev => ({ ...prev, all: false }));
      }
    };
    
    fetchAllMarketingData();
  }, [user]);
  
  // Charger les données spécifiques lors du changement d'onglet
  useEffect(() => {
    if (!user) return;
    
    const fetchTabData = async () => {
      switch (activeTab) {
        case 'products':
          setLoading(prev => ({ ...prev, products: true }));
          try {
            const products = await getPopularProducts(
              filters.dateRange.start && filters.dateRange.end
                ? { start: filters.dateRange.start, end: filters.dateRange.end }
                : undefined,
              filters.sortBy,
              filters.sortOrder as 'asc' | 'desc'
            );
            setMarketingData(prev => ({ ...prev, popularProducts: products }));
          } catch (error) {
            console.error("Erreur lors du chargement des produits populaires:", error);
          } finally {
            setLoading(prev => ({ ...prev, products: false }));
          }
          break;
          
        case 'carts':
          setLoading(prev => ({ ...prev, carts: true }));
          try {
            const carts = await getAbandonedCarts();
            setMarketingData(prev => ({ ...prev, abandonedCarts: carts }));
          } catch (error) {
            console.error("Erreur lors du chargement des paniers abandonnés:", error);
          } finally {
            setLoading(prev => ({ ...prev, carts: false }));
          }
          break;
          
        case 'promotions':
          setLoading(prev => ({ ...prev, promotions: true }));
          try {
            const promos = await getPromotions();
            setMarketingData(prev => ({ ...prev, promotions: promos }));
          } catch (error) {
            console.error("Erreur lors du chargement des promotions:", error);
          } finally {
            setLoading(prev => ({ ...prev, promotions: false }));
          }
          break;
          
        case 'customers':
          setLoading(prev => ({ ...prev, analytics: true }));
          try {
            const analytics = await getCustomerAnalytics();
            setMarketingData(prev => ({ ...prev, customerAnalytics: analytics }));
          } catch (error) {
            console.error("Erreur lors du chargement des analytics clients:", error);
          } finally {
            setLoading(prev => ({ ...prev, analytics: false }));
          }
          break;
      }
    };
    
    fetchTabData();
  }, [user, activeTab, filters]);

  // Appliquer les filtres aux données
  const applyFilters = (data: any[]) => {
    return data.filter(item => {
      // Filtrer par date si une plage de dates est définie
      if (filters.dateRange.start && filters.dateRange.end && 'date' in item) {
        const itemDate = new Date(item.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (itemDate < startDate || itemDate > endDate) return false;
      }

      // Filtres spécifiques selon le type d'élément
      if ('views' in item) {
        // Produits
        if (item.views < filters.minViews) return false;
        if (item.conversions < filters.minConversions) return false;
        if (item.revenue < filters.minRevenue) return false;
      }

      // Filtrer par terme de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if ('name' in item && item.name.toLowerCase().includes(searchLower)) return true;
        if ('customer' in item && item.customer.name.toLowerCase().includes(searchLower)) return true;
        return false;
      }

      return true;
    });
  };

  // Filtrer les données selon le tab actif et les filtres
  const filteredProducts = applyFilters(marketingData.popularProducts);
  const filteredCarts = applyFilters(marketingData.abandonedCarts);
  const filteredPromotions = applyFilters(marketingData.promotions);

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      dateRange: {
        start: '',
        end: ''
      },
      minViews: 0,
      minConversions: 0,
      minRevenue: 0,
      sortBy: 'views',
      sortOrder: 'desc'
    });
    
    // Recharger les données avec les filtres réinitialisés
    if (activeTab === 'products') {
      getPopularProducts().then(products => {
        setMarketingData(prev => ({ ...prev, popularProducts: products }));
      });
    }
  };

  // Gérer l'ouverture de la modale de promo
  const handleOpenPromo = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    
    // Générer un code promo unique
    const uniqueCode = `RECUP${cart.id.substring(0, 4)}${Math.floor(Math.random() * 1000)}`;
    
    // Définir une date d'expiration par défaut (30 jours à partir d'aujourd'hui)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const formattedDate = expirationDate.toISOString().split('T')[0];
    
    setPromoData({
      code: uniqueCode,
      reduction: 10,
      dateExpiration: formattedDate,
      message: `Bonjour ${cart.customer.name},\n\nNous sommes heureux de vous offrir un code de réduction de 10% sur votre prochaine commande.\nUtilisez le code ${uniqueCode} avant le ${new Date(formattedDate).toLocaleDateString('fr-FR')}.\n\nCordialement,\nL'équipe Faet`
    });
    setShowPromoModal(true);
  };
  
  // Gérer l'envoi de la promo
  const handleSendPromo = async () => {
    if (!selectedCart) return;
    
    try {
      // Créer la promotion dans Supabase
      const promotion = await createPromotion(
        promoData.code,
        `Code de récupération pour ${selectedCart.customer.name}`,
        promoData.reduction,
        'percentage',
        promoData.dateExpiration
      );
      
      if (promotion) {
        // Marquer le panier comme ayant reçu un email
        await markCartAsEmailed(selectedCart.id);
        
        // Mettre à jour la liste des paniers abandonnés
        const updatedCarts = await getAbandonedCarts();
        setMarketingData(prev => ({ ...prev, abandonedCarts: updatedCarts }));
        
        // Fermer la modale après envoi
        setShowPromoModal(false);
        
        // Afficher la notification de succès
        setNotification({
          show: true,
          message: `Offre promotionnelle envoyée à ${selectedCart.customer.name}`
        });
        
        // Fermer la notification après quelques secondes
        setTimeout(() => {
          setNotification({ show: false, message: '' });
        }, 5000);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la promotion:", error);
      setNotification({
        show: true,
        message: `Erreur: Impossible d'envoyer l'offre promotionnelle`
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 5000);
    }
  };
  
  // Gérer l'exportation des données
  const handleExportData = () => {
    // Simuler l'exportation (dans une application réelle, cela générerait un fichier)
    console.log(`Exporting data in ${exportFormat} format...`);
    
    // Fermer la modale
    setShowExportModal(false);
    
    // Afficher la notification
    setNotification({
      show: true,
      message: `Données exportées au format ${exportFormat.toUpperCase()}`
    });
    
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 5000);
  };
  // Rendu pour les produits populaires
  const renderPopularProducts = () => {
    return (
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Produits populaires</h2>
            <p className="text-gray-500 mt-1">Suivez les performances de vos produits</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un produit..."
                className="pl-10 w-full md:w-60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <FiFilter className="mr-2" />
              Filtres
            </Button>
            
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <FiDownload className="mr-2" />
              Exporter
            </Button>
          </div>
        </div>
        
        {/* Filtres étendus */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <Input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <Input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vues minimum</label>
                  <Input
                    type="number"
                    min="0"
                    value={filters.minViews}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      minViews: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conversions minimum</label>
                  <Input
                    type="number"
                    min="0"
                    value={filters.minConversions}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      minConversions: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 mr-2">Trier par:</label>
                  <select
                    className="bg-background px-3 py-2 border border-input rounded-md text-sm"
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  >
                    <option value="views">Vues</option>
                    <option value="conversions">Conversions</option>
                    <option value="conversionRate">Taux de conversion</option>
                    <option value="revenue">Chiffre d'affaires</option>
                  </select>
                  <select
                    className="ml-2 bg-background px-3 py-2 border border-input rounded-md text-sm"
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                  >
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
                  </select>
                </div>
                <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Liste des produits */}
        {loading.products ? (
          <div className="grid grid-cols-1 gap-4">
            {Array(5).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="h-16 w-16 bg-gray-200 rounded-md mr-4"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10">
            <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun produit trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez de modifier vos filtres ou d'ajouter de nouveaux produits.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-32 h-32 md:h-full">
                      <Image
                        src={product.imageUrl || '/robot-hand.webp'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 8rem"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="p-4 flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Vues</p>
                          <p className="text-lg font-medium flex items-center">
                            <FiEye className="mr-1 text-blue-500" />
                            {formatNumber(product.views)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Conversions</p>
                          <p className="text-lg font-medium flex items-center">
                            <FiShoppingCart className="mr-1 text-green-500" />
                            {formatNumber(product.conversions)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Taux de conversion</p>
                          <p className="text-lg font-medium flex items-center">
                            {product.conversionRate >= 3 ? (
                              <FiArrowUp className="mr-1 text-green-500" />
                            ) : (
                              <FiArrowDown className="mr-1 text-red-500" />
                            )}
                            {formatPercent(product.conversionRate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                          <p className="text-lg font-medium">
                            {formatCurrency(product.revenue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };
  // Rendu pour les paniers abandonnés
  const renderAbandonedCarts = () => {
    return (
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Paniers abandonnés</h2>
            <p className="text-gray-500 mt-1">Récupérez vos ventes perdues</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un client..."
                className="pl-10 w-full md:w-60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <FiDownload className="mr-2" />
              Exporter
            </Button>
          </div>
        </div>
        
        {/* Liste des paniers abandonnés */}
        {loading.carts ? (
          <div className="grid grid-cols-1 gap-4">
            {Array(3).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="space-y-2">
                        {Array(2).fill(0).map((_, i) => (
                          <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
                        ))}
                      </div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCarts.length === 0 ? (
          <div className="text-center py-10">
            <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun panier abandonné</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tous vos clients ont complété leurs achats, félicitations!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCarts.map((cart) => (
              <Card key={cart.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-medium">{cart.customer.name}</h3>
                        <Badge className="ml-2" variant="outline">
                          {cart.emailSent ? "Email envoyé" : "Non récupéré"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{cart.customer.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        <FiClock className="inline mr-1" />
                        Abandonné depuis: {cart.abandonedSince}
                      </p>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Produits dans le panier:</h4>
                        <ul className="space-y-1">
                          {cart.items.map((item, index) => (
                            <li key={index} className="text-sm">
                              {item.quantity}x {item.name} - {formatCurrency(item.price * item.quantity)}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-base font-medium">
                          Total: {formatCurrency(cart.totalValue)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 md:ml-4 flex md:flex-col justify-end">
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => handleOpenPromo(cart)}
                        disabled={cart.emailSent}
                      >
                        <FiMail className="mr-2" />
                        {cart.emailSent ? "Offre envoyée" : "Envoyer une offre"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Rendu pour la modale de promotion
  const renderPromoModal = () => {
    if (!showPromoModal || !selectedCart) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Envoyer une offre promotionnelle</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowPromoModal(false)}>
                <FiX />
              </Button>
            </div>
            <CardDescription>
              Envoyer une promotion à {selectedCart.customer.name} pour récupérer le panier abandonné
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code promo</label>
              <Input
                value={promoData.code}
                onChange={(e) => setPromoData(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Réduction (%)</label>
              <Input
                type="number"
                min="5"
                max="50"
                value={promoData.reduction}
                onChange={(e) => setPromoData(prev => ({ ...prev, reduction: parseInt(e.target.value) || 10 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
              <Input
                type="date"
                value={promoData.dateExpiration}
                onChange={(e) => setPromoData(prev => ({ ...prev, dateExpiration: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full min-h-[150px] p-2 border border-gray-300 rounded-md"
                value={promoData.message}
                onChange={(e) => setPromoData(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowPromoModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendPromo}>
              <FiMail className="mr-2" />
              Envoyer l'offre
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  // Rendu pour les promotions
  const renderPromotions = () => {
    return (
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Promotions</h2>
            <p className="text-gray-500 mt-1">Gérez vos codes promotionnels</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une promotion..."
                className="pl-10 w-full md:w-60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button variant="default">
              <FiPlus className="mr-2" />
              Nouvelle promotion
            </Button>
            
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <FiDownload className="mr-2" />
              Exporter
            </Button>
          </div>
        </div>
        
        {/* Liste des promotions */}
        {loading.promotions ? (
          <div className="grid grid-cols-1 gap-4">
            {Array(4).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="text-center py-10">
            <FiTag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune promotion trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              Créez une nouvelle promotion pour attirer vos clients.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPromotions.map((promotion) => (
              <Card key={promotion.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-medium">{promotion.name}</h3>
                        <Badge className="ml-2" variant={
                          promotion.status === 'active' ? 'default' : 
                          promotion.status === 'expired' ? 'secondary' : 
                          'outline'
                        }>
                          {promotion.status === 'active' ? 'Active' : 
                           promotion.status === 'expired' ? 'Expirée' : 
                           'Programmée'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{promotion.description}</p>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Remise</p>
                          <p className="text-sm font-medium">
                            {promotion.type === 'percentage' 
                              ? `${promotion.discount}%` 
                              : promotion.type === 'fixed' 
                                ? formatCurrency(promotion.discount) 
                                : 'Livraison gratuite'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Utilisation</p>
                          <p className="text-sm font-medium">{promotion.uses} utilisations</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Valide jusqu'au</p>
                          <p className="text-sm font-medium">{promotion.validUntil}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 md:ml-4 flex md:flex-col justify-end">
                      <Button
                        variant="outline"
                        className="mr-2 md:mr-0 md:mb-2"
                        disabled={promotion.status === 'expired'}
                      >
                        <FiEdit className="mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant={promotion.status === 'active' ? 'destructive' : 'default'}
                        disabled={promotion.status === 'expired'}
                      >
                        {promotion.status === 'active' ? (
                          <>
                            <FiX className="mr-2" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <FiCheckCircle className="mr-2" />
                            Activer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };
  // Rendu pour l'analyse des clients
  const renderCustomerAnalytics = () => {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Analyse des clients</h2>
          <p className="text-gray-500 mt-1">Comprendre votre clientèle pour mieux l'atteindre</p>
        </div>
        
        {loading.analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array(4).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-40 bg-gray-200 rounded-md"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Stats générales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <FiUsers className="text-blue-500 text-2xl mb-2" />
                    <h3 className="text-sm font-medium text-gray-500">Total clients</h3>
                    <p className="text-2xl font-bold">{formatNumber(marketingData.customerAnalytics.totalCustomers)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <FiUserPlus className="text-green-500 text-2xl mb-2" />
                    <h3 className="text-sm font-medium text-gray-500">Nouveaux ce mois</h3>
                    <p className="text-2xl font-bold">{formatNumber(marketingData.customerAnalytics.newCustomersThisMonth)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <FiRefreshCw className="text-yellow-500 text-2xl mb-2" />
                    <h3 className="text-sm font-medium text-gray-500">Taux de fidélité</h3>
                    <p className="text-2xl font-bold">{formatPercent(marketingData.customerAnalytics.repeatPurchaseRate)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <FiShoppingBag className="text-purple-500 text-2xl mb-2" />
                    <h3 className="text-sm font-medium text-gray-500">Panier moyen</h3>
                    <p className="text-2xl font-bold">{formatCurrency(marketingData.customerAnalytics.averageOrderValue)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Graphiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sources d'acquisition */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sources d'acquisition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-y-auto">
                    {marketingData.customerAnalytics.topSources.map((source, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{source.name}</span>
                          <span className="font-medium">{source.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${source.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Répartition géographique */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Répartition géographique</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-y-auto">
                    {marketingData.customerAnalytics.topCities.map((city, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{city.name}</span>
                          <span className="font-medium">{city.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${city.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Répartition par genre */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Répartition par genre</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-around p-4">
                    {marketingData.customerAnalytics.demographicData.gender.map((item, index) => {
                      const total = marketingData.customerAnalytics.demographicData.gender.reduce(
                        (sum, curr) => sum + curr.value, 0
                      );
                      const percentage = total ? (item.value / total) * 100 : 0;
                      
                      return (
                        <div key={index} className="text-center">
                          <div 
                            className={`h-32 w-32 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                              item.name === 'Hommes' ? 'bg-blue-500' : 'bg-pink-500'
                            }`}
                          >
                            {Math.round(percentage)}%
                          </div>
                          <p className="mt-2 font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{formatNumber(item.value)} clients</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Répartition par âge */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Répartition par âge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-y-auto">
                    {marketingData.customerAnalytics.demographicData.ageRanges.map((range, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{range.range}</span>
                          <span className="font-medium">{range.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-purple-600 h-2.5 rounded-full" 
                            style={{ width: `${range.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Rendu pour la modale d'exportation
  const renderExportModal = () => {
    if (!showExportModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Exporter les données</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowExportModal(false)}>
                <FiX />
              </Button>
            </div>
            <CardDescription>
              Choisissez le format d'exportation souhaité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="h-4 w-4 text-blue-600"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                />
                <span className="ml-2 flex items-center">
                  <FiFileText className="mr-2" />
                  CSV
                </span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="h-4 w-4 text-blue-600"
                  checked={exportFormat === 'excel'}
                  onChange={() => setExportFormat('excel')}
                />
                <span className="ml-2 flex items-center">
                  <FiFileText className="mr-2" />
                  Excel
                </span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="h-4 w-4 text-blue-600"
                  checked={exportFormat === 'pdf'}
                  onChange={() => setExportFormat('pdf')}
                />
                <span className="ml-2 flex items-center">
                  <FiFileText className="mr-2" />
                  PDF
                </span>
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleExportData}>
              <FiDownload className="mr-2" />
              Exporter
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  return (
    <>
      {/* En-tête de la page */}
      <PageHeader title="Marketing" />
      
      {/* Contenu principal */}
      <Tabs defaultValue="products" value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="w-full justify-start border-b bg-transparent p-0">
          <TabsTrigger
            value="products"
            className="px-6 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none"
          >
            Produits
          </TabsTrigger>
          <TabsTrigger
            value="carts"
            className="px-6 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none"
          >
            Paniers abandonnés
          </TabsTrigger>
          <TabsTrigger
            value="promotions"
            className="px-6 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none"
          >
            Promotions
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="px-6 py-3 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none"
          >
            Clients
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-0 p-0">
          {renderPopularProducts()}
        </TabsContent>
        
        <TabsContent value="carts" className="mt-0 p-0">
          {renderAbandonedCarts()}
        </TabsContent>
        
        <TabsContent value="promotions" className="mt-0 p-0">
          {renderPromotions()}
        </TabsContent>
        
        <TabsContent value="customers" className="mt-0 p-0">
          {renderCustomerAnalytics()}
        </TabsContent>
      </Tabs>
      
      {/* Modales */}
      {renderPromoModal()}
      {renderExportModal()}
      
      {/* Notification */}
      {notification.show && (
        <Notification 
          message={notification.message} 
          onClose={() => setNotification({ show: false, message: '' })} 
        />
      )}
    </>
  );
}
