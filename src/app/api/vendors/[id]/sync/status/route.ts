import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/vendors/[id]/sync/status
 * Récupère le statut de la synchronisation en cours pour un vendeur
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id;
    
    // Vérifier si le vendeur existe
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    // Pour la démo, on considère que la synchronisation est toujours terminée
    // Dans une implémentation réelle, on vérifierait l'état d'une tâche asynchrone
    
    // Récupérer le nombre de produits depuis Supabase
    const { count: productCount, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('vendor_id', vendorId);

    if (countError) {
      console.error('Erreur lors du comptage des produits:', countError);
      return NextResponse.json(
        { error: 'Erreur lors du comptage des produits' },
        { status: 500 }
      );
    }

    // Si aucun produit n'existe encore, démarrer une synchronisation
    if (!productCount || productCount === 0) {
      // Dans une application réelle, on démarrerait ici un processus de synchronisation asynchrone
      // Pour la démo, on va simplement créer un enregistrement dans la table de synchronisation
      const { data: syncData, error: syncError } = await supabase
        .from('sync_jobs')
        .insert([
          {
            vendor_id: vendorId,
            status: 'in_progress',
            started_at: new Date().toISOString(),
          },
        ])
        .select();

      if (syncError) {
        console.error('Erreur lors de la création du job de synchronisation:', syncError);
        return NextResponse.json(
          { error: 'Erreur lors du démarrage de la synchronisation' },
          { status: 500 }
        );
      }

      // Mettre à jour la date de dernière synchronisation du vendeur dans Supabase
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', vendorId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du vendeur:', updateError);
      }

      return NextResponse.json({
        status: 'in_progress',
        lastSyncedAt: vendor.lastSyncedAt || new Date(),
        productCount: 0,
        syncJobId: syncData?.[0]?.id
      });
    }

    return NextResponse.json({
      status: 'completed',
      lastSyncedAt: vendor.lastSyncedAt || new Date(),
      productCount: productCount
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de synchronisation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
