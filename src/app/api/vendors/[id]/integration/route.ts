import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSyncScript } from '@/lib/sync-client';

/**
 * GET /api/vendors/[id]/integration
 * Génère automatiquement le script d'intégration pour un vendeur
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id;
    
    // Récupérer le vendeur
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le vendeur a une clé API, sinon en générer une
    let apiKey = vendor.apiKey;
    if (!apiKey) {
      apiKey = crypto.randomUUID();
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { apiKey },
      });
    }

    // Obtenir l'URL de base de l'application
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Générer le script d'intégration
    const script = generateSyncScript({
      apiBaseUrl: baseUrl,
      vendorId: vendor.id,
      apiKey: apiKey,
    });

    // Générer également un code HTML pour l'intégration facile
    const integrationCode = `
<!-- Début du script d'intégration FBE -->
<script>
(function() {
  // Configuration
  const FBE_CONFIG = {
    apiBaseUrl: "${baseUrl}",
    vendorId: "${vendor.id}",
    apiKey: "${apiKey}"
  };
  
  // Charger le script d'intégration
  const script = document.createElement('script');
  script.src = "${baseUrl}/api/vendors/${vendor.id}/sync-script.js";
  script.async = true;
  script.onload = function() {
    // Initialiser avec la configuration
    if (window.FBE_SYNC) {
      window.FBE_SYNC.init(FBE_CONFIG);
    }
  };
  document.head.appendChild(script);
})();
</script>
<!-- Fin du script d'intégration FBE -->
    `;

    return NextResponse.json({
      vendorId: vendor.id,
      apiKey,
      script,
      integrationCode,
      instructions: "Copiez et collez ce code HTML dans votre site web pour activer la synchronisation automatique avec notre plateforme."
    });
  } catch (error) {
    console.error('Erreur lors de la génération du script d\'intégration:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
