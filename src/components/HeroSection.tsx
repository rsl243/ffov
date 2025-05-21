"use client";

import Image from 'next/image';
import { useState } from 'react';
import MoreInfo from './MoreInfo';

export default function HeroSection() {
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  return (
    <section className="min-h-screen pt-20 relative overflow-hidden">
      {/* Bannière principale */}
      <div className="container mx-auto px-6 mb-16">
        <div className="py-16 px-8 rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] shadow-xl border border-[#2a2a4a]">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-[#4cc9f0] to-[#4361ee]">
              Développez votre commerce avec <span className="text-[#f72585] font-extrabold">Faet</span>
            </h1>
            
            <div className="space-y-4 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <h2 className="text-2xl font-semibold uppercase text-white">LA MARKETPLACE PHYGITALE</h2>
              <p className="text-lg text-gray-200 max-w-2xl mx-auto">
                Valorisez votre commerce local en combinant le meilleur des mondes numérique et physique.
                Offrez une expérience d'achat unique à vos clients.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in pt-4" style={{animationDelay: '0.4s'}}>
              <a 
                href="/inscription"
                className="bg-[#f72585] hover:bg-[#b5179e] text-white px-8 py-4 rounded-full uppercase font-medium tracking-wider shadow-lg transform transition-all hover:scale-105"
              >
                CHOISIR UNE OFFRE
              </a>
              <button 
                onClick={() => setMoreInfoOpen(true)}
                className="bg-transparent hover:bg-white/10 text-white border-2 border-[#4cc9f0] px-8 py-4 rounded-full uppercase font-medium tracking-wider transition-all hover:border-[#4361ee]" 
              >
                PLUS D'INFORMATIONS
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Section des offres tarifaires */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#4cc9f0] to-[#4361ee]">Nos offres adaptées à vos besoins</h2>
          <p className="text-gray-300 max-w-3xl mx-auto">Choisissez l'offre qui correspond le mieux à la taille et aux ambitions de votre commerce.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Offre VILLE */}
          <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border border-[#2a2a4a] rounded-xl p-8 hover:shadow-[0_0_20px_rgba(76,201,240,0.3)] hover:border-[#4cc9f0] transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4cc9f0]/20 flex items-center justify-center">
                <span className="text-[#4cc9f0] text-2xl font-bold">V</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">VILLE</h3>
              <div className="text-3xl font-bold text-[#4cc9f0] mb-1">10€ <span className="text-sm font-normal text-gray-400">HT/mois</span></div>
              <p className="text-gray-400">Idéal pour les petits commerces</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <span className="text-[#4cc9f0] mr-2">✓</span>
                <span className="text-gray-200">Commission de 1.5% HT par vente</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#4cc9f0] mr-2">✓</span>
                <span className="text-gray-200">Limité à 3 boutiques</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#4cc9f0] mr-2">✓</span>
                <span className="text-gray-200">Compte partagé</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#4cc9f0] mr-2">✓</span>
                <span className="text-gray-200">Tableau de bord de ventes</span>
              </li>
            </ul>
            
            <div className="text-center">
              <a href="/inscription?plan=ville" className="inline-block bg-transparent hover:bg-[#4cc9f0] text-[#4cc9f0] hover:text-[#16213e] border-2 border-[#4cc9f0] px-6 py-3 rounded-full transition-colors font-medium">
                Choisir ce plan
              </a>
            </div>
          </div>
          
          {/* Offre RÉGION */}
          <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border-2 border-[#f72585] rounded-xl p-8 shadow-[0_0_30px_rgba(247,37,133,0.2)] transform scale-105 z-10">
            <div className="absolute top-0 right-0 bg-[#f72585] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg uppercase">Populaire</div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f72585]/20 flex items-center justify-center">
                <span className="text-[#f72585] text-2xl font-bold">R</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">RÉGION</h3>
              <div className="text-3xl font-bold text-[#f72585] mb-1">35€ <span className="text-sm font-normal text-gray-400">HT/mois</span></div>
              <p className="text-gray-400">Pour les commerces en expansion</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <span className="text-[#f72585] mr-2">✓</span>
                <span className="text-gray-200">Commission de 2.5% HT à partir de 5000€ de CA par mois</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#f72585] mr-2">✓</span>
                <span className="text-gray-200">Limité à une seule région géographique</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#f72585] mr-2">✓</span>
                <span className="text-gray-200">Boutiques illimitées dans la région choisie</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#f72585] mr-2">✓</span>
                <span className="text-gray-200">Gestion hiérarchique des comptes</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#f72585] mr-2">✓</span>
                <span className="text-gray-200">Centralisation des données</span>
              </li>
            </ul>
            
            <div className="text-center">
              <a href="/inscription?plan=region" className="inline-block bg-[#f72585] hover:bg-[#b5179e] text-white px-6 py-3 rounded-full transition-colors shadow-lg font-medium">
                Choisir ce plan
              </a>
            </div>
          </div>
          
          {/* Offre PAYS */}
          <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border border-[#2a2a4a] rounded-xl p-8 hover:shadow-[0_0_20px_rgba(67,97,238,0.3)] hover:border-[#4361ee] transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4361ee]/20 flex items-center justify-center">
                <span className="text-[#4361ee] text-2xl font-bold">P</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">PAYS</h3>
              <div className="text-3xl font-bold text-[#4361ee] mb-1">100€ <span className="text-sm font-normal text-gray-400">HT/mois</span></div>
              <p className="text-gray-400">Pour les grandes enseignes</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <span className="text-[#4361ee] mr-2">✓</span>
                <span className="text-gray-200">Commission de 2.5% HT par vente</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#4361ee] mr-2">✓</span>
                <span className="text-gray-200">Boutiques illimitées dans tout le pays</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#4361ee] mr-2">✓</span>
                <span className="text-gray-200">Gestion hiérarchique complète</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#4361ee] mr-2">✓</span>
                <span className="text-gray-200">Centralisation nationale des données</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#4361ee] mr-2">✓</span>
                <span className="text-gray-200">Marketing avancé</span>
              </li>
            </ul>
            
            <div className="text-center">
              <a href="/inscription?plan=pays" className="inline-block bg-transparent hover:bg-[#4361ee] text-[#4361ee] hover:text-white border-2 border-[#4361ee] px-6 py-3 rounded-full transition-colors font-medium">
                Choisir ce plan
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Section des fonctionnalités clés */}
      <div className="container mx-auto px-6 py-20 bg-gradient-to-b from-[#1a1a2e] to-[#0f3460] rounded-2xl shadow-xl border border-[#2a2a4a] my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#f72585] to-[#4cc9f0]">Fonctionnalités clés</h2>
          <p className="text-gray-200 max-w-3xl mx-auto text-lg">Découvrez les outils puissants qui vous aideront à développer votre activité</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Fonctionnalité 1 */}
          <div className="bg-[#16213e]/70 p-8 rounded-xl border border-[#2a2a4a] hover:border-[#4cc9f0] hover:shadow-[0_0_15px_rgba(76,201,240,0.3)] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] rounded-2xl flex items-center justify-center mb-6 mx-auto transform rotate-12 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-3 text-white">Tableau de bord</h3>
            <p className="text-gray-200 text-center">Suivez vos ventes, visiteurs et performances en temps réel avec un tableau de bord intuitif.</p>
          </div>
          
          {/* Fonctionnalité 2 */}
          <div className="bg-[#16213e]/70 p-8 rounded-xl border border-[#2a2a4a] hover:border-[#f72585] hover:shadow-[0_0_15px_rgba(247,37,133,0.3)] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-[#f72585] to-[#b5179e] rounded-2xl flex items-center justify-center mb-6 mx-auto transform -rotate-12 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-3 text-white">Gestion des clients</h3>
            <p className="text-gray-200 text-center">Gérez votre base de clients et envoyez des offres promotionnelles personnalisées.</p>
          </div>
          
          {/* Fonctionnalité 3 */}
          <div className="bg-[#16213e]/70 p-8 rounded-xl border border-[#2a2a4a] hover:border-[#4361ee] hover:shadow-[0_0_15px_rgba(67,97,238,0.3)] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-2xl flex items-center justify-center mb-6 mx-auto transform rotate-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-3 text-white">Marketing ciblé</h3>
            <p className="text-gray-200 text-center">Créez des campagnes marketing efficaces pour attirer de nouveaux clients.</p>
          </div>
          
          {/* Fonctionnalité 4 */}
          <div className="bg-[#16213e]/70 p-8 rounded-xl border border-[#2a2a4a] hover:border-[#4cc9f0] hover:shadow-[0_0_15px_rgba(76,201,240,0.3)] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] rounded-2xl flex items-center justify-center mb-6 mx-auto transform -rotate-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-3 text-white">Gestion des commandes</h3>
            <p className="text-gray-200 text-center">Suivez et gérez facilement toutes vos commandes en ligne et en magasin.</p>
          </div>
          
          {/* Fonctionnalité 5 */}
          <div className="bg-[#16213e]/70 p-8 rounded-xl border border-[#2a2a4a] hover:border-[#f72585] hover:shadow-[0_0_15px_rgba(247,37,133,0.3)] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-[#f72585] to-[#b5179e] rounded-2xl flex items-center justify-center mb-6 mx-auto transform rotate-12 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-3 text-white">Gestion des emplacements</h3>
            <p className="text-gray-200 text-center">Gérez plusieurs points de vente depuis une interface centralisée.</p>
          </div>
          
          {/* Fonctionnalité 6 */}
          <div className="bg-[#16213e]/70 p-8 rounded-xl border border-[#2a2a4a] hover:border-[#4361ee] hover:shadow-[0_0_15px_rgba(67,97,238,0.3)] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-2xl flex items-center justify-center mb-6 mx-auto transform -rotate-12 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-3 text-white">Analyses détaillées</h3>
            <p className="text-gray-200 text-center">Obtenez des insights précieux sur vos performances commerciales.</p>
          </div>
        </div>
      </div>
      
      {/* Section CTA */}
      <div className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl p-10 shadow-xl border border-[#2a2a4a]">
          <h2 className="text-3xl font-bold mb-4 text-white">Prêt à développer votre commerce ?</h2>
          <p className="text-gray-200 mb-8">Rejoignez Faet dès aujourd'hui et offrez à vos clients une expérience d'achat unique.</p>
          <a 
            href="/inscription"
            className="inline-block bg-[#f72585] hover:bg-[#b5179e] text-white px-10 py-4 rounded-full uppercase font-medium tracking-wider shadow-lg transform transition-all hover:scale-105"
          >
            CHOISIR UNE OFFRE
          </a>
        </div>
      </div>

      {/* Menu de navigation en bas */}
      <div className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] py-6 border-t border-[#2a2a4a] mt-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <div className="text-2xl font-bold text-white mb-4 md:mb-0">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4cc9f0] to-[#f72585]">Faet</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm text-gray-300 uppercase font-medium">
              <a href="#" className="hover:text-[#4cc9f0] transition-colors duration-300 mb-2 md:mb-0">CGV</a>
              <a href="#" className="hover:text-[#4cc9f0] transition-colors duration-300 mb-2 md:mb-0">CGU</a>
              <a href="#" className="hover:text-[#4cc9f0] transition-colors duration-300 mb-2 md:mb-0">COOKIES</a>
              <a href="#" className="hover:text-[#4cc9f0] transition-colors duration-300 mb-2 md:mb-0">LIVRAISON</a>
              <a href="#" className="hover:text-[#4cc9f0] transition-colors duration-300 mb-2 md:mb-0">POLITIQUE DE RETOUR</a>
              <a href="#" className="hover:text-[#4cc9f0] transition-colors duration-300 mb-2 md:mb-0">Contact</a>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm mt-6">
            <p>&copy; {new Date().getFullYear()} Faet. Tous droits réservés.</p>
          </div>
        </div>
      </div>

      {/* Modal d'informations supplémentaires */}
      <MoreInfo 
        isOpen={moreInfoOpen} 
        onClose={() => setMoreInfoOpen(false)} 
      />
    </section>
  );
} 