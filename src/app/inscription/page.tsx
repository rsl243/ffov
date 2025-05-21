'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { SubscriptionPlan } from '@/lib/userPlan';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function InscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading, register, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [step, setStep] = useState<'plan' | 'info'>('plan');

  // Récupérer le plan sélectionné depuis l'URL et rediriger si déjà connecté
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (user) {
      router.push('/dashboard');
    }
    
    // Récupérer le plan depuis l'URL
    const searchParams = new URLSearchParams(window.location.search);
    const planParam = searchParams.get('plan');
    
    if (planParam === 'ville' || planParam === 'region' || planParam === 'pays') {
      setSelectedPlan(planParam);
    }
  }, [user, router]);

  const handlePlanSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Vérifier qu'une offre est sélectionnée
    if (selectedPlan) {
      setStep('info');
    } else {
      setError('Veuillez sélectionner une offre pour continuer.');
    }
  };

  const handleInfoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation des champs
    if (!firstName || !lastName || !email || !password || !selectedPlan || !termsAccepted) {
      setError('Veuillez remplir tous les champs obligatoires et accepter les conditions d\'utilisation.');
      return;
    }
    
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Méthode alternative: Utiliser directement Supabase sans passer par le contexte d'authentification
      const { supabase } = await import('@/lib/supabase');
      
      // Validation des adresses email supprimée - toutes les adresses valides sont acceptées
      
      // Inscription directe avec Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            selected_plan: selectedPlan
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Si l'inscription a réussi
      if (data.user) {
        // Enregistrer les données dans localStorage pour compatibilité
        const userData = {
          id: data.user.id,
          fullName: `${firstName} ${lastName}`,
          email: data.user.email,
          selectedPlan
        };
        localStorage.setItem('faet_user', JSON.stringify(userData));
        
        // Rediriger vers la page d'onboarding après inscription réussie
        router.push('/onboarding');
      } else {
        setError("L'inscription a échoué. Veuillez réessayer.");
      }
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      setError(error.message || "Une erreur s'est produite lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };
  
  const handleBack = () => {
    setStep('plan');
  };

  // Si l'utilisateur est déjà connecté, afficher un indicateur de chargement
  if (authLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white relative">
      
      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="text-black font-bold text-3xl">
              <span className="text-gradient">Faet</span>
              <div className="text-xs font-light mt-1 text-gray-600">GAGNEZ EN PHYGITAL</div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 backdrop-blur-sm bg-opacity-90">
          <h1 className="text-2xl font-bold mb-2 text-center text-black">Inscription</h1>
          <p className="text-center text-gray-600 mb-8">Rejoignez Faet pour profiter de tous nos services</p>
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          


          {/* Étape 1: Informations personnelles */}
          {step === 'info' && (
            <form onSubmit={handleInfoSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Prénom
                  </label>
                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white border border-gray-300 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Nom
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-md bg-white border border-gray-300 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-white border border-gray-300 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-white border border-gray-300 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                />
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Le mot de passe doit contenir au moins 8 caractères</p>
              </div>



              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] border-gray-300 rounded bg-white"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-[var(--text-primary)]">
                  J'accepte les <Link href="#" className="text-[var(--primary-color)] hover:underline">conditions d'utilisation</Link>
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-[var(--text-primary)] hover:bg-gray-100 transition-colors"
                >
                  RETOUR
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary flex justify-center py-3 px-4"
                >
                  FINALISER L'INSCRIPTION
                </button>
              </div>
            </form>
          )}
          
          {/* Étape 2: Choix du plan */}
          {step === 'plan' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Choisissez votre offre</h2>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Sélectionnez l'offre qui correspond le mieux à vos besoins</p>
              </div>
              
              <div className="space-y-4">
                {/* Plan VILLE */}
                <div 
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${selectedPlan === 'ville' ? 'border-[var(--primary-color)] bg-white shadow-md' : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={() => handleSelectPlan('ville')}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">VILLE</h3>
                    <span className="text-xl font-bold text-[var(--text-primary)]">10€ <span className="text-sm font-normal text-[var(--text-secondary)]">HT/mois</span></span>
                  </div>
                  <ul className="space-y-2 text-sm text-[var(--text-secondary)] mb-3">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Commission de 1.5% HT par vente</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Limité à 3 boutiques</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Compte partagé</span>
                    </li>
                  </ul>
                </div>
                
                {/* Plan RÉGION */}
                <div 
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${selectedPlan === 'region' ? 'border-[var(--primary-color)] bg-white shadow-md' : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={() => handleSelectPlan('region')}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">RÉGION</h3>
                    <span className="text-xl font-bold text-[var(--text-primary)]">35€ <span className="text-sm font-normal text-[var(--text-secondary)]">HT/mois</span></span>
                  </div>
                  <ul className="space-y-2 text-sm text-[var(--text-secondary)] mb-3">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Commission de 2.5% HT à partir de 5000€ de CA par mois</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Limité à une seule région géographique</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Boutiques illimitées dans la région choisie</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Gestion hiérarchique des comptes</span>
                    </li>
                  </ul>
                </div>
                
                {/* Plan PAYS */}
                <div 
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${selectedPlan === 'pays' ? 'border-[var(--primary-color)] bg-white shadow-md' : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={() => handleSelectPlan('pays')}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">PAYS</h3>
                    <span className="text-xl font-bold text-[var(--text-primary)]">100€ <span className="text-sm font-normal text-[var(--text-secondary)]">HT/mois</span></span>
                  </div>
                  <ul className="space-y-2 text-sm text-[var(--text-secondary)] mb-3">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Commission de 2.5% HT par vente</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Boutiques illimitées dans tout le pays</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Gestion hiérarchique complète (siège, régions, boutiques)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Centralisation nationale des données</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Marketing avancé</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handlePlanSubmit}
                  disabled={!selectedPlan || loading}
                  className="w-full btn-primary py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'EN COURS...' : 'CONTINUER'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">Vous avez déjà un compte? </span>
            <Link href="/connexion" className="text-[var(--primary-color)] hover:underline">
              Connectez-vous
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Faet. Tous droits réservés.</p>
        </div>
      </div>
    </main>
  ); 
} 