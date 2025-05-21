import { PlaywrightProductExtractor } from '../lib/product-extractor-playwright';

/**
 * Script de test pour extraire les produits d'un site web
 * Utilise l'extracteur Playwright pour obtenir les produits
 */
async function testScraping() {
  console.log('Démarrage du test de scraping...');
  
  const url = 'https://www.ledressingdecloe.com/';
  console.log(`Site cible: ${url}`);
  
  // Initialiser l'extracteur Playwright
  const extractor = new PlaywrightProductExtractor();
  
  try {
    // Initialiser le navigateur
    await extractor.initialize();
    console.log('Navigateur initialisé');
    
    // Extraire les produits
    console.log('Extraction des produits en cours...');
    const products = await extractor.extractProducts(url, {
      scrollToLoad: true,
      maxProducts: 10, // Limiter à 10 produits pour le test
      waitForSelector: '.product-item, .product, .card, [itemtype*="Product"]'
    });
    
    console.log(`${products.length} produits extraits`);
    
    // Afficher les détails des produits
    products.forEach((product, index) => {
      console.log(`\nProduit ${index + 1}:`);
      console.log(`Nom: ${product.name}`);
      console.log(`Prix: ${product.price}€`);
      console.log(`Description: ${product.description?.substring(0, 100)}${product.description && product.description.length > 100 ? '...' : ''}`);
      console.log(`Image: ${product.imageUrl}`);
      console.log(`URL: ${product.productUrl}`);
      console.log(`Marque: ${product.brand || 'Non spécifiée'}`);
      console.log(`SKU: ${product.sku || 'Non spécifié'}`);
      
      if (product.variants && product.variants.length > 0) {
        console.log(`Tailles disponibles: ${product.variants.join(', ')}`);
      }
      
      if (product.category) {
        console.log(`Couleurs disponibles: ${product.category}`);
      }
      
      console.log('---');
    });
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
  } finally {
    // Fermer le navigateur
    await extractor.close();
    console.log('Navigateur fermé');
  }
}

// Exécuter le test
testScraping().catch(console.error);
