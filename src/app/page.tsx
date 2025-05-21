import { Suspense, lazy } from 'react';
import Navbar from '@/components/Navbar';

// Chargement différé des composants lourds
const HeroSection = lazy(() => import('@/components/HeroSection'));

// Composant de chargement léger
function LoadingComponent() {
  return <div className="h-screen bg-dark flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-primary border-solid rounded-full border-t-transparent animate-spin"></div>
  </div>;
}

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      <Suspense fallback={<LoadingComponent />}>
        <HeroSection />
      </Suspense>
    </main>
  );
} 