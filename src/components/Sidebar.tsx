import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserProfile } from '@/contexts/UserProfileContext';
// Import des icônes de manière plus optimisée
import { 
  FiHome,
  FiShoppingBag,
  FiBox,
  FiUsers,
  FiMessageSquare,
  FiTruck,
  FiDollarSign,
  FiPieChart,
  FiSpeaker,
  FiChevronRight,
  FiSettings,
  FiShoppingCart,
  FiPlus
} from 'react-icons/fi';

interface SidebarProps {
  activePage?: string;
}

// Sites connectés simulés
const connectedSites = [
  // { id: 1, name: "kappa.fr", url: "https://www.kappa.fr/" }
];

function Sidebar({ activePage }: SidebarProps) {
  const pathname = usePathname();
  const { profile, loading: profileLoading } = useUserProfile();
  
  // Utilisation de useMemo pour éviter de recalculer ces valeurs à chaque rendu
  const linkStyles = useMemo(() => {
    // Style commun pour tous les liens
    const baseStyle = "flex items-center p-2 rounded-md font-medium transition-colors duration-200 text-base";
    const activeStyle = `${baseStyle} bg-gray-800 text-white`;
    const inactiveStyle = `${baseStyle} hover:bg-gray-800 text-white`;
    
    return { baseStyle, activeStyle, inactiveStyle };
  }, [pathname]);
  
  // Fonction pour déterminer si un lien est actif
  const isActive = useMemo(() => {
    return (path: string) => {
      return pathname === path || (path !== '/' && pathname?.startsWith(path));
    };
  }, [pathname]);
  
  return (
    <aside className="w-64 bg-[#1a1a1a] text-white hidden md:block">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold font-montserrat">
            <span className="text-gradient">FAET</span>
          </Link>
        </div>
        
        {/* Informations de l'utilisateur */}
        {!profileLoading && profile && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white mr-2">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{profile.fullName}</p>
                <p className="text-xs text-gray-400 truncate">{profile.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <nav className="p-2 font-montserrat">
        <ul className="space-y-1">
          <li>
            <Link 
              href="/dashboard" 
              className={isActive('/dashboard') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
            >
              <FiHome className="mr-3" /> Tableau de bord
            </Link>
          </li>
          <li>
            <Link 
              href="/ventes" 
              className={isActive('/ventes') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
            >
              <FiShoppingBag className="mr-3" /> Ventes
            </Link>
          </li>
          <li>
            <Link 
              href="/livraisons" 
              className={isActive('/livraisons') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
            >
              <FiTruck className="mr-3" /> Livraisons
            </Link>
          </li>
          <li>
            <Link 
              href="/synchronisation" 
              className={isActive('/synchronisation') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
            >
              <FiBox className="mr-3" /> Produits synchronisés
            </Link>
          </li>
          <li>
            <Link 
              href="/clients" 
              className={isActive('/clients') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
            >
              <FiUsers className="mr-3" /> Clients
            </Link>
          </li>
          <li>
            <Link 
              href="/messages" 
              className={isActive('/messages') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
            >
              <FiMessageSquare className="mr-3" /> Messages
            </Link>
          </li>
          <li>
            <Link 
              href="/finance" 
              className={isActive('/finance') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
            >
              <FiDollarSign className="mr-3" /> Finance
            </Link>
          </li>
          <li>
            <Link 
              href="/analyses" 
              className={isActive('/analyses') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
            >
              <FiPieChart className="mr-3" /> Analyses de données
            </Link>
          </li>
          <li>
            <Link 
              href="/marketing" 
              className={isActive('/marketing') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
            >
              <FiSpeaker className="mr-3" /> Marketing
            </Link>
          </li>
        </ul>
        
        <div className="mt-6 pt-4">
          {/* <h3 className="flex items-center justify-between px-2 text-sm font-medium">
            Intégrations <FiChevronRight />
          </h3> */}
          <ul className="mt-2">
            {/* {connectedSites.map(site => (
              <li key={site.id}>
                <Link 
                  href={`#${site.name}`}
                  className="flex items-center p-2 hover:bg-gray-800 rounded-md text-sm font-medium transition-colors duration-200 text-white"
                >
                  <FiShoppingCart className="mr-2" /> {site.name}
                </Link>
              </li>
            ))} */}
            {/* <li>
              <Link 
                href="#" 
                className="flex items-center p-2 hover:bg-gray-800 rounded-md text-sm font-medium transition-colors duration-200 text-white"
              >
                <FiPlus className="mr-2" /> Ajouter
              </Link>
            </li> */}
          </ul>
        </div>
      </nav>
      
      <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-700">
        <Link 
          href="/parametres" 
          className={isActive('/parametres') ? linkStyles.activeStyle : linkStyles.inactiveStyle}
        >
          <FiSettings className="mr-3" /> Paramètres
        </Link>
        
        {!profileLoading && profile && profile.selectedPlan && (
          <div className="mt-2 text-xs text-gray-400 flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Plan {profile.selectedPlan}</span>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;