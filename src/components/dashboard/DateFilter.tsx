import React from 'react';
import { FiCalendar, FiRefreshCw } from 'react-icons/fi';

interface DateFilterProps {
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  lastSync: string;
  isRefreshing: boolean;
  handleRefresh: () => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
  dateFilter,
  setDateFilter,
  lastSync,
  isRefreshing,
  handleRefresh
}) => {
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

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <FiCalendar className="mr-2" /> {getTodayDate()}
        </h2>
        <p className="text-sm text-gray-500">
          <span>Données {getFilterLabel()}</span> • <span>Dernière actualisation : {lastSync}</span>
        </p>
      </div>
      
      <div className="mt-3 md:mt-0 flex items-center space-x-3">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-4 py-2 text-sm font-medium ${dateFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-l-md border border-gray-300`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-4 py-2 text-sm font-medium ${dateFilter === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-t border-b border-r border-l border-gray-300`}
          >
            Cette semaine
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-4 py-2 text-sm font-medium ${dateFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-r-md border border-gray-300`}
          >
            Ce mois
          </button>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>
    </div>
  );
};

export default DateFilter;
