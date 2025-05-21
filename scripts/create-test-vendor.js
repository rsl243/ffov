// scripts/create-test-vendor.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestVendor() {
  try {
    // Créer un utilisateur test s'il n'existe pas
    let user = await prisma.user.findUnique({
      where: { email: 'vendeur.test@example.com' }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'vendeur.test@example.com',
          password: 'password123',
          name: 'Vendeur Test'
        }
      });
      console.log('Utilisateur test créé:', user);
    } else {
      console.log('Utilisateur test existe déjà:', user);
    }
    
    // Créer un vendeur test s'il n'existe pas
    let vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });
    
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          userId: user.id,
          storeName: 'Boutique Test',
          websiteUrl: 'https://demo.snipcart.com/',
          syncEnabled: true
        }
      });
      console.log('Vendeur test créé:', vendor);
    } else {
      console.log('Vendeur test existe déjà:', vendor);
    }
    
    // Afficher tous les vendeurs
    const allVendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    console.log('Tous les vendeurs:', JSON.stringify(allVendors, null, 2));
    
    return vendor;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

createTestVendor()
  .then(vendor => {
    console.log('ID du vendeur test pour les tests de synchronisation:', vendor.id);
    process.exit(0);
  })
  .catch(error => {
    console.error('Erreur lors de la création du vendeur test:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
