/**
 * Extracteur spécialisé pour les sites Shopify
 * Optimisé pour extraire les données produits des sites utilisant la plateforme Shopify
 * (comme Le Dressing de Cloé)
 */

import { Page } from 'playwright';
import { logger } from '../logger';
import { ExtractedProduct, ProductVariant } from '../product-extractor';

// Déclarations de types pour les objets globaux de fenêtre
declare global {
  interface Window {
    Shopify?: any;
    ShopifyAnalytics?: any;
  }
}

/**
 * Extrait les produits d'un site Shopify
 * @param page Page Playwright
 * @param url URL du site
 * @returns Liste des produits extraits
 */
export async function extractShopifyProducts(page: Page, url: string): Promise<ExtractedProduct[]> {
  logger.info('Utilisation de l\'extracteur spécialisé pour Shopify');
  
  // 1. Extraction des produits à partir de la page actuelle
  const products = await extractProductsFromCurrentPage(page, url);
  
  // 2. Si des produits ont été trouvés mais manquent de détails, visiter leurs pages individuelles
  if (products.length > 0) {
    logger.info(`${products.length} produits trouvés, enrichissement des données manquantes...`);
    
    // Ne conserver que les produits incomplets qui ont une URL de produit
    const productsToEnrich = products
      .filter(p => p.productUrl && (!p.description || !p.sizes || p.sizes.length === 0))
      .slice(0, 5); // Limiter à 5 produits pour éviter les temps d'exécution trop longs
    
    // Produits déjà complets
    const completeProducts = products.filter(p => 
      !p.productUrl || (p.description && p.sizes && p.sizes.length > 0)
    );
    
    // Enrichir chaque produit incomplet
    for (let i = 0; i < productsToEnrich.length; i++) {
      const product = productsToEnrich[i];
      logger.info(`Enrichissement du produit ${i+1}/${productsToEnrich.length}: ${product.name}`);
      
      try {
        // Visiter la page du produit
        await page.goto(product.productUrl!, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        
        // Extraire les données détaillées
        const detailedProducts = await extractProductsFromCurrentPage(page, product.productUrl!);
        
        if (detailedProducts && detailedProducts.length > 0) {
          const detailedProduct = detailedProducts[0];
          
          // Mettre à jour les propriétés manquantes
          if (detailedProduct.description) product.description = detailedProduct.description;
          if (detailedProduct.colors && detailedProduct.colors.length > 0) product.colors = detailedProduct.colors;
          if (detailedProduct.sizes && detailedProduct.sizes.length > 0) product.sizes = detailedProduct.sizes;
          if (detailedProduct.variants && detailedProduct.variants.length > 0) product.variants = detailedProduct.variants;
          if (detailedProduct.imageUrls && detailedProduct.imageUrls.length > 0) {
            product.imageUrls = detailedProduct.imageUrls;
            if (!product.imageUrl && product.imageUrls.length > 0) {
              product.imageUrl = product.imageUrls[0];
            }
          }
          if (detailedProduct.brand) product.brand = detailedProduct.brand;
          if (detailedProduct.category) product.category = detailedProduct.category;
          if (detailedProduct.sku) product.sku = detailedProduct.sku;
        }
      } catch (error) {
        logger.error(`Erreur lors de l'enrichissement du produit: ${error}`);
      }
    }
    
    // Combiner les produits enrichis avec les produits déjà complets
    return [...completeProducts, ...productsToEnrich];
  }
  
  return products;
}

/**
 * Extrait les produits de la page Shopify actuellement chargée
 * @param page Page Playwright
 * @param currentUrl URL de la page actuelle
 * @returns Liste des produits extraits
 */
async function extractProductsFromCurrentPage(page: Page, currentUrl: string): Promise<ExtractedProduct[]> {
  // Extraction des produits via l'évaluation du contexte de la page
  return await page.evaluate((url: string) => {
    // Fonction utilitaire pour nettoyer le HTML
    const cleanHTML = (html: string): string => {
      if (!html) return '';
      return html
        .replace(/<\/?[^>]+(>|$)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    // Vérifier si c'est une page produit individuelle ou une collection
    const isProductPage = window.location.pathname.includes('/products/');
    const extractedProducts: any[] = [];
    
    // MÉTHODE 1: Utiliser ShopifyAnalytics qui contient souvent les données produit
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      console.log('ShopifyAnalytics détecté');
      const meta = window.ShopifyAnalytics.meta;
      
      // Pour une page produit individuelle
      if (isProductPage && meta.product) {
        const p = meta.product;
        
        // Extraire les options (couleurs/tailles)
        const colors: string[] = [];
        const sizes: string[] = [];
        if (p.options) {
          p.options.forEach((option: any) => {
            if (option.name && (option.name.toLowerCase().includes('couleur') || option.name.toLowerCase().includes('color'))) {
              colors.push(...(option.values || []));
            } else if (option.name && (option.name.toLowerCase().includes('taille') || option.name.toLowerCase().includes('size'))) {
              sizes.push(...(option.values || []));
            }
          });
        }
        
        // Convertir les variantes au format attendu
        const variants = (p.variants || []).map((v: any) => ({
          id: v.id.toString(),
          sku: v.sku || '',
          color: v.option1 || '',
          size: v.option2 || '',
          price: parseFloat(v.price) / 100 || 0,
          stock: v.available === false ? 0 : 1
        }));
        
        extractedProducts.push({
          externalId: p.id.toString(),
          name: p.title,
          price: parseFloat(p.price) / 100,
          description: cleanHTML(p.description || ''),
          stock: p.available === false ? 0 : 1,
          imageUrl: p.featured_image || '',
          imageUrls: p.images || [],
          productUrl: window.location.href,
          sku: p.sku || p.id.toString(),
          brand: meta.page && meta.page.vendor ? meta.page.vendor : '',
          category: p.type || '',
          colors: colors,
          sizes: sizes,
          variants: variants
        });
        
        return extractedProducts;
      }
      
      // Pour une page collection
      if (meta.products && Array.isArray(meta.products) && meta.products.length > 0) {
        console.log(`${meta.products.length} produits trouvés via ShopifyAnalytics`);
        
        meta.products.forEach((p: any) => {
          extractedProducts.push({
            externalId: p.id.toString(),
            name: p.title,
            price: parseFloat(p.price) / 100,
            description: cleanHTML(p.description || ''),
            imageUrl: p.featured_image || '',
            productUrl: `${window.location.origin}/products/${p.handle}`,
            sku: p.id.toString(),
            brand: meta.page && meta.page.vendor ? meta.page.vendor : '',
            category: p.type || ''
          });
        });
        
        return extractedProducts;
      }
    }
    
    // MÉTHODE 2: Rechercher dans les scripts de type application/json
    console.log('Recherche dans les scripts JSON...');
    const jsonElements = document.querySelectorAll('script[type="application/json"]');
    for (const element of jsonElements) {
      try {
        const json = JSON.parse(element.textContent!);
        
        // Pour une page produit
        if (isProductPage && json.product) {
          const p = json.product;
          console.log('Données produit trouvées dans JSON script');
          
          // Extraire les options (couleurs/tailles)
          const colors: string[] = [];
          const sizes: string[] = [];
          if (p.options) {
            p.options.forEach((option: any) => {
              if (option.name && (option.name.toLowerCase().includes('couleur') || option.name.toLowerCase().includes('color'))) {
                colors.push(...(option.values || []));
              } else if (option.name && (option.name.toLowerCase().includes('taille') || option.name.toLowerCase().includes('size'))) {
                sizes.push(...(option.values || []));
              }
            });
          }
          
          // Convertir les variantes
          const variants = (p.variants || []).map((v: any) => ({
            id: v.id.toString(),
            sku: v.sku || '',
            color: v.option1 || '',
            size: v.option2 || '',
            price: parseFloat(v.price) / 100 || parseFloat(p.price) / 100,
            stock: v.available === false ? 0 : 1
          }));
          
          // Extraire les images
          let images: string[] = [];
          if (p.images && Array.isArray(p.images)) {
            images = p.images.map((img: any) => {
              if (typeof img === 'string') return img;
              return img.src || img.original || img.url || '';
            }).filter(Boolean);
          }
          
          extractedProducts.push({
            externalId: p.id.toString(),
            name: p.title,
            price: parseFloat(p.price) / 100,
            description: cleanHTML(p.description || ''),
            stock: p.available === false ? 0 : 1,
            imageUrl: images[0] || '',
            imageUrls: images,
            productUrl: window.location.href,
            sku: p.sku || p.id.toString(),
            brand: p.vendor || '',
            category: p.type || '',
            colors: colors,
            sizes: sizes,
            variants: variants
          });
          
          return extractedProducts;
        }
        
        // Pour les collections
        if (json.products && Array.isArray(json.products) && json.products.length > 0) {
          console.log(`${json.products.length} produits trouvés dans JSON script`);
          
          json.products.forEach((p: any) => {
            extractedProducts.push({
              externalId: p.id.toString(),
              name: p.title || '',
              price: parseFloat(p.price) / 100 || 0,
              imageUrl: p.featured_image || p.image || '',
              productUrl: `${window.location.origin}/products/${p.handle}`,
              sku: p.id.toString(),
              brand: p.vendor || '',
              category: p.type || ''
            });
          });
          
          if (extractedProducts.length > 0) {
            return extractedProducts;
          }
        }
      } catch (e) {
        // Ignorer les erreurs de parsing JSON
      }
    }
    
    // MÉTHODE 3: Extraction directe depuis le HTML (fallback)
    console.log('Extraction à partir du HTML...');
    
    if (isProductPage) {
      // Pour une page produit individuelle
      const title = document.querySelector('h1.product-single__title, h1.product__title, h1.title, .product__title');
      const price = document.querySelector('.product__price, .price__current, .product-single__price, [class*="product-price"]');
      const description = document.querySelector('.product-single__description, .product__description, .description, [class*="product-description"]');
      const image = document.querySelector('.product-featured-img, .product-single__media img, .product-image-main');
      
      if (title) {
        // Variables pour stocker les données collectées
        let priceValue = 0;
        let descriptionText = '';
        let imageUrl = '';
        let colors: string[] = [];
        let sizes: string[] = [];
        
        // Extraire le prix
        if (price) {
          const priceText = price.textContent!.trim();
          const priceMatch = priceText.match(/(\d+[,.]\d+|\d+)/);
          if (priceMatch) {
            priceValue = parseFloat(priceMatch[0].replace(',', '.'));
          }
        }
        
        // Extraire la description
        if (description) {
          descriptionText = description.textContent!.trim();
        }
        
        // Extraire l'image
        if (image) {
          imageUrl = (image as HTMLImageElement).getAttribute('src') || 
                     (image as HTMLImageElement).getAttribute('data-src') || '';
                     
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = new URL(imageUrl, window.location.origin).href;
          }
        }
        
        // Extraire les variantes de couleur et taille
        const variantSelectors = document.querySelectorAll('.single-option-selector, .swatch-element, [data-option-index], [data-option]');
        variantSelectors.forEach(selector => {
          // Déterminer le type d'option (couleur ou taille)
          const optionType = selector.getAttribute('data-option-name') || 
                          selector.getAttribute('data-option-index') || 
                          (selector.previousElementSibling as HTMLElement)?.textContent || '';
          
          const isColor = optionType.toLowerCase().includes('couleur') || optionType.toLowerCase().includes('color');
          const isSize = optionType.toLowerCase().includes('taille') || optionType.toLowerCase().includes('size');
          
          // Collecter les valeurs
          if (isColor || isSize) {
            const options = selector.querySelectorAll('option, [data-value]');
            options.forEach(opt => {
              const value = opt.getAttribute('value') || 
                          opt.getAttribute('data-value') || 
                          opt.textContent!.trim();
                          
              if (value && value !== 'Default Title') {
                if (isColor && !colors.includes(value)) colors.push(value);
                if (isSize && !sizes.includes(value)) sizes.push(value);
              }
            });
          }
        });
        
        // Ajouter le produit à la liste
        extractedProducts.push({
          externalId: window.location.pathname.split('/').pop() || '',
          name: title.textContent!.trim(),
          price: priceValue,
          description: descriptionText,
          imageUrl: imageUrl,
          productUrl: window.location.href,
          colors: colors,
          sizes: sizes
        });
      }
    } else {
      // Pour une page collection
      const productElements = document.querySelectorAll('.grid__item, .grid-item, .product-card, [data-product-id]');
      
      productElements.forEach(element => {
        const link = element.querySelector('a[href*="/products/"]');
        const title = element.querySelector('[class*="title"], [class*="name"], h2, h3');
        const priceElement = element.querySelector('[class*="price"]');
        const image = element.querySelector('img');
        
        if (title && link) {
          // Extraire les données de base
          let priceValue = 0;
          let productUrl = (link as HTMLAnchorElement).getAttribute('href') || '';
          let imageUrl = '';
          
          // Normaliser l'URL
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = new URL(productUrl, window.location.origin).href;
          }
          
          // Extraire le prix
          if (priceElement) {
            const priceText = priceElement.textContent!.trim();
            const priceMatch = priceText.match(/(\d+[,.]\d+|\d+)/);
            if (priceMatch) {
              priceValue = parseFloat(priceMatch[0].replace(',', '.'));
            }
          }
          
          // Extraire l'image
          if (image) {
            imageUrl = (image as HTMLImageElement).getAttribute('src') || 
                       (image as HTMLImageElement).getAttribute('data-src') || '';
                       
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = new URL(imageUrl, window.location.origin).href;
            }
          }
          
          // Ajouter le produit à la liste
          extractedProducts.push({
            externalId: productUrl.split('/').pop()!.split('?')[0] || '',
            name: title.textContent!.trim(),
            price: priceValue,
            imageUrl: imageUrl,
            productUrl: productUrl
          });
        }
      });
    }
    
    return extractedProducts;
  }, currentUrl) as ExtractedProduct[];
}
