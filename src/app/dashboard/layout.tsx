"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import TrialInfoFooter from '@/components/TrialInfoFooter';
import { useAuth } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {children}
        
        {/* Footer d'information sur l'essai */}
        <TrialInfoFooter />
      </div>
    </div>
  );
} 