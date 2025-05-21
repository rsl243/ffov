'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiDownload, FiFileText, FiGrid, FiFile, FiCode } from 'react-icons/fi';
import { exportToCsv, exportToExcel, exportToPdf, exportToJson, ExportOptions } from '@/lib/exportService';

interface ExportButtonProps {
  data: Record<string, any>[];
  columns?: { key: string; header: string }[];
  options: ExportOptions;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: boolean;
}

/**
 * Composant de bouton d'exportation avec menu déroulant
 */
const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  columns,
  options,
  className = '',
  variant = 'primary',
  label = 'Exporter',
  size = 'md',
  icon = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Styles conditionnels
  const buttonClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2'
  };
  
  const handleExport = (type: 'csv' | 'excel' | 'pdf' | 'json') => {
    try {
      if (!data || data.length === 0) {
        alert('Aucune donnée à exporter');
        return;
      }
      
      switch (type) {
        case 'csv':
          exportToCsv(data, options);
          break;
        case 'excel':
          exportToExcel(data, options);
          break;
        case 'pdf':
          if (!columns) {
            // Générer automatiquement les colonnes si non fournies
            const firstItem = data[0];
            columns = Object.keys(firstItem).map(key => ({
              key,
              header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
            }));
          }
          exportToPdf(data, columns, options);
          break;
        case 'json':
          exportToJson(data, options);
          break;
      }
      
      // Fermer le menu après export
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      alert('Une erreur est survenue lors de l\'exportation');
    }
  };
  
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button 
        className={`flex items-center justify-center rounded-md ${buttonClasses[variant]} ${sizeClasses[size]}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon && <FiDownload className="mr-2" />}
        {label}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button 
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleExport('csv')}
            >
              <FiFileText className="mr-2" />
              Exporter en CSV
            </button>
            <button 
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleExport('excel')}
            >
              <FiGrid className="mr-2" />
              Exporter en Excel
            </button>
            <button 
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleExport('pdf')}
            >
              <FiFile className="mr-2" />
              Exporter en PDF
            </button>
            <button 
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleExport('json')}
            >
              <FiCode className="mr-2" />
              Exporter en JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
