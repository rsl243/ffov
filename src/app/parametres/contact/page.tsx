"use client";

import React, { useState, useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';

export default function ParametresContactPage() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Récupérer les informations de contact au chargement de la page
  useEffect(() => {
    const fetchContactData = async () => {
      try {
        setLoading(true);
        // Récupérer les données depuis l'API
        const response = await fetch('/api/vendors/me');
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        
        const data = await response.json();
        
        // Mettre à jour l'état avec les données de contact
        if (data.vendor) {
          setPhone(data.vendor.phoneNumber || '');
          setEmail(data.vendor.email || '');
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Impossible de charger vos informations. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContactData();
  }, []);

  // Fonction pour mettre à jour les informations de contact
  const handleUpdateContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/vendors/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phone,
          email
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des informations');
      }
      
      setSuccess('Vos informations de contact ont été mises à jour avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de mettre à jour vos informations. Veuillez réessayer plus tard.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Informations de contact</h1>
      
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
          <p className="text-gray-500">Chargement de vos informations...</p>
        </div>
      ) : (
        <form onSubmit={handleUpdateContact}>
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-medium mb-6">Modifier vos informations de contact</h2>
            
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre numéro de téléphone"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email professionnel
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre email professionnel"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={loading}
              >
                <FiCheck className="mr-2" />
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
