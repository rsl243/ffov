// scripts/delete-test-vendors.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteTestVendors() {
  try {
    // Supprimer tous les vendeurs de test (ceux avec l'URL demo.snipcart.com)
    const deletedVendors = await prisma.vendor.deleteMany({
      where: {
        websiteUrl: {
          contains: 'demo.snipcart.com'
        }
      }
    });
    
    console.log(`${deletedVendors.count} vendeurs de test supprimés`);
    
    // Afficher les vendeurs restants
    const remainingVendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('Vendeurs restants:');
    remainingVendors.forEach(vendor => {
      console.log(`- ${vendor.storeName || 'Sans nom'} (${vendor.websiteUrl})`);
    });
    
    if (remainingVendors.length === 0) {
      console.log('Aucun vendeur restant dans la base de données.');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression des vendeurs de test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestVendors();
