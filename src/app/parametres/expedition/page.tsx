"use client";

import React, { useState, useEffect } from 'react';
import { FiTool, FiEdit2, FiTrash2, FiPlus, FiSave, FiRefreshCcw } from 'react-icons/fi';

interface DeliveryOption {
  id: number;
  name: string;
  price: number;
  delay: string;
  countries: string; // Pays desservis (ex: "France, Belgique")
  type: string; // Type de livraison (standard, express, relais, etc.)
  description: string; // Description personnalisée
  weightRange: string; // Plage de poids ou zone (ex: "0-2kg, Zone 1")
}

export default function ExpeditionPage() {
  const [freeShippingMin, setFreeShippingMin] = useState<number>(0);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [editingOption, setEditingOption] = useState<DeliveryOption | null>(null);
  const [form, setForm] = useState({ name: '', price: '', delay: '', countries: '', type: '', description: '', weightRange: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch settings from API
  useEffect(() => {
    setLoading(true);
    fetch('/api/vendors/me/shipping')
      .then(async res => {
        const contentType = res.headers.get('content-type');
        if (!res.ok) {
          if (contentType && contentType.includes('application/json')) {
            throw new Error((await res.json()).error || 'Erreur serveur');
          } else {
            // Affiche le texte brut de la réponse HTML (utile pour debug)
            throw new Error(await res.text());
          }
        }
        return res.json();
      })
      .then(data => {
        setFreeShippingMin(data.settings?.freeShippingMin || 0);
        setDeliveryOptions((data.options || []).map((opt: any, i: number) => ({
          ...opt,
          id: opt.id || i,
          countries: opt.countries || '',
          type: opt.type || '',
          description: opt.description || '',
          weightRange: opt.weightRange || '',
        })));
        setError(null);
      })
      .catch(e => setError(typeof e === 'string' ? e : e.message))
      .finally(() => setLoading(false));
  }, []);

  // Handle free shipping min change
  const handleFreeShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFreeShippingMin(Number(e.target.value));
  };

  // Handle delivery option form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add or update delivery option
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.delay) return;
    if (editingOption) {
      setDeliveryOptions(options =>
        options.map(opt =>
          opt.id === editingOption.id
            ? { ...opt, ...form, price: Number(form.price) }
            : opt
        )
      );
      setEditingOption(null);
    } else {
      setDeliveryOptions(options => [
        ...options,
        {
          id: Date.now(),
          ...form,
          price: Number(form.price),
        },
      ]);
    }
    setForm({ name: '', price: '', delay: '', countries: '', type: '', description: '', weightRange: '' });
  };

  // Edit delivery option
  const handleEdit = (option: DeliveryOption) => {
    setEditingOption(option);
    setForm({
      name: option.name,
      price: String(option.price),
      delay: option.delay,
      countries: option.countries,
      type: option.type,
      description: option.description,
      weightRange: option.weightRange,
    });
  };

  // Delete delivery option
  const handleDelete = (id: number) => {
    setDeliveryOptions(options => options.filter(opt => opt.id !== id));
    if (editingOption?.id === id) {
      setEditingOption(null);
      setForm({ name: '', price: '', delay: '', countries: '', type: '', description: '', weightRange: '' });
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingOption(null);
    setForm({ name: '', price: '', delay: '', countries: '', type: '', description: '', weightRange: '' });
  };

  // Save to API
  const handleSave = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch('/api/vendors/me/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeShippingMin,
          options: deliveryOptions.map(({ id, ...rest }) => rest),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur serveur');
      setSuccess('Réglages sauvegardés !');
    } catch (e: any) {
      setError(e.message || 'Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  // Refresh from API
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    fetch('/api/vendors/me/shipping')
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Erreur serveur');
        return res.json();
      })
      .then(data => {
        setFreeShippingMin(data.settings?.freeShippingMin || 0);
        setDeliveryOptions((data.options || []).map((opt: any, i: number) => ({
          ...opt,
          id: opt.id || i,
          countries: opt.countries || '',
          type: opt.type || '',
          description: opt.description || '',
          weightRange: opt.weightRange || '',
        })));
      })
      .catch(e => setError(typeof e === 'string' ? e : e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
            <h1 className="text-2xl font-bold text-white">Paramètres d'expédition</h1>
            <p className="text-blue-100 mt-2">Configurez vos options de livraison pour vos clients</p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-red-500">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-green-500">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Réglages généraux</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    {saving ? 'Sauvegarde...' : <><FiSave className="h-4 w-4" /> Sauvegarder</>}
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <FiRefreshCcw className="h-4 w-4" /> Actualiser
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                <label htmlFor="freeShippingMin" className="block text-sm font-medium text-gray-700 mb-2">
                  Montant minimum pour la livraison gratuite (€)
                </label>
                <input
                  type="number"
                  id="freeShippingMin"
                  min="0"
                  className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-3 focus:ring-blue-500 focus:border-blue-500"
                  value={freeShippingMin}
                  onChange={handleFreeShippingChange}
                  disabled={loading}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Laissez à 0 pour désactiver la livraison gratuite
                </p>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Options de livraison</h2>
              
              {deliveryOptions.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500">Aucune option de livraison définie.</p>
                  <p className="text-sm text-gray-400 mt-1">Utilisez le formulaire ci-dessous pour ajouter votre première option.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <ul className="divide-y divide-gray-200">
                    {deliveryOptions.map(option => (
                      <li key={option.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-800">{option.name}</h3>
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <span className="font-medium text-blue-600">{option.price.toFixed(2)} €</span>
                              <span className="mx-2">•</span>
                              <span>{option.delay}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(option)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="Modifier"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(option.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Supprimer"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
                          {option.countries && (
                            <div className="flex items-center">
                              <span className="font-semibold mr-1">Pays:</span> {option.countries}
                            </div>
                          )}
                          {option.type && (
                            <div className="flex items-center">
                              <span className="font-semibold mr-1">Type:</span> {option.type}
                            </div>
                          )}
                          {option.weightRange && (
                            <div className="flex items-center">
                              <span className="font-semibold mr-1">Poids/Zone:</span> {option.weightRange}
                            </div>
                          )}
                        </div>
                        {option.description && (
                          <div className="mt-2 text-xs text-gray-400 italic bg-gray-50 p-2 rounded">
                            {option.description}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {editingOption ? 'Modifier une option de livraison' : 'Ajouter une option de livraison'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'option *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Ex: Colissimo, Mondial Relay..."
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.name}
                      onChange={handleFormChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (€) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.price}
                      onChange={handleFormChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="delay" className="block text-sm font-medium text-gray-700 mb-1">
                      Délais de livraison *
                    </label>
                    <input
                      type="text"
                      id="delay"
                      name="delay"
                      placeholder="Ex: 2-3 jours ouvrés"
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.delay}
                      onChange={handleFormChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="countries" className="block text-sm font-medium text-gray-700 mb-1">
                      Pays desservis
                    </label>
                    <input
                      type="text"
                      id="countries"
                      name="countries"
                      placeholder="Ex: France, Belgique"
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.countries}
                      onChange={handleFormChange}
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Type de livraison
                    </label>
                    <select
                      id="type"
                      name="type"
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.type}
                      onChange={handleFormChange}
                      disabled={loading}
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                      <option value="relais">Point relais</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="weightRange" className="block text-sm font-medium text-gray-700 mb-1">
                      Plage de poids/zone
                    </label>
                    <input
                      type="text"
                      id="weightRange"
                      name="weightRange"
                      placeholder="Ex: 0-2kg, Zone 1"
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.weightRange}
                      onChange={handleFormChange}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description personnalisée
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Informations complémentaires sur cette option de livraison"
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.description}
                    onChange={handleFormChange}
                    disabled={loading}
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                    disabled={loading}
                  >
                    {editingOption ? (
                      <><FiEdit2 className="h-4 w-4" /> Mettre à jour</>
                    ) : (
                      <><FiPlus className="h-4 w-4" /> Ajouter</>
                    )}
                  </button>
                  
                  {editingOption && (
                    <button
                      type="button"
                      className="bg-gray-100 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-200 transition-colors"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}