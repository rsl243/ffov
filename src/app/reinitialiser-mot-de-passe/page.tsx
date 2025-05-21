"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a un hash de réinitialisation valide
    const checkResetToken = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setError("Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.");
      }
    };

    checkResetToken();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    // Vérifier la complexité du mot de passe
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push('/connexion');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold mb-6 text-center text-black">Réinitialiser votre mot de passe</h1>
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="text-center">
              <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-800 px-4 py-3 rounded mb-4">
                Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
              </div>
              <Link href="/connexion" className="text-[var(--primary-color)] hover:underline">
                Aller à la page de connexion
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-white border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                  placeholder="Entrez votre nouveau mot de passe"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-white border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex justify-center py-3 px-4"
                >
                  {loading ? 'RÉINITIALISATION EN COURS...' : 'RÉINITIALISER MOT DE PASSE'}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <Link href="/connexion" className="text-[var(--primary-color)] hover:underline text-sm">
                  Retour à la page de connexion
                </Link>
              </div>
            </form>
          )}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Faet. Tous droits réservés.</p>
        </div>
      </div>
    </main>
  );
}
