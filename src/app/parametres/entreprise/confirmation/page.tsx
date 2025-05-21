import React from 'react';
import Link from 'next/link';
import { FiCheckCircle } from 'react-icons/fi';

export default function ConfirmationPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <FiCheckCircle className="text-green-600 text-4xl" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Informations soumises avec succès</h1>
        
        <p className="text-gray-600 mb-6">
          Nous avons bien reçu les informations de votre entreprise. Notre équipe va maintenant 
          procéder à leur vérification. Ce processus peut prendre jusqu'à 24-48 heures ouvrées.
          Vous recevrez une notification dès que vos informations auront été validées.
        </p>
        
        <p className="text-gray-600 mb-8">
          En attendant, vous pouvez continuer à utiliser nos services pendant votre période d'essai.
        </p>
        
        <div className="flex justify-center">
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
} 