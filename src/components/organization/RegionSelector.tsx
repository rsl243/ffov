'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ComboBox } from '../ui/combobox';

const REGIONS_FRANCE = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur',
];

interface RegionSelectorProps {
  selectedRegion: string | undefined;
  onRegionChange: (region: string) => void;
  subscriptionType: 'VILLE' | 'REGION' | 'PAYS';
  disabled?: boolean;
}

export function RegionSelector({
  selectedRegion,
  onRegionChange,
  subscriptionType,
  disabled = false,
}: RegionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (subscriptionType !== 'REGION') {
    return null;
  }

  const filteredRegions = REGIONS_FRANCE.filter(region =>
    region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="region">Région d'activité</Label>
        <ComboBox
          id="region"
          value={selectedRegion}
          onChange={onRegionChange}
          disabled={disabled}
          placeholder="Sélectionnez votre région"
          items={REGIONS_FRANCE}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />
      </div>
      
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700">
          L'offre RÉGION vous permet d'avoir un nombre illimité de boutiques dans la région sélectionnée.
          Une fois validée, la région ne pourra pas être modifiée sans approbation administrative.
        </p>
      </Card>
    </div>
  );
}
