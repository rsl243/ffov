import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withVendorAuth } from '@/lib/auth-middleware';

// POST /api/vendors/[id]/sync : synchronise les produits d'un vendeur
export const POST = withVendorAuth(async (
  request: NextRequest,
  { params, vendor }: { params: { id: string }, vendor: any }
) => {
  try {
    const vendorId = params.id;
    
    // Vérifier si l'ID du vendeur dans l'URL correspond à celui authentifié
    if (vendor.id !== vendorId) {
      return NextResponse.json(
        { error: 'Accès non autorisé à ce vendeur' },
        { status: 403 }
      );
    }

    // Vérifier si le vendeur existe
    const vendorExists = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendorExists) {
      return NextResponse.json(
        { error: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les données des produits depuis la requête
    const body = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Format de données invalide. Un tableau de produits est requis.' },
        { status: 400 }
      );
    }

    // Traiter chaque produit
    const syncResults = await Promise.all(
      products.map(async (product: any) => {
        const { 
          externalId, 
          name, 
          price, 
          description, 
          stock, 
          imageUrl, 
          productUrl, 
          sku, 
          brand, 
          category, 
          variants, 
          weight, 
          dimensions, 
          attributes 
        } = product;

        if (!externalId || !name || price === undefined) {
          return {
            externalId: externalId || 'unknown',
            status: 'error',
            message: 'Données de produit incomplètes',
          };
        }
        
        // Vérifier et journaliser les champs manquants
        const missingFields = [];
        if (!description) missingFields.push('description');
        if (!imageUrl) missingFields.push('imageUrl');
        if (!productUrl) missingFields.push('productUrl');
        
        // Traitement des variantes (tailles)
        let processedVariants = variants;
        if (variants) {
          // Si les variantes sont une chaîne, essayer de les parser en JSON
          if (typeof variants === 'string') {
            try {
              const parsedVariants = JSON.parse(variants);
              processedVariants = Array.isArray(parsedVariants) ? parsedVariants : [variants];
            } catch (e) {
              // Si le parsing échoue, considérer comme une seule variante
              processedVariants = [variants];
            }
          } else if (Array.isArray(variants)) {
            // Déjà un tableau, le garder tel quel
            processedVariants = variants;
          } else if (variants && typeof variants === 'object') {
            // Si c'est un objet, extraire les valeurs
            processedVariants = Object.values(variants);
          } else {
            // Autre cas, convertir en tableau avec une seule entrée
            processedVariants = [String(variants)];
          }
        } else {
          processedVariants = [];
        }
        
        // Traitement des couleurs (catégorie)
        let processedColors = category;
        if (category) {
          // Si la catégorie est une chaîne, la considérer comme liste de couleurs
          if (typeof category === 'string') {
            // Garder telle quelle
            processedColors = category;
          } else if (Array.isArray(category)) {
            // Si c'est un tableau, le joindre en chaîne
            processedColors = category.join(', ');
          } else if (category && typeof category === 'object') {
            // Si c'est un objet, extraire les valeurs et les joindre
            processedColors = Object.values(category).join(', ');
          } else {
            // Autre cas, convertir en chaîne
            processedColors = String(category);
          }
        } else {
          processedColors = '';
        }
        
        // Journaliser si des champs importants sont manquants
        if (missingFields.length > 0) {
          console.warn(`Produit ${externalId} incomplet. Champs manquants: ${missingFields.join(', ')}`);
        }

        try {
          // Vérifier si le produit existe déjà (par externalId et vendorId)
          const existingProduct = await prisma.product.findFirst({
            where: {
              externalId,
              vendorId,
            },
          });

          if (existingProduct) {
            // Mettre à jour le produit existant
            // Créer un objet de données avec tous les champs disponibles
            const productData: any = {
              name,
              price: parseFloat(price.toString()),
              updatedAt: new Date(),
            };
            
            // Ajouter les champs optionnels s'ils existent
            if (description !== undefined) productData.description = description;
            if (stock !== undefined) productData.stock = stock || 0;
            if (imageUrl !== undefined) productData.imageUrl = imageUrl;
            if (productUrl !== undefined) productData.productUrl = productUrl;
            if (sku !== undefined) productData.sku = sku;
            if (brand !== undefined) productData.brand = brand;
            if (processedColors !== undefined) productData.category = processedColors;
            if (processedVariants !== undefined) productData.variants = typeof processedVariants === 'string' ? processedVariants : JSON.stringify(processedVariants);
            if (weight !== undefined) productData.weight = typeof weight === 'number' ? weight : parseFloat(weight);
            if (dimensions !== undefined) productData.dimensions = dimensions;
            if (attributes !== undefined) productData.attributes = typeof attributes === 'string' ? attributes : JSON.stringify(attributes);
            
            // Mettre à jour le produit avec toutes les données disponibles
            const updatedProduct = await prisma.product.update({
              where: { id: existingProduct.id },
              data: productData,
            });
            
            // Journaliser la mise à jour
            console.log(`Produit mis à jour: ${updatedProduct.id} (${updatedProduct.name})`);
            if (missingFields.length > 0) {
              console.warn(`Champs manquants pour le produit ${updatedProduct.id}: ${missingFields.join(', ')}`);
            }

            return {
              externalId,
              status: 'updated',
              productId: updatedProduct.id,
            };
          } else {
            // Créer un nouveau produit
            // Créer un objet de données avec tous les champs disponibles
            const productData: any = {
              externalId,
              name,
              price: parseFloat(price.toString()),
              vendorId,
            };
            
            // Ajouter les champs optionnels s'ils existent
            if (description !== undefined) productData.description = description;
            if (stock !== undefined) productData.stock = stock || 0;
            if (imageUrl !== undefined) productData.imageUrl = imageUrl;
            if (productUrl !== undefined) productData.productUrl = productUrl;
            if (sku !== undefined) productData.sku = sku;
            if (brand !== undefined) productData.brand = brand;
            if (processedColors !== undefined) productData.category = processedColors;
            if (processedVariants !== undefined) productData.variants = typeof processedVariants === 'string' ? processedVariants : JSON.stringify(processedVariants);
            if (weight !== undefined) productData.weight = typeof weight === 'number' ? weight : parseFloat(weight);
            if (dimensions !== undefined) productData.dimensions = dimensions;
            if (attributes !== undefined) productData.attributes = typeof attributes === 'string' ? attributes : JSON.stringify(attributes);
            
            // Créer le produit avec toutes les données disponibles
            const newProduct = await prisma.product.create({
              data: productData,
            });
            
            // Journaliser la création
            console.log(`Nouveau produit créé: ${newProduct.id} (${newProduct.name})`);
            if (missingFields.length > 0) {
              console.warn(`Champs manquants pour le nouveau produit ${newProduct.id}: ${missingFields.join(', ')}`);
            }

            return {
              externalId,
              status: 'created',
              productId: newProduct.id,
            };
          }
        } catch (error) {
          console.error(`Erreur lors du traitement du produit ${externalId}:`, error);
          return {
            externalId,
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

    return NextResponse.json({
      success: true,
      syncedAt: new Date(),
      results: syncResults,
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation des produits:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation des produits' },
      { status: 500 }
    );
  }
});

// GET /api/vendors/[id]/sync : récupère l'état de synchronisation d'un vendeur
export const GET = withVendorAuth(async (
  request: NextRequest,
  { params, vendor }: { params: { id: string }, vendor: any }
) => {
  try {
    const vendorId = params.id;
    
    // Vérifier si l'ID du vendeur dans l'URL correspond à celui authentifié
    if (vendor.id !== vendorId) {
      return NextResponse.json(
        { error: 'Accès non autorisé à ce vendeur' },
        { status: 403 }
      );
    }

    // Récupérer le vendeur avec ses produits
    const vendorData = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        products: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!vendorData) {
      return NextResponse.json(
        { error: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      vendor: {
        id: vendorData.id,
        storeName: vendorData.storeName,
        websiteUrl: vendorData.websiteUrl,
        lastSyncedAt: vendorData.lastSyncedAt,
        syncEnabled: vendorData.syncEnabled,
        user: vendorData.user,
      },
      productCount: vendorData.products.length,
      syncStatus: vendorData.lastSyncedAt 
        ? { lastSync: vendorData.lastSyncedAt, status: 'synced' }
        : { status: 'never_synced' },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état de synchronisation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
});
