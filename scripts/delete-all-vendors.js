// scripts/delete-all-vendors.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllVendors() {
  try {
    // Supprimer tous les vendeurs
    const deletedVendors = await prisma.vendor.deleteMany();
    
    console.log(`${deletedVendors.count} vendeurs supprimés`);
    
    // Vérifier qu'il n'y a plus de vendeurs
    const remainingVendors = await prisma.vendor.findMany();
    
    if (remainingVendors.length === 0) {
      console.log('Tous les vendeurs ont été supprimés avec succès.');
    } else {
      console.log(`ATTENTION: Il reste encore ${remainingVendors.length} vendeurs dans la base de données.`);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression des vendeurs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllVendors();
