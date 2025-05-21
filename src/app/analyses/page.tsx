'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar, FiDownload, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiUsers, FiShoppingBag, FiPackage, FiEye, FiInfo, FiDollarSign, FiBarChart2, FiActivity, FiUserPlus, FiX } from 'react-icons/fi';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
  ReferenceLine, Cell
} from 'recharts';
import { getSalesData, getDashboardData, PeriodData, DashboardData, DataPoint } from '@/lib/analyticsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExportButton from '@/components/ExportButton';

// Formatage compact des valeurs monétaires pour l'affichage
const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M €`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k €`;
  } else {
    return `${value} €`;
  }
};

// Formatage des nombres pour l'affichage
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(value);
};
// Composant pour les cartes de statistiques
interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}

// Composant StatCard qui affiche une statistique avec sa variation
const StatCard = ({ title, value, change, icon: Icon, trend }: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="bg-gray-100 p-2 rounded-full">
            <Icon className="text-gray-700" />
          </div>
          <div className={`flex items-center rounded-full px-2 py-1 text-xs ${
            trend === 'up' ? 'bg-green-100 text-green-800' : 
            trend === 'down' ? 'bg-red-100 text-red-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {trend === 'up' ? <FiTrendingUp className="mr-1" /> : 
             trend === 'down' ? <FiTrendingDown className="mr-1" /> : 
             null}
            {change}
          </div>
        </div>
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-gray-500 text-sm">{title}</p>
      </CardContent>
    </Card>
  );
};

// Types pour les composants de graphiques
interface ChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  previousPeriodData?: DataPoint[] | null;
  currency?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      name: string;
      value: number;
      previousValue: number;
    };
  }>;
  label?: string;
}

// Composant personnalisé pour l'infobulle du graphique
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const currentValue = payload[0].value;
    const previousValue = payload[0].payload.previousValue || 0;
    const change = previousValue !== 0 
      ? ((currentValue - previousValue) / previousValue) * 100 
      : currentValue > 0 ? 100 : 0;
    
    return (
      <div className="custom-tooltip bg-white p-3 shadow rounded border">
        <p className="label mb-2 font-medium">{label}</p>
        <p className="value">
          Valeur : <span className="font-bold">{formatCompactCurrency(currentValue)}</span>
        </p>
        {previousValue > 0 && (
          <p className="previous-value text-gray-600">
            Période précédente : {formatCompactCurrency(previousValue)}
          </p>
        )}
        {previousValue > 0 && (
          <p className={`change ${change >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
            {change >= 0 ? <FiTrendingUp className="inline mr-1" /> : <FiTrendingDown className="inline mr-1" />}
            {change.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }

  return null;
};

// Composant pour le graphique linéaire moderne
const ModernLineChart = ({ data, title, color = '#3b82f6', previousPeriodData = null, currency = false }: ChartProps) => {
  // Préparer les données pour le graphique en incluant les valeurs de la période précédente
  const chartData = data.map((item, index) => {
    return {
      name: item.label,
      value: item.value,
      previousValue: previousPeriodData && previousPeriodData[index] ? previousPeriodData[index].value : 0
    };
  });

  // Trouver les valeurs min et max pour l'axe Y
  const allValues = chartData.flatMap(item => [item.value, item.previousValue]);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues.filter(v => v > 0));
  
  // Utiliser un formatage adapté selon le type de données (monétaire ou nombre)
  const valueFormatter = currency 
    ? (value: number) => formatCompactCurrency(value)
    : (value: number) => formatNumber(value);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorGradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
                domain={[minValue > 0 ? minValue * 0.9 : 0, maxValue * 1.1]} 
                tickFormatter={valueFormatter}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Ligne pour la période précédente */}
              {previousPeriodData && previousPeriodData.length > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="previousValue" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5" 
                  dot={false} 
                  activeDot={false}
                  name="Période précédente"
                />
              )}
              
              {/* Zone colorée et ligne pour la période actuelle */}
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={3}
                fillOpacity={1} 
                fill={`url(#colorGradient-${title})`} 
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Période actuelle"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour le graphique à barres moderne
const ModernBarChart = ({ data, title, color = '#3b82f6', previousPeriodData = null, currency = false }: ChartProps) => {
  // Préparer les données pour le graphique
  const chartData = data.map((item, index) => {
    return {
      name: item.label,
      value: item.value,
      previousValue: previousPeriodData && previousPeriodData[index] ? previousPeriodData[index].value : 0
    };
  });

  // Trouver les valeurs min et max pour l'axe Y
  const allValues = chartData.flatMap(item => [item.value, item.previousValue]);
  const maxValue = Math.max(...allValues);
  
  // Utiliser un formatage adapté selon le type de données (monétaire ou nombre)
  const valueFormatter = currency 
    ? (value: number) => formatCompactCurrency(value)
    : (value: number) => formatNumber(value);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
                domain={[0, maxValue * 1.1]} 
                tickFormatter={valueFormatter}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Barres pour la période précédente si disponible */}
              {previousPeriodData && previousPeriodData.length > 0 && (
                <Bar 
                  dataKey="previousValue" 
                  fill="#94a3b8" 
                  radius={[4, 4, 0, 0]} 
                  name="Période précédente"
                  barSize={8}
                />
              )}
              
              {/* Barres pour la période actuelle */}
              <Bar 
                dataKey="value" 
                fill={color} 
                radius={[4, 4, 0, 0]} 
                name="Période actuelle"
                barSize={previousPeriodData ? 16 : 20}
              >
                {chartData.map((entry, index) => {
                  // Comparer avec la période précédente pour déterminer la couleur
                  const prev = entry.previousValue || 0;
                  const current = entry.value;
                  let fillColor = color;
                  
                  if (prev > 0) {
                    fillColor = current >= prev ? '#22c55e' : '#ef4444';
                  }
                  
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
// Tableau de bord de ventes quotidiennes
interface DashboardProps {
  data: DashboardData;
}

const DailySalesDashboard = ({ data }: DashboardProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Ventes du jour"
        value={formatCompactCurrency(data.totalSales)}
        change={data.salesChange}
        icon={FiDollarSign}
        trend={data.salesChange.includes('+') ? 'up' : data.salesChange === '0%' ? 'neutral' : 'down'}
      />
      
      <StatCard
        title="Visiteurs"
        value={formatNumber(data.visitors)}
        change={data.visitorsChange}
        icon={FiUsers}
        trend={data.visitorsChange.includes('+') ? 'up' : data.visitorsChange === '0%' ? 'neutral' : 'down'}
      />
      
      <StatCard
        title="Nouveaux clients"
        value={formatNumber(data.newCustomers)}
        change={data.customersChange}
        icon={FiUserPlus}
        trend={data.customersChange.includes('+') ? 'up' : data.customersChange === '0%' ? 'neutral' : 'down'}
      />
      
      <StatCard
        title="Taux de retour"
        value={data.returnRate}
        change={data.returnRateChange}
        icon={FiRefreshCw}
        trend={data.returnRateChange.includes('-') ? 'up' : data.returnRateChange === '0%' ? 'neutral' : 'down'}
      />
    </div>
  );
};

// Composant pour le modal de sélection de période personnalisée
interface DateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
}

const DateRangePicker = ({ isOpen, onClose, onApply }: DateRangePickerProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Définir les dates par défaut
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen]);

  const handleApply = () => {
    // Validation des dates
    if (!startDate || !endDate) {
      setError('Les deux dates sont requises');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('La date de début doit être antérieure à la date de fin');
      return;
    }

    onApply(startDate, endDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sélectionner une période</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <FiX />
            </Button>
          </div>
          <CardDescription>
            Choisissez une plage de dates pour afficher les données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <div className="flex space-x-2">
            <Button 
              className="flex-1" 
              variant="outline" 
              onClick={() => {
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 7);
                setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
              }}
            >
              7 derniers jours
            </Button>
            <Button 
              className="flex-1" 
              variant="outline" 
              onClick={() => {
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
              }}
            >
              30 derniers jours
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleApply}>
            Appliquer
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Notre composant ExportButton est importé depuis @/components/ExportButton

export default function AnalysesPage() {
  const { user } = useAuth();
  
  // État pour les données à exporter
  const [exportData, setExportData] = useState<any[]>([]);
  const [periodData, setPeriodData] = useState<PeriodData>({ sales: [], visitors: [], returns: [] });
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalSales: 0,
    salesChange: '0%',
    visitors: 0,
    visitorsChange: '0%',
    newCustomers: 0,
    customersChange: '0%',
    returnRate: '0%',
    returnRateChange: '0%'
  });
  
  // États pour les contrôles d'interface
  const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Pour forcer le rechargement des données
  
  // Récupérer les données du tableau de bord au chargement
  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données du tableau de bord:', error);
      }
    };
    
    fetchDashboardData();
  }, [user, refreshKey]);
  
  // Récupérer les données pour la période sélectionnée
  useEffect(() => {
    if (!user) return;
    
    const fetchPeriodData = async () => {
      setIsLoading(true);
      try {
        let data;
        
        if (activePeriod === 'custom' && customDateRange.start && customDateRange.end) {
          data = await getSalesData('custom', customDateRange.start, customDateRange.end);
        } else {
          data = await getSalesData(activePeriod);
        }
        
        setPeriodData(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données de période:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPeriodData();
  }, [user, activePeriod, customDateRange, refreshKey]);
  
  // Préparer les données pour l'exportation
  useEffect(() => {
    if (periodData.sales.length > 0) {
      const dataToExport = periodData.sales.map(item => ({
        Date: item.label,
        'Chiffre d\'affaires': item.value,
        // Nous utilisons les propriétés de l'interface DataPoint de façon sécurisée
        'Nombre de ventes': 0,  // Cette valeur sera à remplacer par la valeur réelle lorsque disponible
        'Panier moyen': 0,      // Cette valeur sera à remplacer par la valeur réelle lorsque disponible
        'Comparaison': 'N/A'    // Cette valeur sera à calculer lorsque possible
      }));
      
      setExportData(dataToExport);
    }
  }, [periodData.sales]);
  
  // Gérer le changement de période
  const handlePeriodChange = (period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom') => {
    if (period === 'custom') {
      setIsDateRangePickerOpen(true);
    } else {
      setActivePeriod(period);
    }
  };
  
  // Gérer l'application de la plage de dates personnalisée
  const handleDateRangeApply = (startDate: string, endDate: string) => {
    setCustomDateRange({ start: startDate, end: endDate });
    setActivePeriod('custom');
  };
  
  // Fonction pour obtenir le libellé de la période pour l'exportation
  const getPeriodLabel = (periodType: string): string => {
    switch (periodType) {
      case 'day': return 'Quotidien';
      case 'week': return 'Hebdomadaire';
      case 'month': return 'Mensuel';
      case 'quarter': return 'Trimestriel';
      case 'year': return 'Annuel';
      case 'custom': return 'Période personnalisée';
      default: return 'Période';
    }
  };

  // Titre formaté pour la période active
  const getFormattedPeriodTitle = () => {
    switch (activePeriod) {
      case 'day':
        return "Aujourd'hui";
      case 'week':
        return "Cette semaine";
      case 'month':
        return "Ce mois";
      case 'quarter':
        return "Ce trimestre";
      case 'year':
        return "Cette année";
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          const start = new Date(customDateRange.start).toLocaleDateString('fr-FR');
          const end = new Date(customDateRange.end).toLocaleDateString('fr-FR');
          return `Du ${start} au ${end}`;
        }
        return "Période personnalisée";
      default:
        return "";
    }
  };

  // Récupérer les données pour la période de comparaison
  const getPreviousPeriodData = () => {
    switch (activePeriod) {
      case 'day':
        return periodData.previousDay?.sales || null;
      case 'week':
        return periodData.previousWeek?.sales || null;
      case 'month':
        return periodData.previousMonth?.sales || null;
      case 'quarter':
        return periodData.previousQuarter?.sales || null;
      case 'year':
        return periodData.previousYear?.sales || null;
      case 'custom':
        // Pour une période personnalisée, on utilise le "previous" approprié selon la durée
        if (periodData.previousDay) return periodData.previousDay.sales;
        if (periodData.previousWeek) return periodData.previousWeek.sales;
        if (periodData.previousMonth) return periodData.previousMonth.sales;
        if (periodData.previousQuarter) return periodData.previousQuarter.sales;
        if (periodData.previousYear) return periodData.previousYear.sales;
        return null;
      default:
        return null;
    }
  };
  
  // Récupérer les données de visiteurs pour la période de comparaison
  const getPreviousPeriodVisitors = () => {
    switch (activePeriod) {
      case 'day':
        return periodData.previousDay?.visitors || null;
      case 'week':
        return periodData.previousWeek?.visitors || null;
      case 'month':
        return periodData.previousMonth?.visitors || null;
      case 'quarter':
        return periodData.previousQuarter?.visitors || null;
      case 'year':
        return periodData.previousYear?.visitors || null;
      case 'custom':
        // Pour une période personnalisée, on utilise le "previous" approprié selon la durée
        if (periodData.previousDay) return periodData.previousDay.visitors;
        if (periodData.previousWeek) return periodData.previousWeek.visitors;
        if (periodData.previousMonth) return periodData.previousMonth.visitors;
        if (periodData.previousQuarter) return periodData.previousQuarter.visitors;
        if (periodData.previousYear) return periodData.previousYear.visitors;
        return null;
      default:
        return null;
    }
  };
  
  // Récupérer les données de retours pour la période de comparaison
  const getPreviousPeriodReturns = () => {
    if (!periodData.returns) return null;
    
    switch (activePeriod) {
      case 'day':
        return periodData.previousDay?.returns || null;
      case 'week':
        return periodData.previousWeek?.returns || null;
      case 'month':
        return periodData.previousMonth?.returns || null;
      case 'quarter':
        return periodData.previousQuarter?.returns || null;
      case 'year':
        return periodData.previousYear?.returns || null;
      case 'custom':
        // Pour une période personnalisée, on utilise le "previous" approprié selon la durée
        if (periodData.previousDay && periodData.previousDay.returns) return periodData.previousDay.returns;
        if (periodData.previousWeek && periodData.previousWeek.returns) return periodData.previousWeek.returns;
        if (periodData.previousMonth && periodData.previousMonth.returns) return periodData.previousMonth.returns;
        if (periodData.previousQuarter && periodData.previousQuarter.returns) return periodData.previousQuarter.returns;
        if (periodData.previousYear && periodData.previousYear.returns) return periodData.previousYear.returns;
        return null;
      default:
        return null;
    }
  };
  
  return (
    <>
      <PageHeader title="Analyses et statistiques" />
      
      <div className="p-6">
        {/* Tableau de bord quotidien */}
        <DailySalesDashboard data={dashboardData} />
        
        {/* Contrôles de période et d'exportation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-bold mb-4 md:mb-0">
            {getFormattedPeriodTitle()}
          </h2>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activePeriod === 'day' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('day')}
            >
              Jour
            </Button>
            <Button
              variant={activePeriod === 'week' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('week')}
            >
              Semaine
            </Button>
            <Button
              variant={activePeriod === 'month' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('month')}
            >
              Mois
            </Button>
            <Button
              variant={activePeriod === 'quarter' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('quarter')}
            >
              Trimestre
            </Button>
            <Button
              variant={activePeriod === 'year' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('year')}
            >
              Année
            </Button>
            <Button
              variant={activePeriod === 'custom' ? 'default' : 'outline'}
              onClick={() => handlePeriodChange('custom')}
            >
              <FiCalendar className="mr-2" />
              Personnalisé
            </Button>
            
            <Button variant="outline" onClick={() => setRefreshKey(prev => prev + 1)}>
              <FiRefreshCw className="mr-2" />
              Actualiser
            </Button>
            
            <ExportButton 
              data={exportData} 
              options={{
                fileName: `analyses_ventes_${activePeriod}`,
                title: `Rapport d'analyses de ventes - ${getPeriodLabel(activePeriod)}`,
                includeTimestamp: true,
                author: 'FFOV Analytics'
              }}
              columns={[
                { key: 'Date', header: 'Date' },
                { key: 'Chiffre d\'affaires', header: 'Chiffre d\'affaires' },
                { key: 'Nombre de ventes', header: 'Nombre de ventes' },
                { key: 'Panier moyen', header: 'Panier moyen' },
                { key: 'Comparaison', header: 'Comparaison' }
              ]}
              variant="outline"
              label="Exporter"
            />
          </div>
        </div>
        
        {/* Graphiques */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="h-72 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernLineChart
              data={periodData.sales}
              title="Chiffre d'affaires"
              color="#3b82f6"
              previousPeriodData={getPreviousPeriodData()}
              currency={true}
            />
            
            <ModernBarChart
              data={periodData.visitors}
              title="Visiteurs"
              color="#10b981"
              previousPeriodData={getPreviousPeriodVisitors()}
            />
            
            {periodData.returns && periodData.returns.length > 0 && (
              <ModernBarChart
                data={periodData.returns}
                title="Remboursements"
                color="#ef4444"
                previousPeriodData={getPreviousPeriodReturns()}
                currency={true}
              />
            )}
            
            {/* Carte supplémentaire pour les informations */}
            <Card className="h-full flex flex-col justify-center items-center text-center p-6">
              <FiInfo className="text-4xl text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analyse personnalisée</h3>
              <p className="text-gray-600 mb-4">
                Vous pouvez comparer les données de différentes périodes en utilisant les filtres ci-dessus.
              </p>
              <Button onClick={() => handlePeriodChange('custom')}>
                Créer un rapport personnalisé
              </Button>
            </Card>
          </div>
        )}
        
        {/* Section "Insights" */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-blue-100 mr-3">
                    <FiTrendingUp className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Tendance des ventes</h3>
                </div>
                <p className="text-gray-600">
                  {
                    dashboardData.salesChange.includes('+')
                      ? `Vos ventes ont augmenté de ${dashboardData.salesChange} par rapport à la période précédente. Continuez sur cette lancée!`
                      : dashboardData.salesChange === '0%'
                      ? 'Vos ventes sont stables par rapport à la période précédente.'
                      : `Vos ventes ont diminué de ${dashboardData.salesChange.replace('-', '')} par rapport à la période précédente. Analysez les causes potentielles.`
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-green-100 mr-3">
                    <FiUsers className="text-green-600" />
                  </div>
                  <h3 className="font-semibold">Tendance des visiteurs</h3>
                </div>
                <p className="text-gray-600">
                  {
                    dashboardData.visitorsChange.includes('+')
                      ? `Votre nombre de visiteurs a augmenté de ${dashboardData.visitorsChange}. Vérifiez si vos ventes suivent cette tendance.`
                      : dashboardData.visitorsChange === '0%'
                      ? 'Votre trafic de visiteurs est stable par rapport à la période précédente.'
                      : `Votre nombre de visiteurs a diminué de ${dashboardData.visitorsChange.replace('-', '')}. Envisagez de renforcer vos actions marketing.`
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-yellow-100 mr-3">
                    <FiActivity className="text-yellow-600" />
                  </div>
                  <h3 className="font-semibold">Taux de conversion</h3>
                </div>
                <p className="text-gray-600">
                  {
                    dashboardData.visitors > 0
                      ? `Votre taux de conversion actuel est de ${((dashboardData.totalSales / dashboardData.visitors) * 100).toFixed(1)}%. ${
                          dashboardData.salesChange.includes('+') && dashboardData.visitorsChange.includes('+')
                            ? 'Vos ventes et visites augmentent, excellent!'
                            : dashboardData.salesChange.includes('+') && !dashboardData.visitorsChange.includes('+')
                            ? 'Vos ventes augmentent malgré une baisse des visites, votre conversion s\'améliore!'
                            : !dashboardData.salesChange.includes('+') && dashboardData.visitorsChange.includes('+')
                            ? 'Vos visites augmentent mais pas vos ventes, travaillez sur votre taux de conversion.'
                            : 'Attention, vos ventes et visites sont en baisse.'
                        }`
                      : 'Pas assez de données pour calculer un taux de conversion précis.'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modales */}
      <DateRangePicker
        isOpen={isDateRangePickerOpen}
        onClose={() => setIsDateRangePickerOpen(false)}
        onApply={handleDateRangeApply}
      />
    </>
  );
}
