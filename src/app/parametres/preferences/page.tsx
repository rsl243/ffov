"use client";

import React, { useState, useEffect } from 'react';
import { FiCheck, FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

export default function ParametresPreferencesPage() {
  const { preferences, loading, updatePreferences } = useUserPreferences();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);

  // État local pour stocker les modifications avant de les enregistrer
  const [formData, setFormData] = useState<{
    theme: 'light' | 'dark' | 'system';
    language: 'fr' | 'en' | 'es' | 'de';
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    currency: 'EUR' | 'USD' | 'GBP' | 'CAD';
  }>({
    theme: 'system',
    language: 'fr',
    notificationsEnabled: true,
    emailNotifications: true,
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR'
  });

  // Synchroniser l'état local avec les préférences chargées
  useEffect(() => {
    if (!loading && preferences) {
      setFormData({
        theme: preferences.theme,
        language: preferences.language,
        notificationsEnabled: preferences.notificationsEnabled,
        emailNotifications: preferences.emailNotifications,
        timezone: preferences.timezone,
        dateFormat: preferences.dateFormat,
        currency: preferences.currency
      });
    }
  }, [preferences, loading]);

  // Gérer les changements de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      } as typeof formData));
    } else if (name === 'theme') {
      // S'assurer que les types sont corrects pour theme
      const themeValue = value as 'light' | 'dark' | 'system';
      setFormData(prev => ({
        ...prev,
        theme: themeValue
      }));
    } else if (name === 'language') {
      // S'assurer que les types sont corrects pour language
      const langValue = value as 'fr' | 'en' | 'es' | 'de';
      setFormData(prev => ({
        ...prev,
        language: langValue
      }));
    } else if (name === 'dateFormat') {
      // S'assurer que les types sont corrects pour dateFormat
      const formatValue = value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
      setFormData(prev => ({
        ...prev,
        dateFormat: formatValue
      }));
    } else if (name === 'currency') {
      // S'assurer que les types sont corrects pour currency
      const currencyValue = value as 'EUR' | 'USD' | 'GBP' | 'CAD';
      setFormData(prev => ({
        ...prev,
        currency: currencyValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      } as typeof formData));
    }
  };

  // Enregistrer les modifications
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSavingChanges(true);
      await updatePreferences(formData);
      setSuccess('Vos préférences ont été mises à jour avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de mettre à jour vos préférences. Veuillez réessayer plus tard.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSavingChanges(false);
    }
  };

  // Sélectionner un thème directement
  const handleThemeSelect = async (theme: 'light' | 'dark' | 'system') => {
    setFormData(prev => ({
      ...prev,
      theme
    }));
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Préférences</h1>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-center items-center h-40">
          <p className="text-gray-500">Chargement de vos préférences...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Thème */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-medium mb-6">Apparence</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thème
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${
                    formData.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleThemeSelect('light')}
                >
                  <FiSun className="text-2xl mb-2" />
                  <div className="font-medium">Clair</div>
                  <p className="text-xs text-gray-500 text-center mt-1">Utiliser le thème clair tout le temps</p>
                  <input 
                    type="radio" 
                    name="theme" 
                    value="light"
                    checked={formData.theme === 'light'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {formData.theme === 'light' && (
                    <div className="absolute top-2 right-2 text-blue-500">
                      <FiCheck />
                    </div>
                  )}
                </div>
                
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${
                    formData.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleThemeSelect('dark')}
                >
                  <FiMoon className="text-2xl mb-2" />
                  <div className="font-medium">Sombre</div>
                  <p className="text-xs text-gray-500 text-center mt-1">Utiliser le thème sombre tout le temps</p>
                  <input 
                    type="radio" 
                    name="theme" 
                    value="dark"
                    checked={formData.theme === 'dark'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {formData.theme === 'dark' && (
                    <div className="absolute top-2 right-2 text-blue-500">
                      <FiCheck />
                    </div>
                  )}
                </div>
                
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${
                    formData.theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleThemeSelect('system')}
                >
                  <FiMonitor className="text-2xl mb-2" />
                  <div className="font-medium">Système</div>
                  <p className="text-xs text-gray-500 text-center mt-1">Correspondre aux préférences de votre système</p>
                  <input 
                    type="radio" 
                    name="theme" 
                    value="system"
                    checked={formData.theme === 'system'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {formData.theme === 'system' && (
                    <div className="absolute top-2 right-2 text-blue-500">
                      <FiCheck />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Langue
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
          
          {/* Notifications */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-medium mb-6">Notifications</h2>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notificationsEnabled"
                  name="notificationsEnabled"
                  checked={formData.notificationsEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notificationsEnabled" className="ml-2 block text-sm font-medium text-gray-700">
                  Activer les notifications dans l'application
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Afficher des notifications dans l'interface de l'application
              </p>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm font-medium text-gray-700">
                  Recevoir des notifications par e-mail
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6 mt-1">
                Recevoir des e-mails pour les événements importants (commandes, messages, etc.)
              </p>
            </div>
          </div>
          
          {/* Format et devise */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-medium mb-6">Format et devise</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-2">
                  Format de date
                </label>
                <select
                  id="dateFormat"
                  name="dateFormat"
                  value={formData.dateFormat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">JJ/MM/AAAA (31/12/2023)</option>
                  <option value="MM/DD/YYYY">MM/JJ/AAAA (12/31/2023)</option>
                  <option value="YYYY-MM-DD">AAAA-MM-JJ (2023-12-31)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Devise
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dollar américain ($)</option>
                  <option value="GBP">Livre sterling (£)</option>
                  <option value="CAD">Dollar canadien (C$)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                Fuseau horaire
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="Europe/London">Europe/Londres (UTC+0)</option>
                <option value="America/New_York">Amérique/New York (UTC-5)</option>
                <option value="America/Los_Angeles">Amérique/Los Angeles (UTC-8)</option>
                <option value="Asia/Tokyo">Asie/Tokyo (UTC+9)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={savingChanges}
            >
              {savingChanges ? 'Enregistrement...' : 'Enregistrer les préférences'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
