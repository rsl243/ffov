"use client";

import React, { useState, useEffect } from 'react';
import { FiCheck, FiInfo, FiAlertTriangle, FiCreditCard, FiArrowRight } from 'react-icons/fi';
import { BsCheckCircleFill } from 'react-icons/bs';
import { pricingPlans, SubscriptionPlan, PlanInfo, updateUserPlan } from '@/lib/userPlan';
import { getCurrentUser, updateUserSubscriptionPlan } from '@/lib/authUtils';
import { useUserProfile } from '@/contexts/UserProfileContext';

// Interface pour les plans tarifaires est importée depuis @/lib/userPlan

// Interface pour l'historique des factures
interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  downloadUrl: string;
}

export default function FacturationPage() {
  // Utiliser le contexte de profil utilisateur pour obtenir le forfait actuel
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('ville');
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('ville');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  // Les plans tarifaires sont importés depuis @/lib/userPlan

  // Charger le plan actuel et l'historique des factures
  useEffect(() => {
    const loadCurrentPlan = async () => {
      try {
        // Utiliser le forfait du profil utilisateur si disponible
        if (profile && profile.selectedPlan) {
          setCurrentPlan(profile.selectedPlan);
          setSelectedPlan(profile.selectedPlan);
        } else {
          // Fallback : récupérer le plan depuis le localStorage
          const user = getCurrentUser();
          if (user && user.selectedPlan) {
            setCurrentPlan(user.selectedPlan);
            setSelectedPlan(user.selectedPlan);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du plan actuel:', error);
      }
    };

    const loadInvoices = async () => {
      try {
        // Simuler un appel API pour récupérer l'historique des factures
        // Dans une implémentation réelle, vous feriez un appel à votre API
        // const response = await fetch('/api/vendors/invoices');
        // const data = await response.json();
        // setInvoices(data.invoices);
        
        // Simulation
        setTimeout(() => {
          setInvoices([
            {
              id: 'INV-2025-001',
              date: '2025-04-01',
              amount: 10,
              status: 'paid',
              downloadUrl: '#'
            },
            {
              id: 'INV-2025-002',
              date: '2025-05-01',
              amount: 10,
              status: 'paid',
              downloadUrl: '#'
            }
          ]);
        }, 500);
      } catch (error) {
        console.error('Erreur lors du chargement des factures:', error);
      }
    };

    loadCurrentPlan();
    loadInvoices();
  }, []);

  // Gérer le changement de plan
  const handlePlanChange = (planId: SubscriptionPlan) => {
    if (planId === currentPlan) {
      setErrorMessage('Vous êtes déjà abonné à ce plan.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    setSelectedPlan(planId);
    setShowConfirmation(true);
  };

  // Confirmer le changement de plan
  const handleConfirmPlanChange = async () => {
    if (selectedPlan === currentPlan) {
      setErrorMessage('Vous êtes déjà abonné à ce plan.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      // Mettre à jour le plan via le profil utilisateur (méthode centralisée)
      await updateProfile({ selectedPlan });
      
      // Mettre à jour aussi dans le localStorage pour la compatibilité avec l'ancien système
      updateUserSubscriptionPlan(selectedPlan);
      
      // Mettre à jour le plan actuel avec le plan sélectionné
      setCurrentPlan(selectedPlan);
      
      // Fermer la boîte de dialogue de confirmation
      setShowConfirmation(false);
      
      // Afficher un message de succès
      const newPlanName = pricingPlans[selectedPlan].name;
      setSuccessMessage(`Félicitations ! Votre abonnement a été mis à jour avec succès vers l'offre ${newPlanName}.`);
      
      // Masquer le message de succès après 5 secondes
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Erreur lors du changement de plan:', error);
      setErrorMessage('Une erreur est survenue lors du changement de plan. Veuillez réessayer.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Obtenir la couleur du statut de la facture
  const getInvoiceStatusColor = (status: 'paid' | 'pending' | 'overdue') => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'overdue':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Obtenir le texte du statut de la facture
  const getInvoiceStatusText = (status: 'paid' | 'pending' | 'overdue') => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'pending':
        return 'En attente';
      case 'overdue':
        return 'En retard';
      default:
        return 'Inconnu';
    }
  };
  
  // Formater le numéro de carte
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Formater la date d'expiration
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return value;
  };
  
  // Gérer l'ajout d'une carte bancaire
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (cardNumber.replace(/\s+/g, '').length < 16) {
      setErrorMessage('Le numéro de carte doit comporter 16 chiffres.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    if (cardHolder.trim() === '') {
      setErrorMessage('Veuillez saisir le nom du titulaire de la carte.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    if (expiryDate.length < 5) {
      setErrorMessage('Veuillez saisir une date d\'expiration valide (MM/AA).');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    if (cvv.length < 3) {
      setErrorMessage('Le code de sécurité (CVV) doit comporter 3 chiffres.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    setPaymentLoading(true);
    
    try {
      // Simuler un appel API pour ajouter la carte
      console.log('Ajout d\'une nouvelle carte bancaire');
      
      // Simulation d'un appel API avec un délai
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Masquer la boîte de dialogue
      setShowPaymentModal(false);
      
      // Réinitialiser les champs
      setCardNumber('');
      setCardHolder('');
      setExpiryDate('');
      setCvv('');
      
      // Mettre à jour l'état pour indiquer qu'une méthode de paiement a été ajoutée
      setHasPaymentMethod(true);
      
      // Afficher un message de succès
      setSuccessMessage('Votre carte bancaire a été ajoutée avec succès.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la carte:', error);
      setErrorMessage('Une erreur est survenue lors de l\'ajout de votre carte. Veuillez réessayer.');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold mb-6">Facturation et abonnement</h1>
      
      {errorMessage && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium mb-4">Votre abonnement actuel</h2>
        
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <p className="text-sm text-blue-700 flex items-center">
            <FiInfo className="mr-2" />
            Vous êtes actuellement abonné à l'offre <strong className="ml-1">{pricingPlans[currentPlan].name}</strong>.
            Votre prochain paiement sera prélevé le 1er juin 2025.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(pricingPlans).map((plan: PlanInfo) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-3xl overflow-hidden shadow-md ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                
                <div className={`py-4 -mx-6 mb-6 ${plan.id === 'ville' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : plan.id === 'region' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-teal-400 to-green-500'}`}>
                  <p className="text-3xl font-bold text-white">{plan.price} HT€</p>
                </div>
                
                <div className="text-center mb-6">
                  <p className="text-gray-700 font-medium">Commissions</p>
                  <p className="text-sm text-gray-600">{plan.commissionDetails}</p>
                </div>
                
                <ul className="text-left space-y-3 mb-6">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block rounded-full bg-black w-2 h-2 mt-1.5 mr-3 flex-shrink-0"></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                  
                  {plan.limitations.map((limitation: string, index: number) => (
                    <li key={`limit-${index}`} className="flex items-start">
                      <span className="inline-block rounded-full bg-black w-2 h-2 mt-1.5 mr-3 flex-shrink-0"></span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                  
                  {plan.advantages.map((advantage: string, index: number) => (
                    <li key={`adv-${index}`} className="flex items-start">
                      <span className="inline-block rounded-full bg-black w-2 h-2 mt-1.5 mr-3 flex-shrink-0"></span>
                      <span>{advantage}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  type="button"
                  onClick={() => handlePlanChange(plan.id)}
                  className={`w-full py-3 rounded-md text-base font-medium ${plan.id === 'ville' ? 'bg-blue-600 hover:bg-blue-700' : plan.id === 'region' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors shadow-md`}
                >
                  {currentPlan === plan.id ? 'Plan actuel' : 'Choisir ce plan'}
                </button>
              </div>
            </div>
          ))}
        </div>
        

      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium mb-4">Historique des factures</h2>
        
        {invoices.length === 0 ? (
          <p className="text-gray-500">Aucune facture disponible pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.amount} €</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`${getInvoiceStatusColor(invoice.status)}`}>
                        {getInvoiceStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      <a href={invoice.downloadUrl} className="text-blue-600 hover:text-blue-800">Télécharger</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4">Moyens de paiement</h2>
        
        {!hasPaymentMethod ? (
          <>
            <div className="bg-yellow-50 p-4 rounded-md mb-6">
              <p className="text-sm text-yellow-700 flex items-center">
                <FiAlertTriangle className="mr-2" />
                Vous n'avez pas encore ajouté de moyen de paiement. Veuillez ajouter une carte bancaire pour assurer la continuité de votre abonnement.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FiCreditCard className="mr-2" />
              Ajouter une carte bancaire
            </button>
          </>
        ) : (
          <>
            <div className="bg-green-50 p-4 rounded-md mb-6">
              <p className="text-sm text-green-700 flex items-center">
                <FiCheck className="mr-2" />
                Votre moyen de paiement est configuré. Votre abonnement sera automatiquement renouvelé chaque mois.
              </p>
            </div>
            
            <div className="border rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-md mr-4">
                  <FiCreditCard className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="font-medium">Carte bancaire</p>
                  <p className="text-sm text-gray-500">**** **** **** {cardNumber.replace(/\s+/g, '').slice(-4)}</p>
                  <p className="text-xs text-gray-500">Expire le {expiryDate}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Modifier
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Modal d'ajout de carte bancaire */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Ajouter une carte bancaire</h3>
            
            <form onSubmit={handleAddPaymentMethod}>
              <div className="mb-4">
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Numéro de carte</label>
                <input
                  type="text"
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700 mb-1">Titulaire de la carte</label>
                <input
                  type="text"
                  id="cardHolder"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="JEAN DUPONT"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                  <input
                    type="text"
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">Code de sécurité (CVV)</label>
                  <input
                    type="text"
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123"
                    maxLength={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="text-sm text-gray-600 flex items-center">
                  <FiInfo className="mr-2 text-blue-500" />
                  Vos informations de paiement sont sécurisées. Nous ne stockons pas les détails de votre carte sur nos serveurs.
                </p>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
                
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="px-5 py-2.5 bg-blue-600 rounded-md text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {paymentLoading ? 'Traitement en cours...' : 'Ajouter la carte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de confirmation */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirmer le changement d'abonnement</h3>
            
            <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-200">
              <p className="text-gray-700">
                Vous êtes sur le point de passer de l'offre <strong className="text-blue-700">{pricingPlans[currentPlan].name}</strong> à l'offre <strong className="text-blue-700">{pricingPlans[selectedPlan].name}</strong>.
                
                {Number(pricingPlans[selectedPlan].price) > Number(pricingPlans[currentPlan].price) ? (
                  <span className="block mt-2 font-medium">
                    Le montant supplémentaire de {Number(pricingPlans[selectedPlan].price) - Number(pricingPlans[currentPlan].price)} € sera prélevé immédiatement.
                  </span>
                ) : (
                  <span className="block mt-2 font-medium">
                    Le changement prendra effet à partir de votre prochaine période de facturation.
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              
              <button
                type="button"
                onClick={handleConfirmPlanChange}
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 rounded-md text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Traitement en cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}