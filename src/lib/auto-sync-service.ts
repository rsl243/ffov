/**
 * Service de synchronisation automatique des produits des vendeurs
 * Ce service utilise des web scrapers pour extraire les produits des sites des vendeurs
 * sans nécessiter de modification de leur site web.
 */

import { prisma } from './prisma';
import { chromium } from 'playwright';
import { URL } from 'url';
import { logger } from './logger';

interface ProductVariant {
  id: string;             // Identifiant unique de la variante
  color?: string;         // Couleur de la variante
  size?: string;          // Taille de la variante  
  price?: number;         // Prix spécifique à cette variante (si différent)
  imageUrl?: string;      // Image spécifique à cette variante
  sku?: string;           // SKU spécifique à cette variante
  stock?: number;         // Stock spécifique à cette variante
}

interface ScrapedProduct {
  externalId: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  imageUrl?: string;
  imageUrls?: string[];   // Toutes les images du produit
  productUrl?: string;    // URL du produit
  sku?: string;           // Référence/SKU du produit
  brand?: string;         // Marque du produit (non prioritaire)
  category?: string;      // Catégorie du produit
  colors?: string[];      // Couleurs disponibles pour le produit
  sizes?: string[];       // Tailles disponibles pour le produit
  variants?: ProductVariant[]; // Variantes détaillées du produit (combinaisons de couleurs, tailles, prix)
  weight?: number;        // Poids du produit
  dimensions?: string;    // Dimensions du produit
  attributes?: Record<string, string>; // Attributs supplémentaires
}

/**
 * Scrape les produits d'un site web de vendeur
 */
import { extractProductsWithPlaywright } from './product-extractor';

export async function scrapeVendorWebsite(websiteUrl: string): Promise<ScrapedProduct[]> {
  try {
    logger.info(`Démarrage du scraping pour ${websiteUrl}`);
    
    // Utiliser Playwright pour récupérer les produits
    const products = await extractProductsWithPlaywright(websiteUrl);
    
    // Journaliser les résultats
    logger.info(`${products.length} produits extraits du site ${websiteUrl}`);
    
    // Vérifier si des produits ont été trouvés
    if (products.length === 0) {
      logger.warn(`Aucun produit trouvé sur le site ${websiteUrl}`);
    } else {
      // Journaliser des informations sur les produits trouvés
      const missingDataStats = {
        sansDescription: products.filter(p => !p.description).length,
        sansImage: products.filter(p => !p.imageUrl).length,
        sansStock: products.filter(p => !p.stock || p.stock === 0).length,
        sansURL: products.filter(p => !p.productUrl).length,
        sansSKU: products.filter(p => !p.sku).length,
        sansMarque: products.filter(p => !p.brand).length,
        sansCategorie: products.filter(p => !p.category).length
      };
      
      logger.info(`Statistiques des données manquantes:`, missingDataStats);
    }
    
    return products;
  } catch (error) {
    console.error('Erreur lors du scraping du site vendeur:', error);
    throw error;
  }
}

/**
 * Synchronise les produits d'un vendeur
 */
export async function syncVendorProducts(vendorId: string): Promise<any> {
  try {
    // Récupérer les informations du vendeur
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor || !vendor.syncEnabled) {
      throw new Error('Vendeur non trouvé ou synchronisation désactivée');
    }

    // Scraper le site web du vendeur
    const products = await scrapeVendorWebsite(vendor.websiteUrl);

    if (products.length === 0) {
      return {
        success: false,
        message: 'Aucun produit trouvé sur le site web du vendeur',
        syncedAt: new Date(),
      };
    }

    // Traiter chaque produit
    const syncResults = await Promise.all(
      products.map(async (product) => {
        try {
          // Vérifier si le produit existe déjà
          const existingProduct = await prisma.product.findFirst({
            where: {
              externalId: product.externalId,
              vendorId,
            },
          });

          if (existingProduct) {
            // Mettre à jour le produit existant
            // Créer un objet de données avec tous les champs disponibles
            const productData: any = {
              name: product.name,
              price: product.price,
              description: product.description,
              stock: product.stock || 0,
              imageUrl: product.imageUrl,
              productUrl: product.productUrl,
              updatedAt: new Date(),
            };
            
            // Ajouter les champs supplémentaires s'ils existent
            if (product.sku) productData.sku = product.sku;
            if (product.brand) productData.brand = product.brand;
            if (product.category) productData.category = product.category;
            if (product.variants) productData.variants = JSON.stringify(product.variants);
            if (product.weight) productData.weight = product.weight;
            if (product.dimensions) productData.dimensions = product.dimensions;
            if (product.attributes) productData.attributes = JSON.stringify(product.attributes);
            
            // Mettre à jour le produit avec toutes les données disponibles
            const updatedProduct = await prisma.product.update({
              where: { id: existingProduct.id },
              data: productData,
            });
            
            // Journaliser les champs mis à jour
            logger.info(`Produit mis à jour: ${updatedProduct.id} (${updatedProduct.name})`);
            const missingFields = [];
            if (!product.description) missingFields.push('description');
            if (!product.imageUrl) missingFields.push('imageUrl');
            if (!product.productUrl) missingFields.push('productUrl');
            if (!product.stock) missingFields.push('stock');
            if (!product.sku) missingFields.push('sku');
            if (!product.brand) missingFields.push('brand');
            if (!product.category) missingFields.push('category');
            
            if (missingFields.length > 0) {
              logger.warn(`Champs manquants pour le produit ${updatedProduct.id}: ${missingFields.join(', ')}`);
            }

            return {
              externalId: product.externalId,
              status: 'updated',
              productId: updatedProduct.id,
            };
          } else {
            // Créer un nouveau produit
            // Créer un objet de données avec tous les champs disponibles
            const productData: any = {
              externalId: product.externalId,
              name: product.name,
              price: product.price,
              description: product.description,
              stock: product.stock || 0,
              imageUrl: product.imageUrl,
              productUrl: product.productUrl,
              vendorId,
            };
            
            // Ajouter les champs supplémentaires s'ils existent
            if (product.sku) productData.sku = product.sku;
            if (product.brand) productData.brand = product.brand;
            if (product.category) productData.category = product.category;
            if (product.variants) productData.variants = JSON.stringify(product.variants);
            if (product.weight) productData.weight = product.weight;
            if (product.dimensions) productData.dimensions = product.dimensions;
            if (product.attributes) productData.attributes = JSON.stringify(product.attributes);
            
            // Créer le produit avec toutes les données disponibles
            const newProduct = await prisma.product.create({
              data: productData,
            });
            
            // Journaliser les champs manquants
            logger.info(`Nouveau produit créé: ${newProduct.id} (${newProduct.name})`);
            const missingFields = [];
            if (!product.description) missingFields.push('description');
            if (!product.imageUrl) missingFields.push('imageUrl');
            if (!product.productUrl) missingFields.push('productUrl');
            if (!product.stock) missingFields.push('stock');
            if (!product.sku) missingFields.push('sku');
            if (!product.brand) missingFields.push('brand');
            if (!product.category) missingFields.push('category');
            
            if (missingFields.length > 0) {
              logger.warn(`Champs manquants pour le nouveau produit ${newProduct.id}: ${missingFields.join(', ')}`);
            }

            return {
              externalId: product.externalId,
              status: 'created',
              productId: newProduct.id,
            };
          }
        } catch (error) {
          console.error(`Erreur lors du traitement du produit ${product.externalId}:`, error);
          return {
            externalId: product.externalId,
            status: 'error',
            message: 'Erreur lors du traitement du produit',
          };
        }
      })
    );

    // Mettre à jour la date de dernière synchronisation du vendeur
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { lastSyncedAt: new Date() },
    });

    return {
      success: true,
      syncedAt: new Date(),
      results: syncResults,
      totalProducts: products.length,
      created: syncResults.filter(r => r.status === 'created').length,
      updated: syncResults.filter(r => r.status === 'updated').length,
      errors: syncResults.filter(r => r.status === 'error').length,
    };
  } catch (error) {
    console.error('Erreur lors de la synchronisation des produits du vendeur:', error);
    throw error;
  }
}

/**
 * Synchronise les produits de tous les vendeurs actifs
 */
export async function syncAllVendors(): Promise<any> {
  try {
    // Récupérer tous les vendeurs avec synchronisation activée
    const vendors = await prisma.vendor.findMany({
      where: { syncEnabled: true },
    });

    if (vendors.length === 0) {
      return {
        success: true,
        message: 'Aucun vendeur actif trouvé',
        syncedAt: new Date(),
      };
    }

    // Synchroniser les produits de chaque vendeur
    const results = await Promise.all(
      vendors.map(async (vendor) => {
        try {
          const result = await syncVendorProducts(vendor.id);
          return {
            vendorId: vendor.id,
            storeName: vendor.storeName,
            success: true,
            ...result,
          };
        } catch (error) {
          console.error(`Erreur lors de la synchronisation du vendeur ${vendor.id}:`, error);
          return {
            vendorId: vendor.id,
            storeName: vendor.storeName,
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          };
        }
      })
    );

    return {
      success: true,
      syncedAt: new Date(),
      results,
      totalVendors: vendors.length,
      successfulSyncs: results.filter(r => r.success).length,
      failedSyncs: results.filter(r => !r.success).length,
    };
  } catch (error) {
    console.error('Erreur lors de la synchronisation de tous les vendeurs:', error);
    throw error;
  }
}
