/**
 * Extracteur générique pour les sites e-commerce
 * Utilisé comme fallback lorsqu'aucun extracteur spécialisé ne correspond au site
 */

import { Page } from 'playwright';
import { logger } from '../logger';
import { ExtractedProduct } from '../product-extractor';

/**
 * Extrait les produits d'un site e-commerce en utilisant une approche générique
 * @param page Page Playwright
 * @param url URL du site
 * @returns Liste des produits extraits
 */
export async function extractGenericProducts(page: Page, url: string): Promise<ExtractedProduct[]> {
  logger.info('Utilisation de l\'extracteur générique');
  
  // 1. Préparation de la page
  await preparePageForExtraction(page);
  
  // 2. Détecter si c'est une page produit ou une page liste
  const isProductPage = await page.evaluate(() => {
    // Heuristiques pour détecter une page produit
    const hasAddToCart = !!document.querySelector('button[name*="add"], button[id*="add-to-cart"], [class*="add-to-cart"]');
    const hasSingleProductTitle = document.querySelectorAll('h1, h2').length < 3;
    const hasProductImages = document.querySelectorAll('.product-image, [class*="product-gallery"], [class*="product-image"]').length > 0;
    const hasVariants = document.querySelectorAll('select[name*="option"], [class*="variant"], [class*="swatch"]').length > 0;
    
    // Si plusieurs de ces critères sont vrais, c'est probablement une page produit
    let score = 0;
    if (hasAddToCart) score += 2;
    if (hasSingleProductTitle) score += 1;
    if (hasProductImages) score += 1;
    if (hasVariants) score += 1;
    
    return score >= 3;
  });
  
  // 3. Extraire les produits avec l'approche appropriée
  let products: ExtractedProduct[] = [];
  
  if (isProductPage) {
    logger.info('Page produit détectée, extraction du produit unique');
    products = await extractSingleProduct(page, url);
  } else {
    logger.info('Page liste détectée, extraction de la liste de produits');
    products = await extractProductList(page, url);
    
    // 4. Enrichir les produits si nécessaire
    if (products.length > 0) {
      // Limiter à 5 produits à enrichir pour éviter des temps d'exécution trop longs
      const productsToEnrich = products.slice(0, 5);
      const enrichedProducts: ExtractedProduct[] = [];
      
      for (let i = 0; i < productsToEnrich.length; i++) {
        const product = productsToEnrich[i];
        
        if (product.productUrl) {
          logger.info(`Enrichissement du produit ${i+1}/${productsToEnrich.length}: ${product.name}`);
          
          try {
            // Naviguer vers la page du produit
            await page.goto(product.productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
            
            // Extraire les détails complets du produit
            const detailedProducts = await extractSingleProduct(page, product.productUrl);
            
            if (detailedProducts.length > 0) {
              const detailedProduct = detailedProducts[0];
              
              // Fusionner les données détaillées avec le produit original
              if (detailedProduct.description) product.description = detailedProduct.description;
              if (detailedProduct.imageUrls) product.imageUrls = detailedProduct.imageUrls;
              if (detailedProduct.colors) product.colors = detailedProduct.colors;
              if (detailedProduct.sizes) product.sizes = detailedProduct.sizes;
              if (detailedProduct.variants) product.variants = detailedProduct.variants;
              if (detailedProduct.brand) product.brand = detailedProduct.brand;
              if (detailedProduct.category) product.category = detailedProduct.category;
            }
          } catch (error) {
            logger.error(`Erreur lors de l'enrichissement du produit: ${error}`);
          }
        }
        
        enrichedProducts.push(product);
      }
      
      // Ajouter les produits enrichis au début de la liste
      products = [...enrichedProducts, ...products.slice(5)];
    }
  }
  
  return products;
}

/**
 * Prépare la page pour l'extraction
 * @param page Page Playwright
 */
async function preparePageForExtraction(page: Page): Promise<void> {
  // Accepter les cookies et fermer les popups
  try {
    const cookieSelectors = [
      '[aria-label*="cookie"] button:first-child',
      '[class*="cookie"] button:first-child',
      'button:has-text("Accepter")',
      'button:has-text("Accept")',
      'button:has-text("Agree")'
    ];
    
    for (const selector of cookieSelectors) {
      const hasElement = await page.$(selector);
      if (hasElement) {
        await page.click(selector).catch(() => {});
        break;
      }
    }
    
    // Attendre que les popups disparaissent
    await page.waitForTimeout(1000);
  } catch (error) {
    logger.warn('Erreur lors de la gestion des cookies');
  }
  
  // Défiler la page pour charger tous les éléments
  await page.evaluate(async () => {
    const scrollStep = 200;
    const scrollDelay = 100;
    
    let lastScrollTop = -1;
    let scrollTop = 0;
    
    while (scrollTop !== lastScrollTop) {
      lastScrollTop = scrollTop;
      window.scrollBy(0, scrollStep);
      await new Promise(resolve => setTimeout(resolve, scrollDelay));
      scrollTop = window.scrollY;
    }
    
    // Revenir en haut
    window.scrollTo(0, 0);
  });
}

/**
 * Extrait un produit unique d'une page produit
 * @param page Page Playwright
 * @param url URL de la page
 * @returns Liste contenant le produit extrait
 */
async function extractSingleProduct(page: Page, url: string): Promise<ExtractedProduct[]> {
  return await page.evaluate((currentUrl: string) => {
    const cleanText = (text: string): string => {
      return text.replace(/\s+/g, ' ').trim();
    };
    
    const makeAbsoluteUrl = (url: string): string => {
      if (!url) return '';
      try {
        return new URL(url, window.location.origin).href;
      } catch (e) {
        return url;
      }
    };
    
    // Récupérer le titre du produit
    const titleSelectors = [
      'h1.product-title', 'h1.product-name', 'h1.product_title', 'h1.product__title',
      'h1[itemprop="name"]', 'h1.title', 'h1', '.product-title', '.product-name'
    ];
    
    let title = '';
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        title = cleanText(element.textContent);
        break;
      }
    }
    
    if (!title) return [];
    
    // Récupérer le prix
    const priceSelectors = [
      '.price', '[itemprop="price"]', '.product-price', '.price-value',
      '.current-price', '[data-product-price]', '[class*="product-price"]'
    ];
    
    let price = 0;
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const priceText = element.textContent.trim();
        const matches = priceText.match(/(\d+[,.]\d+|\d+)/);
        
        if (matches && matches[0]) {
          price = parseFloat(matches[0].replace(',', '.'));
          break;
        }
      }
    }
    
    // Récupérer la description
    const descriptionSelectors = [
      '[itemprop="description"]', '.product-description', '.description',
      '.product__description', '#description', '[class*="product-description"]'
    ];
    
    let description = '';
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        description = cleanText(element.textContent);
        break;
      }
    }
    
    // Récupérer l'image principale
    const imageSelectors = [
      '[itemprop="image"]', '.product-image', '.product-img', '.product__image',
      '.product-featured-img', '.main-image', '[data-zoom-image]', '[class*="product-image"]'
    ];
    
    let imageUrl = '';
    for (const selector of imageSelectors) {
      const element = document.querySelector(selector) as HTMLImageElement;
      if (element) {
        imageUrl = element.src || element.getAttribute('data-src') || element.getAttribute('data-zoom-image') || '';
        if (imageUrl) {
          imageUrl = makeAbsoluteUrl(imageUrl);
          break;
        }
      }
    }
    
    // Récupérer toutes les images
    const imageElements = document.querySelectorAll('[class*="product-gallery"] img, [class*="thumbnail"] img, [class*="product-image"] img');
    const imageUrls: string[] = [];
    
    if (imageUrl) imageUrls.push(imageUrl);
    
    imageElements.forEach(element => {
      const img = element as HTMLImageElement;
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-zoom-image') || '';
      
      if (src && !imageUrls.includes(src)) {
        imageUrls.push(makeAbsoluteUrl(src));
      }
    });
    
    // Récupérer la catégorie
    const categorySelectors = [
      '.breadcrumb', '[itemprop="breadcrumb"]', '.product-category',
      '[class*="category"]', '[data-category]'
    ];
    
    let category = '';
    for (const selector of categorySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        category = cleanText(element.textContent)
          .replace(/^Accueil\s*>\s*|^Home\s*>\s*/i, '')
          .replace(/\s*>\s*$/, '');
        break;
      }
    }
    
    // Récupérer la marque
    const brandSelectors = [
      '[itemprop="brand"]', '.brand', '[class*="brand"]', '.vendor',
      '[data-product-vendor]', '[class*="vendor"]'
    ];
    
    let brand = '';
    for (const selector of brandSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        brand = cleanText(element.textContent);
        break;
      }
    }
    
    // Récupérer les couleurs
    const colorSelectors = [
      '[data-option-name="color"]', '[data-option-name="couleur"]',
      '[class*="color-swatch"]', '[data-color]', '[class*="color-option"]'
    ];
    
    const colors: string[] = [];
    for (const selector of colorSelectors) {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        const colorValue = element.getAttribute('data-value') || 
                          element.getAttribute('title') || 
                          element.textContent?.trim() || '';
                          
        if (colorValue && !colors.includes(colorValue)) {
          colors.push(colorValue);
        }
      });
      
      if (colors.length > 0) break;
    }
    
    // Récupérer les tailles
    const sizeSelectors = [
      '[data-option-name="size"]', '[data-option-name="taille"]',
      '[class*="size-swatch"]', '[data-size]', '[class*="size-option"]'
    ];
    
    const sizes: string[] = [];
    for (const selector of sizeSelectors) {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        const sizeValue = element.getAttribute('data-value') || 
                         element.getAttribute('title') || 
                         element.textContent?.trim() || '';
                         
        if (sizeValue && !sizes.includes(sizeValue)) {
          sizes.push(sizeValue);
        }
      });
      
      if (sizes.length > 0) break;
    }
    
    // Récupérer le SKU
    const skuSelectors = [
      '[itemprop="sku"]', '.sku', '[data-product-sku]', '[class*="product-sku"]'
    ];
    
    let sku = '';
    for (const selector of skuSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        sku = cleanText(element.textContent).replace(/SKU:\s*/i, '');
        break;
      }
    }
    
    if (!sku) {
      // Générer un SKU à partir de l'URL si aucun n'est trouvé
      const urlPath = window.location.pathname;
      const pathParts = urlPath.split('/');
      sku = pathParts[pathParts.length - 1].replace(/\?.*$/, '');
    }
    
    // Générer un ID externe
    const externalId = sku || window.location.pathname.split('/').pop() || '';
    
    // Créer l'objet produit
    return [{
      externalId,
      name: title,
      price,
      description,
      imageUrl,
      imageUrls,
      productUrl: window.location.href,
      sku,
      brand,
      category,
      colors: colors.length > 0 ? colors : undefined,
      sizes: sizes.length > 0 ? sizes : undefined
    }];
  }, url) as ExtractedProduct[];
}

/**
 * Extrait une liste de produits d'une page liste
 * @param page Page Playwright
 * @param url URL de la page
 * @returns Liste de produits extraits
 */
async function extractProductList(page: Page, url: string): Promise<ExtractedProduct[]> {
  return await page.evaluate((currentUrl: string) => {
    const makeAbsoluteUrl = (url: string): string => {
      if (!url) return '';
      try {
        return new URL(url, window.location.origin).href;
      } catch (e) {
        return url;
      }
    };
    
    const extractedProducts: any[] = [];
    
    // Sélecteurs courants pour des cartes de produits
    const productCardSelectors = [
      '.product-card', '.product', '.product-item', '.item', 'article[class*="product"]',
      '[class*="product-card"]', '[class*="product-item"]', '[data-product-id]'
    ];
    
    let productElements: NodeListOf<Element> | Element[] = new NodeList() as NodeListOf<Element>;
    
    // Essayer chaque sélecteur jusqu'à ce qu'on trouve des éléments
    for (const selector of productCardSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        productElements = elements;
        break;
      }
    }
    
    // Si aucun élément n'est trouvé, essayer une approche générique
    if (productElements.length === 0) {
      // Rechercher les éléments qui semblent être des produits
      const allElements = document.querySelectorAll('a[href*="/product/"], a[href*="/products/"]');
      const uniqueParents = new Set<Element>();
      
      allElements.forEach(element => {
        const parent = element.closest('div, article, li');
        if (parent) {
          uniqueParents.add(parent);
        }
      });
      
      productElements = Array.from(uniqueParents);
    }
    
    // Limite à 20 produits
    const maxProducts = 20;
    const productLimit = Math.min(productElements.length, maxProducts);
    
    // Traiter chaque élément de produit
    for (let i = 0; i < productLimit; i++) {
      const element = productElements[i];
      
      // Trouver le lien du produit
      const linkElement = element.querySelector('a[href*="/product"], a[href*="/products"]');
      let productUrl = '';
      
      if (linkElement) {
        productUrl = makeAbsoluteUrl(linkElement.getAttribute('href') || '');
      }
      
      // Trouver le titre
      const titleElement = element.querySelector('h2, h3, h4, .product-title, [class*="product-name"], [class*="product-title"]');
      let title = '';
      
      if (titleElement) {
        title = titleElement.textContent?.trim() || '';
      }
      
      // Trouver le prix
      const priceElement = element.querySelector('.price, [class*="price"], [data-price]');
      let price = 0;
      
      if (priceElement) {
        const priceText = priceElement.textContent?.trim() || '';
        const matches = priceText.match(/(\d+[,.]\d+|\d+)/);
        
        if (matches && matches[0]) {
          price = parseFloat(matches[0].replace(',', '.'));
        }
      }
      
      // Trouver l'image
      const imageElement = element.querySelector('img');
      let imageUrl = '';
      
      if (imageElement) {
        imageUrl = makeAbsoluteUrl(
          imageElement.getAttribute('src') || 
          imageElement.getAttribute('data-src') || 
          imageElement.getAttribute('data-lazy-src') || ''
        );
      }
      
      // N'ajouter que les produits qui ont au moins un titre et un prix
      if (title && price > 0) {
        extractedProducts.push({
          externalId: productUrl.split('/').pop() || '',
          name: title,
          price,
          imageUrl,
          productUrl
        });
      }
    }
    
    return extractedProducts;
  }, url) as ExtractedProduct[];
}
