'use client';

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { SubscriptionType } from '@/types/organization';

interface SubscriptionPlansProps {
  onSelectPlan: (plan: SubscriptionType) => void;
}

export function SubscriptionPlans({ onSelectPlan }: SubscriptionPlansProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
      {/* Plan VILLE */}
      <Card className="p-6 space-y-4 border-2 hover:border-primary">
        <h3 className="text-2xl font-bold">VILLE</h3>
        <div className="text-3xl font-bold">10€ HT<span className="text-sm font-normal">/mois</span></div>
        
        <ul className="space-y-2 min-h-[200px]">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Jusqu'à 3 boutiques
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Commission de 1.5% HT par vente
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Compte partagé
          </li>
        </ul>

        <Button 
          onClick={() => onSelectPlan('VILLE')}
          className="w-full"
          variant="outline"
        >
          Choisir ce plan
        </Button>
      </Card>

      {/* Plan REGION */}
      <Card className="p-6 space-y-4 border-2 border-primary bg-primary/5">
        <h3 className="text-2xl font-bold">RÉGION</h3>
        <div className="text-3xl font-bold">35€ HT<span className="text-sm font-normal">/mois</span></div>
        
        <ul className="space-y-2 min-h-[200px]">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Boutiques illimitées dans votre région
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Commission de 2.5% HT à partir de 5000€ de CA/mois
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Gestion hiérarchique des comptes
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Centralisation des données
          </li>
        </ul>

        <Button 
          onClick={() => onSelectPlan('REGION')}
          className="w-full"
        >
          Choisir ce plan
        </Button>
      </Card>

      {/* Plan PAYS */}
      <Card className="p-6 space-y-4 border-2 hover:border-primary">
        <h3 className="text-2xl font-bold">PAYS</h3>
        <div className="text-3xl font-bold">100€ HT<span className="text-sm font-normal">/mois</span></div>
        
        <ul className="space-y-2 min-h-[200px]">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Boutiques illimitées dans tout le pays
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Commission de 2.5% HT par vente
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Gestion hiérarchique complète
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Centralisation nationale des données
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Marketing avancé
          </li>
        </ul>

        <Button 
          onClick={() => onSelectPlan('PAYS')}
          className="w-full"
          variant="outline"
        >
          Choisir ce plan
        </Button>
      </Card>
    </div>
  );
}
