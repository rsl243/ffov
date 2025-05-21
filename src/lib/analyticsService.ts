import { supabase } from './supabase';
import { format, parseISO, subDays, subMonths, subYears, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les données d'analyse
export interface DataPoint {
  label: string;
  value: number;
}

export interface PeriodData {
  sales: DataPoint[];
  visitors: DataPoint[];
  returns?: DataPoint[];
  previousYear?: {
    sales: DataPoint[];
    visitors: DataPoint[];
    returns?: DataPoint[];
  };
  previousQuarter?: {
    sales: DataPoint[];
    visitors: DataPoint[];
    returns?: DataPoint[];
  };
  previousMonth?: {
    sales: DataPoint[];
    visitors: DataPoint[];
    returns?: DataPoint[];
  };
  previousWeek?: {
    sales: DataPoint[];
    visitors: DataPoint[];
    returns?: DataPoint[];
  };
  previousDay?: {
    sales: DataPoint[];
    visitors: DataPoint[];
    returns?: DataPoint[];
  };
}

export interface DashboardData {
  totalSales: number;
  salesChange: string;
  visitors: number;
  visitorsChange: string;
  newCustomers: number;
  customersChange: string;
  returnRate: string;
  returnRateChange: string;
}

/**
 * Fonction pour récupérer les données de ventes sur une période donnée
 */
export const getSalesData = async (
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom' = 'month',
  customStartDate?: string,
  customEndDate?: string
): Promise<PeriodData> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Déterminer les dates de début et de fin pour la période actuelle
    const now = new Date();
    let currentStartDate: Date;
    let currentEndDate: Date = now;
    let previousStartDate: Date;
    let previousEndDate: Date;
    let intervalFunction: any;
    let formatString: string;
    
    if (period === 'custom' && customStartDate && customEndDate) {
      currentStartDate = new Date(customStartDate);
      currentEndDate = new Date(customEndDate);
      
      // Calculer la période précédente avec la même durée
      const duration = currentEndDate.getTime() - currentStartDate.getTime();
      previousEndDate = new Date(currentStartDate);
      previousStartDate = new Date(currentStartDate.getTime() - duration);
      
      // Déterminer le format de date en fonction de la durée
      const durationInDays = duration / (1000 * 60 * 60 * 24);
      
      if (durationInDays <= 7) {
        intervalFunction = eachDayOfInterval;
        formatString = 'dd/MM';
      } else if (durationInDays <= 90) {
        intervalFunction = eachWeekOfInterval;
        formatString = "'S'w MMM";
      } else {
        intervalFunction = eachMonthOfInterval;
        formatString = 'MMM yyyy';
      }
    } else {
      switch (period) {
        case 'day':
          currentStartDate = startOfDay(now);
          previousEndDate = startOfDay(subDays(now, 1));
          previousStartDate = startOfDay(subDays(now, 2));
          intervalFunction = (interval: any) => {
            const hours = [];
            for (let i = 0; i < 24; i += 2) {
              const date = new Date(interval.start);
              date.setHours(i, 0, 0, 0);
              if (date <= interval.end) {
                hours.push(date);
              }
            }
            return hours;
          };
          formatString = 'HH\'h\'';
          break;
          
        case 'week':
          currentStartDate = startOfWeek(now, { locale: fr });
          previousEndDate = startOfWeek(subWeeks(now, 1), { locale: fr });
          previousStartDate = startOfWeek(subWeeks(now, 2), { locale: fr });
          intervalFunction = eachDayOfInterval;
          formatString = 'EEE';
          break;
          
        case 'month':
          currentStartDate = startOfMonth(now);
          previousEndDate = startOfMonth(subMonths(now, 1));
          previousStartDate = startOfMonth(subMonths(now, 2));
          intervalFunction = eachDayOfInterval;
          formatString = 'dd MMM';
          break;
          
        case 'quarter':
          // Pour simplifier, on considère un trimestre comme 3 mois
          currentStartDate = startOfMonth(subMonths(now, 3));
          previousEndDate = startOfMonth(subMonths(now, 3));
          previousStartDate = startOfMonth(subMonths(now, 6));
          intervalFunction = eachWeekOfInterval;
          formatString = "'S'w MMM";
          break;
          
        case 'year':
          currentStartDate = startOfYear(now);
          previousEndDate = startOfYear(subYears(now, 1));
          previousStartDate = startOfYear(subYears(now, 2));
          intervalFunction = eachMonthOfInterval;
          formatString = 'MMM';
          break;
          
        default:
          currentStartDate = startOfMonth(now);
          previousEndDate = startOfMonth(subMonths(now, 1));
          previousStartDate = startOfMonth(subMonths(now, 2));
          intervalFunction = eachDayOfInterval;
          formatString = 'dd MMM';
      }
    }
    
    // Récupérer les données de ventes pour la période actuelle
    const { data: currentSalesData, error: currentSalesError } = await supabase
      .from('daily_sales')
      .select('date, revenue, visitors, returns')
      .eq('organization_id', user.id)
      .gte('date', currentStartDate.toISOString())
      .lte('date', currentEndDate.toISOString())
      .order('date', { ascending: true });
    
    if (currentSalesError) {
      console.error('Erreur lors de la récupération des ventes actuelles:', currentSalesError);
      throw currentSalesError;
    }
    
    // Récupérer les données de ventes pour la période précédente
    const { data: previousSalesData, error: previousSalesError } = await supabase
      .from('daily_sales')
      .select('date, revenue, visitors, returns')
      .eq('organization_id', user.id)
      .gte('date', previousStartDate.toISOString())
      .lte('date', previousEndDate.toISOString())
      .order('date', { ascending: true });
    
    if (previousSalesError) {
      console.error('Erreur lors de la récupération des ventes précédentes:', previousSalesError);
      throw previousSalesError;
    }
    
    // Générer les intervalles pour la période actuelle et précédente
    const currentInterval = intervalFunction({ start: currentStartDate, end: currentEndDate });
    const previousInterval = intervalFunction({ start: previousStartDate, end: previousEndDate });
    
    // Préparer les données pour le graphique
    const salesPoints: DataPoint[] = [];
    const visitorPoints: DataPoint[] = [];
    const returnPoints: DataPoint[] = [];
    
    const prevSalesPoints: DataPoint[] = [];
    const prevVisitorPoints: DataPoint[] = [];
    const prevReturnPoints: DataPoint[] = [];
    
    // Convertir les données pour la période actuelle
    currentInterval.forEach((date: Date) => {
      const formattedLabel = format(date, formatString, { locale: fr });
      
      // Trouver les données pour cette date
      const dateData = currentSalesData?.find(item => {
        const itemDate = new Date(item.date);
        
        // La comparaison dépend de la période
        if (period === 'day') {
          return itemDate.getHours() === date.getHours();
        } else if (period === 'week' || period === 'month') {
          return format(itemDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        } else if (period === 'quarter') {
          return format(itemDate, 'yyyy-w') === format(date, 'yyyy-w');
        } else if (period === 'year') {
          return format(itemDate, 'yyyy-MM') === format(date, 'yyyy-MM');
        } else {
          return false;
        }
      });
      
      salesPoints.push({
        label: formattedLabel,
        value: dateData?.revenue || 0
      });
      
      visitorPoints.push({
        label: formattedLabel,
        value: dateData?.visitors || 0
      });
      
      returnPoints.push({
        label: formattedLabel,
        value: dateData?.returns || 0
      });
    });
    
    // Convertir les données pour la période précédente
    previousInterval.forEach((date: Date) => {
      const formattedLabel = format(date, formatString, { locale: fr });
      
      // Trouver les données pour cette date
      const dateData = previousSalesData?.find(item => {
        const itemDate = new Date(item.date);
        
        // La comparaison dépend de la période
        if (period === 'day') {
          return itemDate.getHours() === date.getHours();
        } else if (period === 'week' || period === 'month') {
          return format(itemDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        } else if (period === 'quarter') {
          return format(itemDate, 'yyyy-w') === format(date, 'yyyy-w');
        } else if (period === 'year') {
          return format(itemDate, 'yyyy-MM') === format(date, 'yyyy-MM');
        } else {
          return false;
        }
      });
      
      prevSalesPoints.push({
        label: formattedLabel,
        value: dateData?.revenue || 0
      });
      
      prevVisitorPoints.push({
        label: formattedLabel,
        value: dateData?.visitors || 0
      });
      
      prevReturnPoints.push({
        label: formattedLabel,
        value: dateData?.returns || 0
      });
    });
    
    // Construire l'objet de retour en fonction de la période
    let result: PeriodData = {
      sales: salesPoints,
      visitors: visitorPoints,
      returns: returnPoints
    };
    
    switch (period) {
      case 'day':
        result.previousDay = {
          sales: prevSalesPoints,
          visitors: prevVisitorPoints,
          returns: prevReturnPoints
        };
        break;
      case 'week':
        result.previousWeek = {
          sales: prevSalesPoints,
          visitors: prevVisitorPoints,
          returns: prevReturnPoints
        };
        break;
      case 'month':
        result.previousMonth = {
          sales: prevSalesPoints,
          visitors: prevVisitorPoints,
          returns: prevReturnPoints
        };
        break;
      case 'quarter':
        result.previousQuarter = {
          sales: prevSalesPoints,
          visitors: prevVisitorPoints,
          returns: prevReturnPoints
        };
        break;
      case 'year':
        result.previousYear = {
          sales: prevSalesPoints,
          visitors: prevVisitorPoints,
          returns: prevReturnPoints
        };
        break;
      case 'custom':
        // Déterminer le bon objet "previous" en fonction de la durée
        const duration = currentEndDate.getTime() - currentStartDate.getTime();
        const durationInDays = duration / (1000 * 60 * 60 * 24);
        
        if (durationInDays <= 1) {
          result.previousDay = {
            sales: prevSalesPoints,
            visitors: prevVisitorPoints,
            returns: prevReturnPoints
          };
        } else if (durationInDays <= 7) {
          result.previousWeek = {
            sales: prevSalesPoints,
            visitors: prevVisitorPoints,
            returns: prevReturnPoints
          };
        } else if (durationInDays <= 31) {
          result.previousMonth = {
            sales: prevSalesPoints,
            visitors: prevVisitorPoints,
            returns: prevReturnPoints
          };
        } else if (durationInDays <= 92) {
          result.previousQuarter = {
            sales: prevSalesPoints,
            visitors: prevVisitorPoints,
            returns: prevReturnPoints
          };
        } else {
          result.previousYear = {
            sales: prevSalesPoints,
            visitors: prevVisitorPoints,
            returns: prevReturnPoints
          };
        }
        break;
    }
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération des données de ventes:', error);
    
    // Retourner des données vides en cas d'erreur
    return {
      sales: [],
      visitors: [],
      returns: []
    };
  }
};

/**
 * Fonction pour récupérer les données du tableau de bord quotidien
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Définir les périodes actuelles et précédentes
    const today = new Date();
    const yesterday = subDays(today, 1);
    const startOfToday = startOfDay(today);
    const startOfYesterday = startOfDay(yesterday);
    const endOfYesterday = endOfDay(yesterday);
    
    // 1. Récupérer les ventes d'aujourd'hui
    const { data: todaySales, error: todaySalesError } = await supabase
      .from('daily_sales')
      .select('revenue, visitors, returns')
      .eq('organization_id', user.id)
      .gte('date', startOfToday.toISOString())
      .lte('date', today.toISOString())
      .order('date', { ascending: false });
    
    if (todaySalesError) {
      console.error('Erreur lors de la récupération des ventes d\'aujourd\'hui:', todaySalesError);
      throw todaySalesError;
    }
    
    // 2. Récupérer les ventes d'hier
    const { data: yesterdaySales, error: yesterdaySalesError } = await supabase
      .from('daily_sales')
      .select('revenue, visitors, returns')
      .eq('organization_id', user.id)
      .gte('date', startOfYesterday.toISOString())
      .lte('date', endOfYesterday.toISOString())
      .order('date', { ascending: false });
    
    if (yesterdaySalesError) {
      console.error('Erreur lors de la récupération des ventes d\'hier:', yesterdaySalesError);
      throw yesterdaySalesError;
    }
    
    // 3. Récupérer les nouveaux clients d'aujourd'hui
    const { count: todayNewCustomers, error: todayCustomersError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.id)
      .gte('created_at', startOfToday.toISOString())
      .lte('created_at', today.toISOString());
    
    if (todayCustomersError) {
      console.error('Erreur lors de la récupération des nouveaux clients d\'aujourd\'hui:', todayCustomersError);
      throw todayCustomersError;
    }
    
    // 4. Récupérer les nouveaux clients d'hier
    const { count: yesterdayNewCustomers, error: yesterdayCustomersError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.id)
      .gte('created_at', startOfYesterday.toISOString())
      .lte('created_at', endOfYesterday.toISOString());
    
    if (yesterdayCustomersError) {
      console.error('Erreur lors de la récupération des nouveaux clients d\'hier:', yesterdayCustomersError);
      throw yesterdayCustomersError;
    }
    
    // Calculer les totaux
    const totalTodaySales = todaySales?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0;
    const totalTodayVisitors = todaySales?.reduce((sum, item) => sum + (item.visitors || 0), 0) || 0;
    const totalTodayReturns = todaySales?.reduce((sum, item) => sum + (item.returns || 0), 0) || 0;
    
    const totalYesterdaySales = yesterdaySales?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0;
    const totalYesterdayVisitors = yesterdaySales?.reduce((sum, item) => sum + (item.visitors || 0), 0) || 0;
    const totalYesterdayReturns = yesterdaySales?.reduce((sum, item) => sum + (item.returns || 0), 0) || 0;
    
    // Calculer les variations
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };
    
    // Calculer le taux de retour
    const todayReturnRate = totalTodaySales > 0 ? (totalTodayReturns / totalTodaySales) * 100 : 0;
    const yesterdayReturnRate = totalYesterdaySales > 0 ? (totalYesterdayReturns / totalYesterdaySales) * 100 : 0;
    
    // Construire et retourner l'objet d'analytics
    return {
      totalSales: totalTodaySales,
      salesChange: calculateChange(totalTodaySales, totalYesterdaySales),
      visitors: totalTodayVisitors,
      visitorsChange: calculateChange(totalTodayVisitors, totalYesterdayVisitors),
      newCustomers: todayNewCustomers || 0,
      customersChange: calculateChange(todayNewCustomers || 0, yesterdayNewCustomers || 0),
      returnRate: `${todayReturnRate.toFixed(1)}%`,
      returnRateChange: calculateChange(todayReturnRate, yesterdayReturnRate)
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    
    // Retourner des données par défaut en cas d'erreur
    return {
      totalSales: 0,
      salesChange: '0%',
      visitors: 0,
      visitorsChange: '0%',
      newCustomers: 0,
      customersChange: '0%',
      returnRate: '0%',
      returnRateChange: '0%'
    };
  }
};
