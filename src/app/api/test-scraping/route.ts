import { NextRequest, NextResponse } from 'next/server';
import { PlaywrightProductExtractor } from '@/lib/product-extractor-playwright';

/**
 * API endpoint pour tester le scraping avec Playwright
 * Permet de scraper n'importe quel site web et de récupérer les produits
 */
export async function POST(request: NextRequest) {
  // Initialiser l'extracteur Playwright en dehors des blocs try/catch
  let extractor: PlaywrightProductExtractor | null = null;
  
  try {
    // Récupérer l'URL du site à scraper
    const body = await request.json().catch(() => ({}));
    const url = body?.url;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL non fournie' },
        { status: 400 }
      );
    }
    
    // Initialiser l'extracteur Playwright
    extractor = new PlaywrightProductExtractor();
    
    try {
      await extractor.initialize();
      
      // Extraire les produits du site web
      const products = await extractor.extractProducts(url, {
        scrollToLoad: true, // Activer le défilement pour charger plus de produits
        maxProducts: 12 // Limiter le nombre de produits à extraire
      });
      
      console.log(`Produits extraits: ${products.length}`);
      
      // Fermer le navigateur Playwright
      await extractor.close();
      extractor = null;
      
      return NextResponse.json({
        success: true,
        message: `${products.length} produits extraits avec succès`,
        products: products,
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'extraction des produits:', error);
      
      // S'assurer que le navigateur est fermé même en cas d'erreur
      if (extractor) {
        await extractor.close();
        extractor = null;
      }
      
      // Renvoyer une réponse JSON avec l'erreur
      return NextResponse.json(
        { 
          error: 'Erreur lors de l\'extraction des produits', 
          message: error.message || 'Erreur inconnue',
          success: false,
          products: []
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur lors du scraping:', error);
    
    // S'assurer que le navigateur est fermé en cas d'erreur
    if (extractor) {
      try {
        await extractor.close();
      } catch (closeError) {
        console.error('Erreur lors de la fermeture du navigateur:', closeError);
      }
    }
    
    // Renvoyer une réponse JSON avec l'erreur
    return NextResponse.json(
      { 
        error: 'Erreur lors du traitement de la requête', 
        message: error.message || 'Erreur inconnue',
        success: false,
        products: []
      },
      { status: 500 }
    );
  }
}
