/**
 * Module principal d'extraction de données produits
 * Architecture modulaire avec détection automatique du type de site
 */

import { Browser, Page } from 'playwright';
import { logger } from '../logger';
import { ExtractedProduct } from '../product-extractor';
import { extractShopifyProducts } from './shopify-extractor.js';
import { extractWooCommerceProducts } from './woocommerce-extractor.js';
import { extractGenericProducts } from './generic-extractor.js';

// Déclarations de types pour les objets globaux de fenêtre
declare global {
  interface Window {
    Shopify?: any;
    ShopifyAnalytics?: any;
    Mage?: any;
    prestashop?: any;
  }
}

/**
 * Détecte le type de plateforme e-commerce utilisée par un site
 * @param page Page Playwright
 * @param url URL du site
 * @returns Type de plateforme identifié
 */
export async function detectSiteType(page: Page, url: string): Promise<string> {
  // Détection basée sur l'URL
  if (url.includes('shopify.com') || url.includes('myshopify.com') || url.includes('ledressingdecloe.com')) {
    return 'shopify';
  }
  
  // Détection basée sur les éléments de la page
  return await page.evaluate(() => {
    // Détection Shopify
    if (
      window.Shopify !== undefined || 
      document.querySelector('script[src*="shopify"]') !== null ||
      document.querySelector('link[href*="shopify"]') !== null
    ) {
      return 'shopify';
    }
    
    // Détection WooCommerce
    if (
      document.querySelector('.woocommerce') !== null ||
      document.querySelector('script[src*="woocommerce"]') !== null ||
      document.body.classList.contains('woocommerce') ||
      document.body.classList.contains('woocommerce-page')
    ) {
      return 'woocommerce';
    }
    
    // Détection Magento
    if (
      window.Mage !== undefined ||
      document.querySelector('script[src*="mage"]') !== null ||
      document.querySelector('body[class*="magento"]') !== null
    ) {
      return 'magento';
    }
    
    // Détection PrestaShop
    if (
      window.prestashop !== undefined ||
      document.querySelector('script[src*="prestashop"]') !== null ||
      document.body.classList.contains('prestashop')
    ) {
      return 'prestashop';
    }
    
    // Par défaut, utiliser l'extracteur générique
    return 'generic';
  });
}

/**
 * Extrait les produits d'un site web en détectant automatiquement la plateforme
 * et en utilisant l'extracteur le plus approprié
 * @param browser Instance du navigateur Playwright
 * @param url URL du site à extraire
 * @returns Liste des produits extraits
 */
export async function extractProductsWithAutoDetection(
  browser: Browser,
  url: string
): Promise<ExtractedProduct[]> {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();
  
  try {
    // Navigation vers l'URL cible
    logger.info(`Navigation vers ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Attente du chargement complet
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      logger.warn('Timeout en attendant que le réseau soit inactif, continuation...');
    });
    
    // Détection du type de site
    const siteType = await detectSiteType(page, url);
    logger.info(`Type de site détecté: ${siteType}`);
    
    // Préparation avancée en fonction du type de site
    await preparePage(page, siteType);
    
    // Extraction des produits en utilisant l'extracteur approprié
    let products: ExtractedProduct[] = [];
    
    switch (siteType) {
      case 'shopify':
        logger.info('Utilisation de l\'extracteur Shopify...');
        products = await extractShopifyProducts(page, url);
        break;
        
      case 'woocommerce':
        logger.info('Utilisation de l\'extracteur WooCommerce...');
        products = await extractWooCommerceProducts(page, url);
        break;
        
      case 'magento':
      case 'prestashop':
        // À implémenter dans le futur
        logger.info(`Extracteur spécifique pour ${siteType} non disponible, utilisation de l'extracteur générique`);
        products = await extractGenericProducts(page, url);
        break;
        
      default:
        logger.info('Utilisation de l\'extracteur générique...');
        products = await extractGenericProducts(page, url);
    }
    
    // Filtrer les produits incomplets si nécessaire
    const qualityProducts = products.filter(p => isProductComplete(p));
    
    logger.info(`Extraction terminée, ${qualityProducts.length}/${products.length} produits de qualité extraits`);
    return qualityProducts;
    
  } catch (error) {
    logger.error(`Erreur lors de l'extraction avec détection auto: ${error}`);
    throw error;
  } finally {
    await context.close();
  }
}

/**
 * Prépare la page pour l'extraction en fonction du type de site
 * @param page Page Playwright
 * @param siteType Type de site détecté
 */
async function preparePage(page: Page, siteType: string): Promise<void> {
  // Attente des éléments principaux
  await page.waitForSelector('img', { state: 'attached', timeout: 10000 })
    .catch(() => logger.warn('Timeout en attendant les images'));
    
  // Gérer les popups et bandeaux de cookies courants
  try {
    // Bannières de cookies courantes
    const cookieSelectors = [
      '[aria-label*="cookie"], [class*="cookie-banner"], [id*="cookie-banner"]',
      '[class*="consent"], [id*="consent"]',
      '[class*="gdpr"], [id*="gdpr"]',
      'button:has-text("Accepter")', 'button:has-text("Accept")',
      'button:has-text("J\'accepte")', 'button:has-text("I accept")'
    ];
    
    for (const selector of cookieSelectors) {
      const hasPopup = await page.$(selector);
      if (hasPopup) {
        logger.info(`Fermeture d'une popup/bannière: ${selector}`);
        await page.click(selector).catch(() => {});
        break;
      }
    }
  } catch (error) {
    logger.warn('Erreur lors de la gestion des popups');
  }
  
  // Préparation spécifique au type de site
  if (siteType === 'shopify' || siteType === 'generic') {
    // Défiler la page pour déclencher le chargement des éléments en lazy-loading
    await autoScroll(page);
  }
}

/**
 * Vérifie si un produit a toutes les informations nécessaires
 * @param product Produit extrait
 * @returns true si le produit est complet
 */
function isProductComplete(product: ExtractedProduct): boolean {
  // Critères minimaux pour considérer un produit comme "complet"
  const hasName = !!product.name && product.name.length > 2;
  const hasPrice = !!product.price && product.price > 0;
  const hasImage = !!product.imageUrl;
  const hasDescription = !!product.description && product.description.length > 20;
  
  // Score de qualité (0-100%)
  let score = 0;
  let total = 0;
  
  // Critères principaux (obligatoires)
  score += hasName ? 25 : 0;
  score += hasPrice ? 25 : 0;
  score += hasImage ? 25 : 0;
  score += hasDescription ? 15 : 0;
  total += 90;
  
  // Critères secondaires (bonus)
  score += product.colors && product.colors.length > 0 ? 3 : 0;
  score += product.sizes && product.sizes.length > 0 ? 3 : 0;
  score += product.category ? 2 : 0;
  score += product.sku ? 2 : 0;
  total += 10;
  
  // Un produit est complet s'il a au moins 70% des informations
  const percentage = (score / total) * 100;
  return percentage >= 70;
}

/**
 * Fait défiler automatiquement la page pour charger les éléments en lazy-loading
 * @param page Page Playwright
 */
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0); // Revenir en haut
          resolve();
        }
      }, 100);
    });
  });
}

// Export des fonctions principales
export {
  extractShopifyProducts,
  extractWooCommerceProducts,
  extractGenericProducts
};
