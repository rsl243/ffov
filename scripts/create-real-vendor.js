// scripts/create-real-vendor.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRealVendor() {
  try {
    // Remplacez cette URL par l'URL de votre site réel
    const realWebsiteUrl = 'https://www.votre-site.com'; // Remplacez par votre URL réelle
    
    // Créer un utilisateur pour votre société si nécessaire
    let user = await prisma.user.findUnique({
      where: { email: 'votre-email@example.com' }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'votre-email@example.com',
          password: 'votre-mot-de-passe',
          name: 'Votre Société'
        }
      });
      console.log('Utilisateur créé:', user);
    } else {
      console.log('Utilisateur existant:', user);
    }
    
    // Créer un vendeur pour votre société
    let vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });
    
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          userId: user.id,
          storeName: 'Votre Société',
          websiteUrl: realWebsiteUrl,
          syncEnabled: true
        }
      });
      console.log('Vendeur créé:', vendor);
    } else {
      // Mettre à jour l'URL du site si nécessaire
      if (vendor.websiteUrl !== realWebsiteUrl) {
        vendor = await prisma.vendor.update({
          where: { id: vendor.id },
          data: { websiteUrl: realWebsiteUrl }
        });
        console.log('URL du vendeur mise à jour:', vendor);
      } else {
        console.log('Vendeur existant:', vendor);
      }
    }
    
    console.log('\nInformations pour tester la synchronisation:');
    console.log('ID du vendeur:', vendor.id);
    console.log('URL de l\'API de synchronisation:');
    console.log(`http://localhost:3001/api/vendors/${vendor.id}/auto-sync`);
    console.log('\nPour tester, ouvrez un nouveau terminal et exécutez:');
    console.log(`Invoke-RestMethod -Method POST -Uri "http://localhost:3001/api/vendors/${vendor.id}/auto-sync"`);
    
    return vendor;
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRealVendor()
  .then(() => {
    console.log('Script terminé');
  })
  .catch(error => {
    console.error('Erreur non gérée:', error);
  });
