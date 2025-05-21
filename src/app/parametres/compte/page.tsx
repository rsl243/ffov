"use client";

import React, { useState, useEffect } from 'react';
import { FiCheck, FiPlus } from 'react-icons/fi';
import Image from 'next/image';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { updateUserProfile } from '@/lib/userProfileService';

export default function ParametresComptePage() {
  const { profile, loading: profileLoading, refreshProfile } = useUserProfile();
  const [photo, setPhoto] = useState<File | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Récupérer les informations de l'utilisateur depuis le contexte de profil
  useEffect(() => {
    // Réinitialiser l'erreur au chargement
    setError('');
    
    // Si le profil est encore en chargement, ne rien faire
    if (profileLoading) {
      return;
    }
    
    // Si le profil est chargé, mettre à jour les champs
    if (profile) {
      console.log('Profil chargé dans les paramètres du compte:', profile);
      // Mettre à jour les champs du formulaire avec les données du profil
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email || '');
      setEmailVerified(true); // On suppose que l'email est vérifié si l'utilisateur est connecté
    } else {
      // Si aucun profil n'est disponible après le chargement, essayer de le rafraîchir
      const loadProfileData = async () => {
        try {
          await refreshProfile();
        } catch (err) {
          console.error('Erreur lors du chargement du profil:', err);
          // Ne pas afficher d'erreur pour éviter de perturber l'utilisateur
        }
      };
      
      loadProfileData();
    }
  }, [profile, profileLoading, refreshProfile]);
  
  // Timer de sécurité pour éviter les pages bloquées pendant trop longtemps
  useEffect(() => {
    // Si après 5 secondes on est toujours en chargement, forcer la fin du chargement
    const timeoutId = setTimeout(() => {
      if (profileLoading) {
        console.log('Délai de chargement du profil dépassé, affichage forcé');
        // Forcer l'affichage même si le profil n'est pas chargé
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [profileLoading]);

  // Fonction pour mettre à jour les informations de l'utilisateur
  const handleUpdateUserInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      console.log('Mise à jour du profil avec:', { firstName, lastName });
      
      // Utiliser le service centralisé pour mettre à jour le profil utilisateur
      const updatedProfile = await updateUserProfile({
        firstName,
        lastName
      });
      
      console.log('Profil mis à jour:', updatedProfile);
      
      // Mettre à jour l'interface immédiatement avec le profil retourné
      if (updatedProfile) {
        // Mise à jour manuelle des champs locaux au cas où le rafraîchissement échoue
        setFirstName(updatedProfile.firstName);
        setLastName(updatedProfile.lastName);
      }
      
      // Rafraîchir le profil dans le contexte pour s'assurer que tous les composants sont à jour
      await refreshProfile();
      
      setSuccess('Vos informations ont été mises à jour avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError('Impossible de mettre à jour vos informations. Veuillez réessayer plus tard.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Général</h1>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      {/* Affichage d'un état de chargement si le profil est en cours de chargement ou si une action est en cours */}
      {(profileLoading || loading) && !error ? (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-center items-center h-40">
          <p className="text-gray-500">Chargement de vos informations...</p>
        </div>
      ) : (
        <form onSubmit={handleUpdateUserInfo}>
          {/* Détails personnels */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-medium mb-6">Détails</h2>
            
            <div className="flex flex-col md:flex-row">
              <div className="md:w-2/3 pr-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de famille
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-8">
                  Saisissez votre prénom et votre nom tels qu'ils apparaissent sur votre pièce d'identité officielle.
                </p>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      E-mail
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      disabled
                    />
                    {emailVerified && (
                      <div className="ml-3 text-green-600 flex items-center">
                        <FiCheck className="mr-1" />
                        <span className="text-sm">Vérifié</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pour changer votre adresse e-mail, veuillez contacter le support.
                  </p>
                </div>
                

                

                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </div>
              
              <div className="md:w-1/3 mt-6 md:mt-0">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 overflow-hidden flex items-center justify-center">
                    {photo ? (
                      <Image
                        src={URL.createObjectURL(photo)}
                        alt="Photo de profil"
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="text-4xl text-gray-400 font-semibold">
                        {firstName && lastName ? `${firstName.charAt(0)}${lastName.charAt(0)}` : '?'}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        if (target && target.files && target.files.length > 0) {
                          const file = target.files[0];
                          setPhoto(file);
                        }
                      };
                      input.click();
                    }}
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Importer une photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
      
      {/* Langue préférée */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium mb-4">Langue préférée</h2>
        <p className="text-sm text-gray-600 mb-4">
          Il s'agit de la langue que vous verrez lorsque vous vous connecterez à Faet.
          Cela n'affecte pas la langue que les clients voient dans votre boutique en ligne.
        </p>
        
        <div className="mb-6">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Langue
          </label>
          <div className="relative">
            <select
              id="language"
              name="language"
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
              defaultValue="fr"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fuseau horaire */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium mb-4">Fuseau horaire</h2>
        
        <div className="mb-4">
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Fuseau horaire
          </label>
          <div className="relative">
            <select
              id="timezone"
              name="timezone"
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
              defaultValue="paris"
            >
              <option value="paris">(GMT +01:00) Paris</option>
              <option value="london">(GMT +00:00) London</option>
              <option value="newyork">(GMT -05:00) New York</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          Ceci est le fuseau horaire de votre compte. Pour définir le fuseau horaire de l'interface administrateur Faet, accédez à la section «&nbsp;Menu général&nbsp;» dans Paramètres.
        </p>
      </div>
    </div>
  );
} 