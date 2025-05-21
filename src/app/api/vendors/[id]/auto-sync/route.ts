import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeVendorWebsite } from '@/lib/auto-sync-service';

/**
 * POST /api/vendors/[id]/auto-sync
 * Déclenche une synchronisation automatique des produits pour un vendeur spécifique
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id;
    
    console.log(`Démarrage de la synchronisation pour le vendeur ${vendorId}`);
    
    // Vérifier si le vendeur existe
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      console.error(`Vendeur non trouvé: ${vendorId}`);
      return NextResponse.json(
        { error: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le vendeur a une URL de site web
    if (!vendor.websiteUrl) {
      console.error(`URL du site web non définie pour le vendeur ${vendorId}`);
      return NextResponse.json(
        { error: 'URL du site web non définie pour ce vendeur' },
        { status: 400 }
      );
    }

    console.log(`Scraping du site web: ${vendor.websiteUrl}`);
    
    // Scraper le site web du vendeur pour récupérer les produits
    try {
      const scrapedProducts = await scrapeVendorWebsite(vendor.websiteUrl);
      console.log(`${scrapedProducts.length} produits trouvés sur le site web`);

      // Si aucun produit n'a été trouvé, retourner un message d'erreur
      if (scrapedProducts.length === 0) {
        console.warn(`Aucun produit trouvé sur ${vendor.websiteUrl}`);
        
        // Mettre à jour la date de dernière synchronisation même si aucun produit n'a été trouvé
        await prisma.vendor.update({
          where: { id: vendorId },
          data: { lastSyncedAt: new Date() },
        });
        
        return NextResponse.json({
          message: 'Synchronisation terminée, mais aucun produit trouvé sur le site web',
          productsFound: 0,
          productsUpdated: 0,
          productsCreated: 0
        });
      }

      // Compteurs pour les statistiques
      let created = 0;
      let updated = 0;

      // Traiter chaque produit scrapé
      for (const scrapedProduct of scrapedProducts) {
        // Vérifier si le produit existe déjà
        const existingProduct = await prisma.product.findFirst({
          where: {
            vendorId,
            externalId: scrapedProduct.externalId,
          },
        });

        if (existingProduct) {
          // Mettre à jour le produit existant
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name: scrapedProduct.name,
              description: scrapedProduct.description,
              price: scrapedProduct.price,
              imageUrl: scrapedProduct.imageUrl,
              productUrl: scrapedProduct.productUrl,
              updatedAt: new Date(),
            },
          });
          updated++;
        } else {
          // Créer un nouveau produit
          await prisma.product.create({
            data: {
              vendorId,
              externalId: scrapedProduct.externalId,
              name: scrapedProduct.name,
              description: scrapedProduct.description,
              price: scrapedProduct.price,
              imageUrl: scrapedProduct.imageUrl,
              productUrl: scrapedProduct.productUrl,
            },
          });
          created++;
        }
      }

      // Mettre à jour la date de dernière synchronisation du vendeur
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { lastSyncedAt: new Date() },
      });

      console.log(`Synchronisation terminée: ${created} produits créés, ${updated} produits mis à jour`);
      
      return NextResponse.json({
        message: 'Synchronisation réussie',
        productsFound: scrapedProducts.length,
        productsCreated: created,
        productsUpdated: updated
      });
    } catch (scrapingError) {
      console.error('Erreur lors du scraping:', scrapingError);
      return NextResponse.json(
        { 
          error: 'Erreur lors du scraping du site web',
          details: scrapingError instanceof Error ? scrapingError.message : 'Erreur inconnue'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la synchronisation',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
