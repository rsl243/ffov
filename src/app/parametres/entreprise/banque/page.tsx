"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiCheck, FiInfo, FiSave } from 'react-icons/fi';
import { getStoreInfo } from '@/lib/userStore';

// Interface pour les informations bancaires
interface BankInfo {
  accountHolder: string;
  iban: string;
  bic: string;
  bankName: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | null;
}

export default function BankInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoStatus, setInfoStatus] = useState<'draft' | 'pending' | 'validated'>('draft');
  
  // État pour les données du formulaire
  const [formData, setFormData] = useState<BankInfo>({
    accountHolder: '',
    iban: '',
    bic: '',
    bankName: '',
    verificationStatus: null
  });

  // Charger les données existantes au chargement de la page
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données de l'entreprise depuis l'API
        const response = await fetch('/api/vendors/bank-info');
        
        if (response.ok) {
          const data = await response.json();
          
          // Déterminer le statut des informations
          if (data.status) {
            setInfoStatus(data.status);
          } else if (data.submittedAt) {
            setInfoStatus('pending');
          }
          
          if (data.bankInfo) {
            // Pré-remplir les données du formulaire avec les informations existantes
            setFormData({
              accountHolder: data.bankInfo.accountHolder || '',
              iban: data.bankInfo.iban || '',
              bic: data.bankInfo.bic || '',
              bankName: data.bankInfo.bankName || '',
              verificationStatus: data.bankInfo.verificationStatus
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadExistingData();
  }, []);

  // Gérer les changements dans le formulaire
  const handleInputChange = (field: keyof BankInfo, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  // Formater un IBAN pour l'affichage
  const formatIBAN = (iban: string) => {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  // Valider le formulaire
  const validateForm = (): boolean => {
    setFormError(null);
    
    const requiredFields: (keyof BankInfo)[] = [
      'accountHolder', 'iban', 'bic', 'bankName'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setFormError('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    
    // Validation simple de l'IBAN (format basique)
    if (formData.iban && !/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(formData.iban.replace(/\s/g, ''))) {
      setFormError('Le format de l\'IBAN est invalide');
      return false;
    }
    
    // Validation simple du BIC (format basique)
    if (formData.bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(formData.bic.replace(/\s/g, ''))) {
      setFormError('Le format du BIC est invalide');
      return false;
    }
    
    return true;
  };

  // Soumettre le formulaire à l'administrateur pour validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Envoyer les données au serveur avec le statut "en attente de validation"
      const response = await fetch('/api/vendors/submit-bank-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          status: 'pending',
          submittedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi des données');
      }
      
      // Mettre à jour le statut local
      setInfoStatus('pending');
      setSuccessMessage('Informations bancaires envoyées avec succès à l\'administrateur pour validation');
      setFormSubmitted(true);
      
      // Masquer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      setFormError('Une erreur est survenue lors de l\'envoi de vos informations. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  // Obtenir le texte du bouton en fonction du statut
  const getButtonText = () => {
    switch (infoStatus) {
      case 'draft':
        return 'Envoyer';
      case 'pending':
        return 'En attente de validation';
      case 'validated':
        return 'Validé';
      default:
        return 'Envoyer';
    }
  };

  // Obtenir le statut de vérification
  const getVerificationStatus = () => {
    if (!formData.verificationStatus) return 'Non vérifié';
    
    switch (formData.verificationStatus) {
      case 'pending':
        return 'En cours de vérification';
      case 'verified':
        return 'Vérifié';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'Non vérifié';
    }
  };

  // Obtenir la couleur du statut de vérification
  const getVerificationStatusColor = () => {
    if (!formData.verificationStatus) return 'text-gray-500';
    
    switch (formData.verificationStatus) {
      case 'pending':
        return 'text-yellow-600';
      case 'verified':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/parametres/entreprise" className="mr-4 text-gray-500 hover:text-gray-700">
          <FiArrowLeft className="text-xl" />
        </Link>
        <h1 className="text-2xl font-semibold">Informations bancaires</h1>
      </div>
      
      {formError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-center items-center h-40">
          <p className="text-gray-500">Chargement de vos informations...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-medium">Coordonnées bancaires</h2>
              <div className={`flex items-center ${getVerificationStatusColor()}`}>
                <FiInfo className="mr-1" />
                <span>Statut: {getVerificationStatus()}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700 mb-1">
                  Titulaire du compte <span className="text-red-500">*</span>
                </label>
                <input
                  id="accountHolder"
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={infoStatus === 'pending' || infoStatus === 'validated'}
                />
              </div>
              
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la banque <span className="text-red-500">*</span>
                </label>
                <input
                  id="bankName"
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={infoStatus === 'pending' || infoStatus === 'validated'}
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-1">
                  IBAN <span className="text-red-500">*</span>
                </label>
                <input
                  id="iban"
                  type="text"
                  value={formData.iban}
                  onChange={(e) => handleInputChange('iban', e.target.value.toUpperCase().replace(/\s/g, ''))}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="FR76XXXXXXXXXXXXXXXXXX"
                  required
                  disabled={infoStatus === 'pending' || infoStatus === 'validated'}
                />
                {formData.iban && (
                  <p className="text-sm text-gray-500 mt-1">
                    Format: {formatIBAN(formData.iban)}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="bic" className="block text-sm font-medium text-gray-700 mb-1">
                  BIC / SWIFT <span className="text-red-500">*</span>
                </label>
                <input
                  id="bic"
                  type="text"
                  value={formData.bic}
                  onChange={(e) => handleInputChange('bic', e.target.value.toUpperCase().replace(/\s/g, ''))}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="BNPAFRPPXXX"
                  required
                  disabled={infoStatus === 'pending' || infoStatus === 'validated'}
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-sm text-blue-700">
                <FiInfo className="inline-block mr-2" />
                Vos informations bancaires seront vérifiées par notre équipe avant d'être validées. 
                Un relevé d'identité bancaire (RIB) sera nécessaire pour compléter la vérification.
              </p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading || infoStatus === 'pending' || infoStatus === 'validated'}
                className={`flex items-center px-6 py-2 rounded-md ${loading || infoStatus === 'pending' || infoStatus === 'validated' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                {loading ? 'Envoi en cours...' : getButtonText()}
                {!loading && infoStatus === 'draft' && <FiSave className="ml-2" />}
                {!loading && infoStatus === 'validated' && <FiCheck className="ml-2" />}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
