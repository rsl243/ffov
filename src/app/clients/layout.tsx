'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      {children}
    </div>
  );
}
