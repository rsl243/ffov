import React from 'react';
import { useRouter } from 'next/navigation';

interface TrialInfoFooterProps {
  daysLeft?: number;
  verificationStatus?: 'not_submitted' | 'pending' | 'verified';
}

export default function TrialInfoFooter({
  daysLeft = 3,
  verificationStatus = 'not_submitted'
}: TrialInfoFooterProps) {
  const router = useRouter();
  
  // Si le compte est vérifié, ne pas afficher ce composant du tout
  if (verificationStatus === 'verified') {
    return null;
  }
  
  const handleConfigureClick = () => {
    router.push('/parametres/entreprise');
  };
  
  return (
    <div className="bg-white p-4 border-t fixed bottom-0 right-0 left-0 md:left-64 flex justify-between items-center">
      <div>
        <div className="font-medium">
          {verificationStatus === 'pending' 
            ? "Votre compte est en cours de vérification" 
            : `Il vous reste ${daysLeft} jours d'essai`}
        </div>
        <div className="text-sm text-gray-600">
          {verificationStatus === 'pending'
            ? "Nous vérifions actuellement les informations de votre entreprise. Vous serez notifié une fois la validation terminée."
            : "Pour continuer à bénéficier de nos services, veuillez finaliser votre inscription en fournissant les informations de votre entreprise."}
        </div>
      </div>
      {verificationStatus === 'not_submitted' && (
        <button 
          onClick={handleConfigureClick}
          className="px-4 py-2 bg-gray-800 text-white rounded-md"
        >
          Configurer
        </button>
      )}
    </div>
  );
} 