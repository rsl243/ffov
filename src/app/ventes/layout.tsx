"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import TrialInfoFooter from '@/components/TrialInfoFooter';

export default function VentesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Barre latérale commune */}
      <Sidebar />
      
      {/* Contenu principal */}
      <div className="flex-1 overflow-auto">
        {children}
        
        {/* Footer d'information sur l'essai */}
        <TrialInfoFooter />
      </div>
    </div>
  );
} 