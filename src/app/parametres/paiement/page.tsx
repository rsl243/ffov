"use client";

import React, { useState } from 'react';
import { FiPlus, FiCreditCard, FiCheckCircle, FiSettings, FiSlash, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import Image from 'next/image';

export default function MoyensPaiementPage() {
  // État pour les méthodes de paiement activées
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'card', name: 'Carte bancaire', enabled: true, configured: true, icon: '/images/card.svg', fee: '1.4% + 0.25€' },
    { id: 'paypal', name: 'PayPal', enabled: true, configured: true, icon: '/images/paypal.svg', fee: '2.9% + 0.35€' },
    { id: 'apple_pay', name: 'Apple Pay', enabled: false, configured: false, icon: '/images/apple-pay.svg', fee: '1.5% + 0.15€' },
    { id: 'google_pay', name: 'Google Pay', enabled: false, configured: false, icon: '/images/google-pay.svg', fee: '1.5% + 0.15€' },
    { id: 'bank_transfer', name: 'Virement bancaire', enabled: true, configured: true, icon: '/images/bank-transfer.svg', fee: '0€' },
    { id: 'klarna', name: 'Klarna', enabled: false, configured: false, icon: '/images/klarna.svg', fee: '2.5% + 0.20€' },
    { id: 'stripe', name: 'Stripe', enabled: false, configured: false, icon: '/images/stripe.svg', fee: '1.5% + 0.25€' },
  ]);
  
  // État pour l'activation/désactivation des méthodes
  const [isUpdating, setIsUpdating] = useState(false);
  
  // État pour le dialogue de configuration
  const [configOpen, setConfigOpen] = useState(false);
  const [configMethod, setConfigMethod] = useState(null);
  
  // Fonction pour changer l'état d'activation d'une méthode de paiement
  const togglePaymentMethod = (id) => {
    setIsUpdating(true);
    setTimeout(() => {
      setPaymentMethods(methods => 
        methods.map(method => 
          method.id === id 
            ? { ...method, enabled: !method.enabled } 
            : method
        )
      );
      setIsUpdating(false);
    }, 500);
  };
  
  // Ouvrir le dialogue de configuration
  const openConfig = (method) => {
    setConfigMethod(method);
    setConfigOpen(true);
  };
  
  // Simuler la configuration d'une méthode de paiement
  const saveConfig = () => {
    setPaymentMethods(methods => 
      methods.map(method => 
        method.id === configMethod.id 
          ? { ...method, configured: true } 
          : method
      )
    );
    setConfigOpen(false);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Moyens de paiement</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <FiPlus className="mr-2" /> Ajouter un mode de paiement
        </button>
      </div>
      
      {/* Section d'information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-medium text-blue-700 mb-2">Gestion des moyens de paiement</h2>
        <p className="text-sm text-blue-600">
          Configurez les méthodes de paiement que vos clients pourront utiliser pour régler leurs achats.
          Activez ou désactivez des méthodes selon vos besoins et assurez-vous que vos informations de compte
          sont à jour pour chaque méthode de paiement.
        </p>
      </div>
      
      {/* Liste des moyens de paiement */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Méthodes de paiement disponibles</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {paymentMethods.map(method => (
            <div key={method.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                  {/* Remplacer par de vraies images si disponibles */}
                  <FiCreditCard className="text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{method.name}</h3>
                  <p className="text-sm text-gray-500">
                    {method.configured ? (
                      <span className="flex items-center text-green-600">
                        <FiCheckCircle className="mr-1" />
                        Configuré
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-500">
                        <FiSlash className="mr-1" />
                        Non configuré
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-right mr-4">
                  <div className="text-sm font-medium text-gray-900">Frais</div>
                  <div className="text-sm text-gray-500">{method.fee}</div>
                </div>
                
                {method.configured ? (
                  <button 
                    onClick={() => togglePaymentMethod(method.id)}
                    disabled={isUpdating}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    {method.enabled ? (
                      <FiToggleRight className="w-8 h-8 text-blue-600" />
                    ) : (
                      <FiToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={() => openConfig(method)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Configurer
                  </button>
                )}
                
                <button
                  onClick={() => openConfig(method)} 
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <FiSettings />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Section des paramètres de paiement */}
      <div className="bg-white rounded-lg shadow-sm mt-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Paramètres de paiement</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-medium mb-3">Devise de paiement par défaut</h3>
            <div className="relative w-64">
              <select className="w-full p-2 border border-gray-300 rounded appearance-none">
                <option value="EUR">Euro (EUR €)</option>
                <option value="USD">Dollar américain (USD $)</option>
                <option value="GBP">Livre sterling (GBP £)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg className="fill-current h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Options de paiement avancées</h3>
            
            <div className="flex items-center">
              <input
                id="capture-payment"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="capture-payment" className="ml-2 text-sm text-gray-700">
                Capturer automatiquement les paiements
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="save-payment-info"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="save-payment-info" className="ml-2 text-sm text-gray-700">
                Autoriser les clients à sauvegarder leurs informations de paiement
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="test-mode"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="test-mode" className="ml-2 text-sm text-gray-700">
                Activer le mode test
              </label>
            </div>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Enregistrer les paramètres
          </button>
        </div>
      </div>
      
      {/* Modal de configuration (simplifié) */}
      {configOpen && configMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-medium mb-4">Configurer {configMethod.name}</h2>
            
            <p className="text-gray-600 mb-4">
              Veuillez renseigner vos informations de compte pour activer ce moyen de paiement.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Identifiant marchand
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Votre identifiant marchand"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clé API
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Votre clé API"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clé secrète
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Votre clé secrète"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfigOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={saveConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 