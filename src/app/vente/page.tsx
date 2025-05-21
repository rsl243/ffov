"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VentePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/ventes');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirection vers la page des ventes...</p>
    </div>
  );
} 