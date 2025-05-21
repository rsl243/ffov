import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { syncAllVendors } from '@/lib/auto-sync-service';

/**
 * POST /api/cron/sync-all-vendors
 * Endpoint pour synchroniser automatiquement les produits de tous les vendeurs
 * Peut être appelé par un service de cron (comme Vercel Cron Jobs)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret pour sécuriser l'endpoint
    const authHeader = request.headers.get('Authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (expectedSecret && (!authHeader || authHeader !== `Bearer ${expectedSecret}`)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Déclencher la synchronisation de tous les vendeurs
    const result = await syncAllVendors();

    return NextResponse.json({
      success: true,
      message: 'Synchronisation de tous les vendeurs déclenchée avec succès',
      result
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation de tous les vendeurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation de tous les vendeurs' },
      { status: 500 }
    );
  }
}
