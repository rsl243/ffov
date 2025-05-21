/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Variables d'environnement exposées côté client
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  reactStrictMode: true,
  // Activer le cache statique pour améliorer les performances
  staticPageGenerationTimeout: 120,
  // Optimiser les images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Optimiser le chargement en réduisant la taille des bundles
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Charger les polices web de manière optimisée
  optimizeFonts: true,
  // Options expérimentales
  experimental: {
    // Vous pouvez ajouter des fonctionnalités expérimentales ici
  },
  // Compression des réponses
  compress: true,
  // Optimiser le code serveur
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    // Résoudre le problème avec undici et cheerio
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false,  // Désactiver l'utilisation d'undici
    };
    
    // Exclure cheerio des optimisations webpack qui causent des problèmes
    config.module.rules.push({
      test: /node_modules\/cheerio/,
      use: 'null-loader',
    });

    return config;
  },
};

module.exports = nextConfig 