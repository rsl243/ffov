import { NextRequest, NextResponse } from 'next/server';
import { PlaywrightProductExtractor } from '@/lib/product-extractor-playwright';
import prisma from '@/lib/prisma';

/**
 * Interface pour les produits extraits des sites web
 */
interface ExtractedProduct {
  externalId: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  imageUrl?: string;
  productUrl?: string;
  sku?: string;
  brand?: string;
  category?: string;
  variants?: string[];
  weight?: number;
  dimensions?: string;
  attributes?: Record<string, any>;
}

/**
 * API de synchronisation des produits utilisant Playwright
 * Cette version est plus robuste que celle basée sur Cheerio car elle peut gérer :
 * - Le contenu chargé dynamiquement par JavaScript
 * - Les sites SPA (Single Page Applications)
 * - Les interactions utilisateur comme les clics et le défilement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer le vendeur par son ID
    const vendor = await prisma.vendor.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'URL du vendeur est définie
    if (!vendor.websiteUrl) {
      return NextResponse.json(
        { error: 'URL du vendeur non définie' },
        { status: 400 }
      );
    }

    // Initialiser l'extracteur Playwright
    const extractor = new PlaywrightProductExtractor();
    
    try {
      await extractor.initialize();
      
      // Extraire les produits du site web du vendeur
      const products = await extractor.extractProducts(vendor.websiteUrl, {
        scrollToLoad: true, // Activer le défilement pour charger plus de produits
        maxProducts: 50 // Limiter le nombre de produits à extraire
      });
      
      console.log(`Produits extraits: ${products.length}`);
      
      // Traiter les produits extraits
      const processedProducts = await processProducts(products, vendor.id);
      
      // Fermer le navigateur Playwright
      await extractor.close();
      
      return NextResponse.json({
        success: true,
        message: `${processedProducts.length} produits synchronisés avec succès`,
        products: processedProducts,
      });
    } catch (error) {
      console.error('Erreur lors de l\'extraction des produits:', error);
      
      // S'assurer que le navigateur est fermé même en cas d'erreur
      await extractor.close();
      
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des produits:', error);
    
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation des produits' },
      { status: 500 }
    );
  }
}

/**
 * Traite les produits extraits et les enregistre dans la base de données
 * @param products Produits extraits
 * @param vendorId ID du vendeur
 * @returns Produits traités
 */
async function processProducts(
  products: ExtractedProduct[],
  vendorId: string
) {
  const processedProducts = [];
  
  for (const product of products) {
    try {
      // Vérifier si le produit existe déjà
      const existingProduct = await prisma.product.findFirst({
        where: {
          vendorId,
          externalId: product.externalId,
        },
      });
      
      // Convertir les variants en JSON string pour le stockage
      const variantsString = product.variants ? JSON.stringify(product.variants) : null;
      
      // Préparer les données du produit
      const productData = {
        name: product.name,
        description: product.description || '',
        price: product.price,
        imageUrl: product.imageUrl || '',
        productUrl: product.productUrl || '',
        sku: product.sku || '',
        brand: product.brand || '',
        externalId: product.externalId,
        vendorId,
        // Stocker les variants comme JSON string
        variants: variantsString,
        // Stocker la catégorie (couleurs)
        category: product.category || '',
      };
      
      let savedProduct;
      
      if (existingProduct) {
        // Mettre à jour le produit existant
        savedProduct = await prisma.product.update({
          where: {
            id: existingProduct.id,
          },
          data: productData,
        });
      } else {
        // Créer un nouveau produit
        savedProduct = await prisma.product.create({
          data: productData,
        });
      }
      
      processedProducts.push(savedProduct);
    } catch (error) {
      console.error(`Erreur lors du traitement du produit ${product.name}:`, error);
    }
  }
  
  return processedProducts;
}
