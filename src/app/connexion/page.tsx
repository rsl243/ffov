"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { signIn, useSession } from 'next-auth/react';
import { getStoreInfo } from '@/lib/userStore';

export default function ConnexionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, login, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Si une erreur d'authentification est présente, la montrer
  useEffect(() => {
    if (authError) {
      setError(authError.message);
    }
  }, [authError]);

  // Vérifier si l'utilisateur est déjà connecté avec NextAuth ou Supabase
  useEffect(() => {
    if (session?.user || user) {
      try {
        // Vérification simplifiée : utiliser le localStorage pour déterminer où rediriger
        const storeInfo = getStoreInfo();
        
        // Ajouter un timeout pour éviter les redirections immédiates qui peuvent causer des problèmes
        setTimeout(() => {
          if (storeInfo && storeInfo.websiteUrl) {
            console.log('Redirection vers dashboard');
            router.push('/dashboard');
          } else {
            console.log('Redirection vers onboarding');
            router.push('/onboarding');
          }
        }, 300);
      } catch (error) {
        console.error('Erreur lors de la vérification du store:', error);
        // En cas d'erreur, rediriger vers onboarding
        setTimeout(() => router.push('/onboarding'), 300);
      }
    }
  }, [user, router]);
  
  // Timer de sécurité pour éviter les pages bloquées pendant trop longtemps
  useEffect(() => {
    // Si après 5 secondes on est toujours en chargement, forcer une redirection
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        console.log('Délai de chargement dépassé, redirection forcée');
        router.push('/onboarding');
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Essayer d'abord NextAuth
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        // Si NextAuth échoue, essayer Supabase comme fallback
        try {
          await login(email, password);
          // Si nous arrivons ici, c'est que la connexion Supabase a réussi
        } catch (supabaseErr) {
          setError('Identifiants incorrects. Veuillez réessayer.');
          console.error('Erreur de connexion Supabase:', supabaseErr);
        }
      }
      // La redirection sera gérée par le useEffect qui détecte le changement d'état de user
    } catch (err) {
      setError('Identifiants incorrects. Veuillez réessayer.');
      console.error('Erreur de connexion NextAuth:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Si l'utilisateur est déjà connecté, afficher un indicateur de chargement
  if (status === 'loading' || authLoading || session?.user || user) {
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
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="text-black font-bold text-3xl">
              <span className="text-gradient">Faet</span>
              <div className="text-xs font-light mt-1 text-black">GAGNEZ EN PHYGITAL</div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 backdrop-blur-sm">
          <h1 className="text-2xl font-bold mb-6 text-center text-black">Connexion</h1>
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
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
                className="w-full px-4 py-3 rounded-md bg-white border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-black">
                  Mot de passe
                </label>
                <Link href="/mot-de-passe-oublie" className="text-sm text-[var(--primary-color)] hover:underline">
                  Mot de passe oublié?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-white border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] border-gray-300 rounded bg-white"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-black">
                Se souvenir de moi
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || authLoading}
                className="w-full btn-primary flex justify-center py-3 px-4"
              >
                {loading || authLoading ? 'CONNEXION EN COURS...' : 'SE CONNECTER'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-black">Vous n'avez pas de compte? </span>
            <Link href="/inscription" className="text-[var(--primary-color)] hover:underline">
              Inscrivez-vous
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