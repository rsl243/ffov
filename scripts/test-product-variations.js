// scripts/test-product-variations.js
// Script de test pour vérifier l'extraction des variations de produits (couleurs, tailles) et images multiples

const { extractProductsWithPlaywright } = require('../src/lib/product-extractor');

// Obtenir l'URL du site à tester depuis les arguments de la ligne de commande ou utiliser une URL par défaut
const url = process.argv[2] || 'https://www.example.com'; // Remplacez par une URL de test réelle

async function testProductVariations() {
  console.log('=======================================================================');
  console.log(`TEST D'EXTRACTION DES VARIATIONS DE PRODUITS AVEC PLAYWRIGHT`);
  console.log(`URL: ${url}`);
  console.log('=======================================================================');
  
  try {
    // Exécuter l'extraction avec Playwright
    console.log('\nDémarrage de l\'extraction des produits...');
    const startTime = Date.now();
    const products = await extractProductsWithPlaywright(url);
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000; // en secondes
    
    console.log(`\nExtraction terminée en ${executionTime.toFixed(2)} secondes`);
    console.log(`Nombre de produits uniques trouvés: ${products.length}`);
    
    if (products.length > 0) {
      // Statistiques sur les variations et images
      const withColors = products.filter(p => p.colors && p.colors.length > 0).length;
      const withSizes = products.filter(p => p.sizes && p.sizes.length > 0).length;
      const withVariants = products.filter(p => p.variants && p.variants.length > 0).length;
      const withMultipleImages = products.filter(p => p.imageUrls && p.imageUrls.length > 1).length;
      
      console.log('\n=== STATISTIQUES GLOBALES ===');
      console.log(`Produits avec couleurs: ${withColors}/${products.length} (${Math.round(withColors/products.length*100)}%)`);
      console.log(`Produits avec tailles: ${withSizes}/${products.length} (${Math.round(withSizes/products.length*100)}%)`);
      console.log(`Produits avec variantes: ${withVariants}/${products.length} (${Math.round(withVariants/products.length*100)}%)`);
      console.log(`Produits avec plusieurs images: ${withMultipleImages}/${products.length} (${Math.round(withMultipleImages/products.length*100)}%)`);
      
      // Afficher des détails sur chaque produit
      console.log('\n=== DÉTAILS DES PRODUITS ===');
      products.forEach((product, index) => {
        console.log(`\n--- PRODUIT #${index + 1}: ${product.name} ---`);
        console.log(`Prix: ${product.price}`);
        console.log(`Description: ${product.description ? (product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description) : 'Non disponible'}`);
        console.log(`URL: ${product.productUrl || 'Non disponible'}`);
        
        // Afficher les images
        if (product.imageUrls && product.imageUrls.length > 0) {
          console.log(`Images (${product.imageUrls.length}): ${product.imageUrls[0]}${product.imageUrls.length > 1 ? ` + ${product.imageUrls.length - 1} autres` : ''}`);
        } else if (product.imageUrl) {
          console.log(`Image: ${product.imageUrl}`);
        } else {
          console.log(`Image: Non disponible`);
        }
        
        // Afficher les couleurs
        if (product.colors && product.colors.length > 0) {
          console.log(`Couleurs (${product.colors.length}): ${product.colors.join(', ')}`);
        } else {
          console.log(`Couleurs: Non disponibles`);
        }
        
        // Afficher les tailles
        if (product.sizes && product.sizes.length > 0) {
          console.log(`Tailles (${product.sizes.length}): ${product.sizes.join(', ')}`);
        } else {
          console.log(`Tailles: Non disponibles`);
        }
        
        // Afficher les variantes
        if (product.variants && product.variants.length > 0) {
          console.log(`Variantes (${product.variants.length}):`);
          // Afficher un échantillon de variantes (max 3)
          const showCount = Math.min(3, product.variants.length);
          for (let i = 0; i < showCount; i++) {
            const v = product.variants[i];
            console.log(`  - ${v.color || 'N/A'} / ${v.size || 'N/A'} (${v.price || product.price}€)`);
          }
          if (product.variants.length > showCount) {
            console.log(`  + ${product.variants.length - showCount} autres variantes`);
          }
        } else {
          console.log(`Variantes: Non disponibles`);
        }
      });
      
      console.log('\n=== RÉSUMÉ ===');
      if (withVariants > 0) {
        console.log(`✅ Les produits ont été extraits avec leurs variations`);
      } else if (withColors > 0 || withSizes > 0) {
        console.log(`⚠️ Les couleurs et tailles ont été détectées, mais pas traduites en variantes complètes`);
      } else {
        console.log(`❌ Aucune variation (couleurs/tailles) n'a été détectée dans les produits`);
      }
      
      if (withMultipleImages > 0) {
        console.log(`✅ Les produits ont été extraits avec plusieurs images`);
      } else {
        console.log(`⚠️ La plupart des produits n'ont qu'une seule image ou aucune`);
      }
    } else {
      console.log('\n❌ Aucun produit n\'a été trouvé sur cette page');
      console.log('Veuillez essayer une autre URL ou vérifier que la page contient bien des produits');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de scraping avec Playwright:', error);
  }
}

testProductVariations()
  .then(() => {
    console.log('\n=== Test terminé ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erreur inattendue:', error);
    process.exit(1);
  });
