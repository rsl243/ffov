"use client";

import React from 'react';

interface MoreInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoreInfo({ isOpen, onClose }: MoreInfoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-[var(--background-color)] border border-[#444] max-w-3xl w-full p-8 rounded-lg relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-[#ffa500]">FAET : La Marketplace Phygitale Qui Valorise Votre Commerce Local</h2>
          
          <p className="text-white">
            Chez FAET, nous croyons en la richesse et l'importance des commerces de proximité. Notre application phygiplace est conçue pour mettre en avant les boutiques locales et permettre aux consommateurs de privilégier les achats dans leur ville.
          </p>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Comment ça fonctionne ?</h3>
            <p className="text-white">
              Lorsqu'un utilisateur recherche un produit, les premiers résultats affichés sont ceux des commerçants de sa ville. L'objectif est de faciliter l'accès aux offres locales et d'encourager une consommation responsable.
            </p>
            <p className="text-white">
              Les clients peuvent acheter en ligne et venir récupérer leurs produits directement en boutique. Plus besoin de commander des articles provenant de villes lointaines, FAET favorise l'économie locale et renforce le lien entre commerçants et consommateurs.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Pourquoi rejoindre FAET ?</h3>
            <ul className="list-disc pl-5 space-y-2 text-white">
              <li><span className="font-medium">Visibilité Locale Maximisée :</span> Vos produits seront mis en avant auprès des consommateurs de votre ville.</li>
              <li><span className="font-medium">Un Pont Entre Le Numérique et le Physique :</span> Profitez d'une plateforme moderne sans perdre le contact humain.</li>
              <li><span className="font-medium">Engagement Pour Le Commerce Responsable :</span> Ensemble, faisons de la proximité une force.</li>
            </ul>
          </div>
          
          <div className="flex justify-center pt-4">
            <button 
              onClick={onClose} 
              className="bg-[#ffa500] hover:bg-[#e69500] text-black px-8 py-3 uppercase font-medium tracking-wider"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 