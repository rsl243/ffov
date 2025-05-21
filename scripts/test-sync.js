// scripts/test-sync.js
const { syncVendorProducts } = require('../src/lib/auto-sync-service');

// ID du vendeur test obtenu précédemment
const vendorId = 'ddfc41a7-d750-4e9a-a0f6-eeb576895e12';

async function testSync() {
  console.log(`Démarrage de la synchronisation pour le vendeur ${vendorId}...`);
  
  try {
    // Exécuter la synchronisation
    const result = await syncVendorProducts(vendorId);
    
    console.log('Résultat de la synchronisation:');
    console.log(JSON.stringify(result, null, 2));
    
    // Afficher un résumé
    if (result.success) {
      console.log(`\nSynchronisation réussie!`);
      console.log(`Total des produits: ${result.totalProducts}`);
      console.log(`Produits créés: ${result.created}`);
      console.log(`Produits mis à jour: ${result.updated}`);
      console.log(`Erreurs: ${result.errors}`);
    } else {
      console.log(`\nÉchec de la synchronisation: ${result.message}`);
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
  }
}

testSync()
  .then(() => {
    console.log('Test de synchronisation terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erreur inattendue:', error);
    process.exit(1);
  });
