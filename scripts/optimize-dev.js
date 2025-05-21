/**
 * Script d'optimisation pour les performances de développement
 * 
 * Ce script:
 * 1. Vide le cache de Next.js avant le démarrage
 * 2. Configure les options de développement optimisées
 * 3. Démarre le serveur de développement avec des options optimisées
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Chemins
const nextCacheDir = path.join(process.cwd(), '.next/cache');
const nextOptionsFile = path.join(process.cwd(), '.env.local');

// Nettoyer le cache de Next.js
console.log('📂 Nettoyage du cache Next.js...');
if (fs.existsSync(nextCacheDir)) {
  try {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    console.log('✅ Cache nettoyé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage du cache:', error);
  }
}

// Fermer les processus Node qui pourraient bloquer les ressources
console.log('🔍 Recherche de processus Node.js à fermer...');
try {
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' }).toString();
  } else {
    execSync('killall node || true', { stdio: 'ignore' }).toString();
  }
  
  console.log('✅ Processus Node arrêtés avec succès');
} catch (error) {
  // Ignorer l'erreur si aucun processus n'est trouvé
  console.log('⚠️ Aucun processus Node.js à arrêter');
}

// Vérifier les options de performances
console.log('⚙️ Vérification des options de performances...');
if (!fs.existsSync(nextOptionsFile)) {
  console.warn('⚠️ Fichier .env.local non trouvé, création avec des options de performance optimales');
  const envContent = `# Options pour améliorer les performances de développement
NODE_ENV=development
NEXT_OPTIMIZE_FONTS=true
NEXT_TELEMETRY_DISABLED=1
PORT=3000
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_VERCEL_ENV="development"
NEXT_PUBLIC_DISABLE_ANALYTICS=true
`;
  fs.writeFileSync(nextOptionsFile, envContent);
}

// Libérer la mémoire avant de démarrer le serveur
try {
  global.gc();
  console.log('🧹 Mémoire libérée par le garbage collector');
} catch (e) {
  console.log('⚠️ Impossible de forcer le garbage collector - normal');
}

// Démarrer le serveur de développement avec des options optimisées
console.log('🚀 Démarrage du serveur de développement optimisé...');
const nextDev = spawn('node', [
  '--max-old-space-size=4096',
  'node_modules/next/dist/bin/next', 
  'dev',
  '--turbo',  // Activer Turbopack pour de meilleures performances
  '--no-open' // Ne pas ouvrir automatiquement le navigateur
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096 --expose-gc', // Augmenter la mémoire disponible
  }
});

nextDev.on('close', (code) => {
  console.log(`📦 Serveur de développement arrêté avec le code: ${code}`);
});

process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
  process.exit(0);
}); 