import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed w-full top-0 z-50 bg-transparent py-6">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="text-white font-bold text-2xl">
            <span className="text-gradient">Faet</span>
            <div className="text-xs font-light mt-1">PHYGIPLACE</div>
          </div>
        </Link>
        
        <Link href="/connexion">
          <button className="btn-primary uppercase font-bold tracking-wider text-sm">
            SE CONNECTER
          </button>
        </Link>
      </div>
    </nav>
  );
} 