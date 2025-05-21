/**
 * Module d'extraction de données produits
 * Fournit des fonctions spécialisées pour extraire les données produits de différents sites web
 */

import * as cheerio from 'cheerio';
import { logger } from './logger';
import { chromium, Browser, Page } from 'playwright';

export interface ExtractedProduct {
  externalId: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;         // Non prioritaire selon les nouvelles consignes
  imageUrl?: string;      // URL de l'image principale
  imageUrls?: string[];   // Toutes les images du produit
  productUrl?: string;    // URL du produit
  sku?: string;           // Référence/SKU du produit
  brand?: string;         // Non prioritaire selon les nouvelles consignes
  category?: string;      // Catégorie du produit
  colors?: string[];      // Couleurs disponibles pour le produit
  sizes?: string[];       // Tailles disponibles pour le produit
  variants?: ProductVariant[]; // Variantes détaillées du produit
  weight?: number;        // Poids du produit
  dimensions?: string;    // Dimensions du produit
  attributes?: Record<string, string>; // Attributs supplémentaires
}

// Interface pour les variantes de produit (combinaisons de couleurs, tailles, prix)
export interface ProductVariant {
  id: string;             // Identifiant unique de la variante
  color?: string;         // Couleur de la variante
  size?: string;          // Taille de la variante  
  price?: number;         // Prix spécifique à cette variante (si différent)
  imageUrl?: string;      // Image spécifique à cette variante
  sku?: string;           // SKU spécifique à cette variante
  stock?: number;         // Non prioritaire mais conservé pour compatibilité
}

/**
 * Extrait les produits d'une page web en utilisant Playwright
 * Cette méthode est plus robuste que Cheerio pour les sites web modernes avec du JavaScript
 */
export async function extractProductsWithPlaywright(websiteUrl: string): Promise<ExtractedProduct[]> {
  let browser: Browser | null = null;
  
  try {
    logger.info(`Lancement du navigateur Playwright pour ${websiteUrl}`);
    
    // Lancer un navigateur headless
    browser = await chromium.launch({
      headless: true, // true pour headless, false pour voir le navigateur
      timeout: 60000,  // timeout de 60 secondes
    });
    
    // Ouvrir une nouvelle page
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });
    
    const page = await context.newPage();
    
    // Configurer les timeouts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(45000);
    
    // Naviguer vers l'URL
    logger.info(`Navigation vers ${websiteUrl}`);
    await page.goto(websiteUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('domcontentloaded');
    
    // Optionnel: attendre un peu plus pour s'assurer que tout le JavaScript est chargé
    await page.waitForTimeout(2000);
    
    // Extraire les produits
    const products = await extractProductsFromPage(page, websiteUrl);
    
    // Fermer le navigateur
    await browser.close();
    browser = null;
    
    return products;
  } catch (error) {
    logger.error(`Erreur lors de l'extraction avec Playwright: ${error}`);
    throw error;
  } finally {
    // S'assurer que le navigateur est fermé même en cas d'erreur
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extrait les produits d'une page Playwright avec leurs variations (couleurs, tailles, prix)
 */
async function extractProductsFromPage(page: Page, websiteUrl: string): Promise<ExtractedProduct[]> {
  try {
    logger.info('Extraction des produits de la page avec leurs variations');
    
    // Recherche des produits avec différents sélecteurs communs
    const products: ExtractedProduct[] = [];
    
    // Sélecteurs courants pour les conteneurs de produits
    const productSelectors = [
      '.product', '.product-item', '.product-container', '.product-card', '[data-product-id]',
      '[data-product]', '.item-product', '.woocommerce-product', '.article', '.card',
      '.shop-item', '.grid-item', '.product-grid-item', '.boutique-item', '.thumbnail',
      '.product-wrapper', '.product-box', '.product-item-info', '.product_item', '.grid-product'
    ];
    
    // Essayer chaque sélecteur jusqu'à trouver des produits
    let foundProducts = false;
    
    // Limiter le nombre total de produits à extraire
    const MAX_PRODUCTS = 20;
    
    for (const selector of productSelectors) {
      // Vérifier si des éléments existent avec ce sélecteur
      const count = await page.$$eval(selector, els => els.length);
      
      if (count > 0) {
        logger.info(`Trouvé ${count} produits avec le sélecteur ${selector}`);
        foundProducts = true;
        
        // Extraire les données des produits (limité à MAX_PRODUCTS)
        const extractedProducts = await page.evaluate((options: { selector: string, baseUrl: string, maxProducts: number }) => {
          const elements = Array.from(document.querySelectorAll(options.selector));
          // Limiter le nombre d'éléments à traiter
          const limitedElements = elements.slice(0, options.maxProducts);
          
          return limitedElements.map((el, index) => {
            try {
              // Générer un ID externe unique pour ce produit
              let externalId = el.getAttribute('data-product-id') || 
                              el.getAttribute('data-id') || 
                              el.getAttribute('id') || 
                              `product-${index}-${Date.now().toString().substring(8)}`;
              
              // Fonction helper pour tester plusieurs sélecteurs
              const getTextFromSelectors = (selectors: string[]): string => {
                for (const sel of selectors) {
                  const element = el.querySelector(sel);
                  if (element && element.textContent) {
                    return element.textContent.trim();
                  }
                }
                return '';
              };
              
              // Fonction helper pour convertir une URL relative en absolue
              const makeAbsoluteUrl = (url: string): string => {
                if (!url) return '';
                if (url.startsWith('http')) return url;
                try {
                  return new URL(url, options.baseUrl).href;
                } catch {
                  return url;
                }
              };
              
              // Extraire le nom du produit
              const nameSelectors = [
                '.product-name', '.product-title', 'h1', 'h2', 'h3', '.title', '[itemprop="name"]',
                '.product-item-name', '.woocommerce-loop-product__title', '.product_title',
                '.product-single__title', '.product-info__title', '.card-title', '.name',
                '.product-name a', '.product-title a', '.title a', '.item-title', '.item-name'
              ];
              
              let name = getTextFromSelectors(nameSelectors);
              
              // Si on n'a pas trouvé de nom, essayer l'attribut alt de l'image
              if (!name) {
                const imgEl = el.querySelector('img');
                if (imgEl) {
                  name = imgEl.getAttribute('alt') || '';
                }
              }
              
              // Si toujours pas de nom, utiliser le texte de l'élément
              if (!name) {
                name = el.textContent?.trim().split('\n')[0] || 'Produit sans nom';
                if (name.length > 100) {
                  name = name.substring(0, 100) + '...';
                }
              }
              
              // Nettoyer le nom du produit (supprimer les prix, références, etc.)
              if (name) {
                // Supprimer les prix du nom
                name = name.replace(/\d+[,.]\d+\s*[€$£]|[€$£]\s*\d+[,.]\d+/g, '').trim();
                // Supprimer les références/SKU
                name = name.replace(/\b[A-Z0-9]{5,}\b/g, '').trim();
                // Supprimer les caractères spéciaux en trop
                name = name.replace(/^\W+|\W+$|[\r\n\t]/g, '').trim();
              }
              
              // Extraire le prix
              const priceSelectors = [
                '.price', '.product-price', '[itemprop="price"]', '.amount', '.current-price',
                '.regular-price', '.woocommerce-Price-amount', '.price-new', '.special-price',
                '[data-price]', '[data-product-price]', '.product__price', '.money'
              ];
              
              let priceText = getTextFromSelectors(priceSelectors);
              let price = 0;
              
              if (priceText) {
                // Recherche de prix avec différents formats
                const priceMatch = priceText.match(/(\d+[,.]\d+|\d+)\s*[€$£]|[€$£]\s*(\d+[,.]\d+|\d+)/);
                if (priceMatch) {
                  let matchedPrice = priceMatch[0].replace(/[^0-9,.]/g, '').replace(/\s/g, '');
                  if (matchedPrice.includes(',')) {
                    matchedPrice = matchedPrice.replace(',', '.');
                  }
                  price = parseFloat(matchedPrice);
                }
              }
              
              // Essayer d'extraire le prix depuis un attribut data
              if (price <= 0) {
                const dataPrice = el.getAttribute('data-price') || el.getAttribute('data-product-price');
                if (dataPrice) {
                  const parsedPrice = parseFloat(dataPrice.replace(',', '.'));
                  if (!isNaN(parsedPrice) && parsedPrice > 0) {
                    price = parsedPrice;
                  }
                }
              }
              
              // Description
              const descriptionSelectors = [
                '.product-description', '.description', '[itemprop="description"]', '.short-description',
                '.product-short-description', '.product-excerpt', '.product-details', '.product-text'
              ];
              const description = getTextFromSelectors(descriptionSelectors);
              
              // URL du produit
              let productUrl = '';
              const linkEl = el.querySelector('a');
              if (linkEl) {
                productUrl = linkEl.getAttribute('href') || '';
                // Convertir les URLs relatives en absolues
                productUrl = makeAbsoluteUrl(productUrl);
              }
              
              // Extraire toutes les images du produit
              let imageUrl = '';
              const imageUrls: string[] = [];
              
              // Image principale
              const imgEl = el.querySelector('img');
              if (imgEl) {
                imageUrl = imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '';
                imageUrl = makeAbsoluteUrl(imageUrl);
                if (imageUrl) {
                  imageUrls.push(imageUrl);
                }
              }
              
              // Images supplémentaires
              el.querySelectorAll('.product-gallery img, .product-image-gallery img, .thumbnail img, [data-image-id] img, .additional-images img').forEach((img: Element) => {
                const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
                if (src) {
                  const absoluteSrc = makeAbsoluteUrl(src);
                  if (!imageUrls.includes(absoluteSrc)) {
                    imageUrls.push(absoluteSrc);
                  }
                }
              });
              
              // Extraire les couleurs disponibles
              const colors: string[] = [];
              const colorSelectors = [
                '.color-option', '.color-swatch', '.color-selector', '[data-color]',
                '.swatch[data-option-name*="couleur" i]', '.swatch[data-option-name*="color" i]',
                'select[name*="color" i] option', 'select[name*="couleur" i] option',
                'input[name*="color" i]', 'input[name*="couleur" i]',
                '.color-variable', '.color-box', '.color-choice'
              ];
              
              el.querySelectorAll(colorSelectors.join(', ')).forEach((colorEl: Element) => {
                let colorName = '';
                if (colorEl.hasAttribute('data-color')) {
                  colorName = colorEl.getAttribute('data-color') || '';
                } else if (colorEl.hasAttribute('title')) {
                  colorName = colorEl.getAttribute('title') || '';
                } else if (colorEl.hasAttribute('value')) {
                  colorName = colorEl.getAttribute('value') || '';
                } else if (colorEl.textContent) {
                  colorName = colorEl.textContent.trim();
                }
                
                if (colorName && !colors.includes(colorName)) {
                  colors.push(colorName);
                }
              });
              
              // Extraire les tailles disponibles
              const sizes: string[] = [];
              const sizeSelectors = [
                '.size-option', '.size-swatch', '.size-selector', '[data-size]',
                '.swatch[data-option-name*="taille" i]', '.swatch[data-option-name*="size" i]',
                'select[name*="size" i] option', 'select[name*="taille" i] option',
                'input[name*="size" i]', 'input[name*="taille" i]',
                '.size-variable', '.size-box', '.size-choice'
              ];
              
              el.querySelectorAll(sizeSelectors.join(', ')).forEach((sizeEl: Element) => {
                let sizeName = '';
                if (sizeEl.hasAttribute('data-size')) {
                  sizeName = sizeEl.getAttribute('data-size') || '';
                } else if (sizeEl.hasAttribute('title')) {
                  sizeName = sizeEl.getAttribute('title') || '';
                } else if (sizeEl.hasAttribute('value')) {
                  sizeName = sizeEl.getAttribute('value') || '';
                } else if (sizeEl.textContent) {
                  sizeName = sizeEl.textContent.trim();
                }
                
                if (sizeName && !sizes.includes(sizeName)) {
                  sizes.push(sizeName);
                }
              });
              
              // Construire les variants (combinaisons couleurs/tailles)
              const variants: Array<{
                id: string;
                color?: string;
                size?: string;
                price?: number;
                imageUrl?: string;
              }> = [];
              
              // Si nous avons des couleurs, créer une variante pour chaque couleur
              if (colors.length > 0) {
                colors.forEach((color, colorIndex) => {
                  if (sizes.length > 0) {
                    // Si nous avons aussi des tailles, créer une variante pour chaque combinaison couleur+taille
                    sizes.forEach((size, sizeIndex) => {
                      const variantId = `${externalId}-${colorIndex}-${sizeIndex}`;
                      variants.push({
                        id: variantId,
                        color: color,
                        size: size,
                        price: price
                      });
                    });
                  } else {
                    // Juste variante par couleur
                    const variantId = `${externalId}-${colorIndex}`;
                    variants.push({
                      id: variantId,
                      color: color,
                      price: price
                    });
                  }
                });
              } else if (sizes.length > 0) {
                // Juste variante par taille
                sizes.forEach((size, sizeIndex) => {
                  const variantId = `${externalId}-size-${sizeIndex}`;
                  variants.push({
                    id: variantId,
                    size: size,
                    price: price
                  });
                });
              }
              
              // Extraire la catégorie
              const categorySelectors = [
                '.product-category', '.category', '[itemprop="category"]', '.breadcrumb',
                '.product-type', '.product-category-name', '.product-cat', '.category-name'
              ];
              const category = getTextFromSelectors(categorySelectors);
              
              // Extraire le SKU
              const skuSelectors = [
                '.sku', '.product-sku', '[itemprop="sku"]', '.product-reference',
                '.product-id', '.product-code', '.reference', '.product-reference-code'
              ];
              const sku = getTextFromSelectors(skuSelectors) || externalId;
              
              // Return le produit extrait avec un type explicite
              const product = {
                externalId,
                name: name || `${colors.join(', ') || ''} ${sizes.join(', ') || ''}`.trim() || 'Produit', // Utiliser les couleurs/tailles comme nom si disponibles
                price,
                description,
                stock: 0, // Non prioritaire selon les consignes
                imageUrl,
                imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                productUrl,
                sku,
                brand: '', // Non prioritaire selon les consignes
                category,
                colors: colors.length > 0 ? colors : undefined,
                sizes: sizes.length > 0 ? sizes : undefined,
                variants: variants.length > 0 ? variants : undefined
              };
              
              return product;
            } catch (error) {
              console.error('Erreur lors de l\'extraction d\'un produit:', error);
              return null;
            }
          }).filter(product => product !== null && product.name && product.price > 0) as ExtractedProduct[];
        }, { selector, baseUrl: websiteUrl, maxProducts: MAX_PRODUCTS });
        
        // Ajouter les produits extraits à notre liste
        products.push(...extractedProducts);
        
        // Si on a trouvé suffisamment de produits, arrêter la recherche
        if (products.length >= MAX_PRODUCTS) {
          break;
        }
      }
    }
    
    // Si aucun produit n'a été trouvé avec les sélecteurs standard, essayer une approche plus générique
    if (!foundProducts || products.length === 0) {
      logger.info('Aucun produit trouvé avec les sélecteurs standards, utilisation d\'une approche alternative');
      
      // Regarder n'importe quel élément qui pourrait être un produit (articles, divs avec images et prix, etc.)
      const selector = 'article, .item, div.col, div.grid-item, [class*="product"], [class*="item"]';
      
      // Utiliser une approche différente pour éviter les erreurs TypeScript
      const alternativeProducts = await page.$$eval(selector, (elements, options) => {
        // Limiter le nombre d'éléments à traiter
        const limitedElements = elements.slice(0, options.maxProducts);
        const baseUrl = options.baseUrl;
        
        return limitedElements.map((el, index) => {
          try {
            // Ne considérer que les éléments qui contiennent à la fois une image et un texte qui pourrait être un prix
            const hasImage = el.querySelector('img') !== null;
            const textContent = el.textContent || '';
            const hasPriceText = /(\d+[,.]\d+|\d+)\s*[€$£]|[€$£]\s*(\d+[,.]\d+|\d+)/.test(textContent);
            
            if (!hasImage || !hasPriceText) {
              return null;
            }
            
            // Générer un ID externe unique pour ce produit
            let externalId = el.getAttribute('data-product-id') || 
                            el.getAttribute('data-id') || 
                            el.getAttribute('id') || 
                            `product-${index}-${Date.now().toString().substring(8)}`;
            
            // Extraire le nom du produit
            let name = '';
            const nameEl = el.querySelector('h2, h3, h4, .name, .title, [class*="name"], [class*="title"]');
            if (nameEl) {
              name = nameEl.textContent?.trim() || '';
            }
            
            // Si pas de nom trouvé, essayer l'attribut alt de l'image
            if (!name) {
              const imgEl = el.querySelector('img');
              if (imgEl) {
                name = imgEl.getAttribute('alt') || '';
              }
            }
            
            // Si toujours pas de nom, utiliser le texte de l'élément
            if (!name) {
              name = textContent.trim().split('\n')[0] || 'Produit sans nom';
              if (name.length > 100) {
                name = name.substring(0, 100) + '...';
              }
            }
            
            // Nettoyer le nom du produit (supprimer les prix, références, etc.)
            if (name) {
              // Supprimer les prix du nom
              name = name.replace(/\d+[,.]\d+\s*[€$£]|[€$£]\s*\d+[,.]\d+/g, '').trim();
              // Supprimer les références/SKU
              name = name.replace(/\b[A-Z0-9]{5,}\b/g, '').trim();
              // Supprimer les caractères spéciaux en trop
              name = name.replace(/^\W+|\W+$|[\r\n\t]/g, '').trim();
            }
            
            // Extraire le prix du texte
            const priceMatch = textContent.match(/(\d+[,.]\d+|\d+)\s*[€$£]|[€$£]\s*(\d+[,.]\d+|\d+)/);
            let price = 0;
            
            if (priceMatch) {
              let matchedPrice = priceMatch[0].replace(/[^0-9,.]/g, '').replace(/\s/g, '');
              if (matchedPrice.includes(',')) {
                matchedPrice = matchedPrice.replace(',', '.');
              }
              price = parseFloat(matchedPrice);
            }
            
            // Extraire l'URL du produit
            let productUrl = '';
            const linkEl = el.querySelector('a');
            if (linkEl) {
              productUrl = linkEl.getAttribute('href') || '';
              // Convertir les URLs relatives en absolues
              if (productUrl && !productUrl.startsWith('http') && baseUrl) {
                try {
                  productUrl = new URL(productUrl, baseUrl).href;
                } catch {
                  // Ignorer les erreurs d'URL
                }
              }
            }
            
            // Extraire toutes les images du produit
            let imageUrl = '';
            const imageUrls: string[] = [];
            
            // Image principale
            const imgEl = el.querySelector('img');
            if (imgEl) {
              imageUrl = imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '';
              // Convertir les URLs relatives en absolues
              if (imageUrl && !imageUrl.startsWith('http') && baseUrl) {
                try {
                  imageUrl = new URL(imageUrl, baseUrl).href;
                } catch {
                  // Ignorer les erreurs d'URL
                }
              }
              if (imageUrl) {
                imageUrls.push(imageUrl);
              }
            }
            
            // Extraire les couleurs et tailles si disponibles
            const colors: string[] = [];
            const sizes: string[] = [];
            
            // Chercher des éléments qui pourraient contenir des informations sur les couleurs
            const colorElements = el.querySelectorAll('[class*="color"], [data-color], [class*="variant"], .swatch');
            for (let i = 0; i < colorElements.length; i++) {
              const colorEl = colorElements[i];
              let colorName = '';
              if (colorEl instanceof Element) {
                if (colorEl.hasAttribute('data-color')) {
                  colorName = colorEl.getAttribute('data-color') || '';
                } else if (colorEl.hasAttribute('title')) {
                  colorName = colorEl.getAttribute('title') || '';
                } else if (colorEl.hasAttribute('value')) {
                  colorName = colorEl.getAttribute('value') || '';
                } else if (colorEl.textContent) {
                  colorName = colorEl.textContent.trim();
                }
                
                if (colorName && !colors.includes(colorName)) {
                  colors.push(colorName);
                }
              }
            }
            
            // Chercher des éléments qui pourraient contenir des informations sur les tailles
            const sizeElements = el.querySelectorAll('[class*="size"], [data-size], [class*="dimension"], .swatch');
            for (let i = 0; i < sizeElements.length; i++) {
              const sizeEl = sizeElements[i];
              let sizeName = '';
              if (sizeEl instanceof Element) {
                if (sizeEl.hasAttribute('data-size')) {
                  sizeName = sizeEl.getAttribute('data-size') || '';
                } else if (sizeEl.hasAttribute('title')) {
                  sizeName = sizeEl.getAttribute('title') || '';
                } else if (sizeEl.hasAttribute('value')) {
                  sizeName = sizeEl.getAttribute('value') || '';
                } else if (sizeEl.textContent) {
                  sizeName = sizeEl.textContent.trim();
                }
                
                if (sizeName && !sizes.includes(sizeName)) {
                  sizes.push(sizeName);
                }
              }
            }
            
            // Extraire la catégorie si disponible
            let category = '';
            const categoryEl = el.querySelector('[class*="category"], [data-category], .breadcrumb');
            if (categoryEl && categoryEl.textContent) {
              category = categoryEl.textContent.trim();
            }
            
            // Extraire le SKU si disponible
            let sku = externalId;
            const skuEl = el.querySelector('[class*="sku"], [data-sku], [class*="reference"]');
            if (skuEl && skuEl.textContent) {
              const skuText = skuEl.textContent.trim();
              if (skuText) {
                sku = skuText.replace(/[^\w-]/g, '');
              }
            }
            
            // Return le produit extrait
            return {
              externalId,
              name: name || (colors.length > 0 ? colors.join(', ') : '') || 'Produit',
              price,
              description: '',
              stock: 0,
              imageUrl,
              imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
              productUrl,
              sku,
              brand: '',
              category,
              colors: colors.length > 0 ? colors : undefined,
              sizes: sizes.length > 0 ? sizes : undefined,
              variants: []
            };
          } catch (error) {
            console.error('Erreur lors de l\'extraction d\'un produit:', error);
            return null;
          }
        }).filter(item => item !== null) as ExtractedProduct[];
      }, { maxProducts: MAX_PRODUCTS, baseUrl: websiteUrl });
      
      products.push(...alternativeProducts);
    }
    
    // Éliminer les doublons en se basant sur l'URL du produit ou la combinaison nom+prix
    const uniqueProducts: ExtractedProduct[] = [];
    const seenUrls = new Set<string>();
    const seenNamePriceCombos = new Set<string>();
    
    for (const product of products) {
      // Créer une clé unique basée sur l'URL ou la combinaison nom+prix
      const urlKey = product.productUrl || '';
      const namePriceKey = `${product.name}|${product.price}`;
      
      // Si ce produit n'a pas déjà été vu (par URL ou par nom+prix), l'ajouter
      if (urlKey && !seenUrls.has(urlKey)) {
        seenUrls.add(urlKey);
        uniqueProducts.push(product);
      } else if (!urlKey && !seenNamePriceCombos.has(namePriceKey)) {
        seenNamePriceCombos.add(namePriceKey);
        uniqueProducts.push(product);
      }
    }
    
    logger.info(`Extraction terminée: ${uniqueProducts.length} produits uniques extraits (${products.length - uniqueProducts.length} doublons éliminés)`);
    
    // Limiter au nombre maximum de produits
    return uniqueProducts.slice(0, MAX_PRODUCTS);
  } catch (error) {
    logger.error(`Erreur lors de l'extraction des produits: ${error}`);
    throw error;
  }
}

/**
 * Fonction spécialisée pour extraire les données d'un produit à partir d'un élément HTML
 * Cette fonction est maintenue pour compatibilité mais n'est plus utilisée directement
 */
export function extractProductData($: cheerio.CheerioAPI, el: any, index: number, websiteUrl: string): ExtractedProduct | null {
  try {
    // Implémentation simplifiée pour maintenir la compatibilité
    return null;
  } catch (error) {
    logger.error(`Erreur lors de l'extraction des données du produit`, error);
    return null;
  }
}

/**
 * Fonction maintenue pour compatibilité, mais qui utilise maintenant Playwright en interne
 */
export function extractProductsFromHTML(html: string, websiteUrl: string): ExtractedProduct[] {
  logger.warn(`La fonction extractProductsFromHTML est déconseillée, utilisez extractProductsWithPlaywright à la place`);
  // Cette fonction ne fait rien de significatif mais est maintenue pour compatibilité
  return [];
}
