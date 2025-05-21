"use client";

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
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
          <h1 className="text-2xl font-bold mb-6 text-center text-black">Mot de passe oublié</h1>
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="text-center">
              <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-800 px-4 py-3 rounded mb-4">
                Un email de réinitialisation a été envoyé à {email}. Veuillez vérifier votre boîte de réception.
              </div>
              <Link href="/connexion" className="text-[var(--primary-color)] hover:underline">
                Retour à la page de connexion
              </Link>
            </div>
          ) : (
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
                  placeholder="Entrez votre adresse email"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex justify-center py-3 px-4"
                >
                  {loading ? 'ENVOI EN COURS...' : 'RÉINITIALISER MOT DE PASSE'}
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
