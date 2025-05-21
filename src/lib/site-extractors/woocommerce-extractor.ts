/**
 * Extracteur spécialisé pour les sites WooCommerce
 * Optimisé pour extraire les données produits des sites utilisant la plateforme WooCommerce
 */

import { Page } from 'playwright';
import { logger } from '../logger';
import { ExtractedProduct, ProductVariant } from '../product-extractor';

// Déclarations de types pour les objets globaux de fenêtre
declare global {
  interface Window {
    wc?: any;
    woocommerce?: any;
    woocommerce_params?: any;
  }
}

/**
 * Extrait les produits d'un site WooCommerce
 * @param page Page Playwright
 * @param url URL du site
 * @returns Liste des produits extraits
 */
export async function extractWooCommerceProducts(page: Page, url: string): Promise<ExtractedProduct[]> {
  logger.info('Utilisation de l\'extracteur spécialisé pour WooCommerce');
  
  // Extraction des produits à partir de la page actuelle
  return await extractProductsFromCurrentPage(page, url);
}

/**
 * Extrait les produits de la page WooCommerce actuellement chargée
 * @param page Page Playwright
 * @param currentUrl URL de la page actuelle
 * @returns Liste des produits extraits
 */
async function extractProductsFromCurrentPage(page: Page, currentUrl: string): Promise<ExtractedProduct[]> {
  // Extraction des produits via l'évaluation du contexte de la page
  return await page.evaluate((url: string) => {
    const extractedProducts: ExtractedProduct[] = [];
    
    // Détermine si on est sur une page produit ou une page catalogue
    const isSingleProduct = document.body.classList.contains('single-product');
    
    if (isSingleProduct) {
      // Page produit individuel
      const productData = {
        externalId: '',
        name: '',
        price: 0,
        description: '',
        imageUrl: '',
        productUrl: window.location.href,
        imageUrls: [] as string[],
        colors: [] as string[],
        sizes: [] as string[],
        variants: [] as ProductVariant[],
        brand: '',
        category: '',
        sku: ''
      };
      
      // Extraction des données de base
      const title = document.querySelector('.product_title');
      if (title) productData.name = title.textContent!.trim();
      
      // Prix
      const priceElement = document.querySelector('.price .amount, .price ins .amount, .woocommerce-Price-amount');
      if (priceElement) {
        const priceText = priceElement.textContent!.trim();
        const priceMatch = priceText.match(/(\d+[,.]\d+|\d+)/);
        if (priceMatch) {
          productData.price = parseFloat(priceMatch[0].replace(',', '.'));
        }
      }
      
      // Description
      const description = document.querySelector('.woocommerce-product-details__short-description, .description, #tab-description');
      if (description) productData.description = description.textContent!.trim();
      
      // Image
      const image = document.querySelector('.woocommerce-product-gallery__image img');
      if (image) {
        productData.imageUrl = (image as HTMLImageElement).src || 
                              (image as HTMLImageElement).getAttribute('data-src') || '';
                              
        if (productData.imageUrl && !productData.imageUrl.startsWith('http')) {
          productData.imageUrl = new URL(productData.imageUrl, window.location.origin).href;
        }
        productData.imageUrls.push(productData.imageUrl);
      }
      
      // Images supplémentaires
      const additionalImages = document.querySelectorAll('.woocommerce-product-gallery__image:not(:first-child) img');
      additionalImages.forEach(img => {
        const imgSrc = (img as HTMLImageElement).src || (img as HTMLImageElement).getAttribute('data-src');
        if (imgSrc && !productData.imageUrls.includes(imgSrc)) {
          productData.imageUrls.push(imgSrc);
        }
      });
      
      // SKU
      const skuElement = document.querySelector('.sku');
      if (skuElement) productData.sku = skuElement.textContent!.trim();
      
      // Catégorie
      const categoryElement = document.querySelector('.posted_in a');
      if (categoryElement) productData.category = categoryElement.textContent!.trim();
      
      // Marque
      const brandElement = document.querySelector('.brand, .posted_in a, .product_meta .brand');
      if (brandElement) productData.brand = brandElement.textContent!.trim();
      
      // Variations (couleurs et tailles)
      const variationElements = document.querySelectorAll('.variations select, .variations .attribute-swatch-container');
      variationElements.forEach(element => {
        const label = element.closest('tr')?.querySelector('label')?.textContent || '';
        const isColor = label.toLowerCase().includes('couleur') || 
                       label.toLowerCase().includes('color') || 
                       element.id.includes('color') || 
                       element.id.includes('couleur');
                       
        const isSize = label.toLowerCase().includes('taille') || 
                      label.toLowerCase().includes('size') || 
                      element.id.includes('size') || 
                      element.id.includes('taille');
        
        if (isColor || isSize) {
          const options = element.querySelectorAll('option:not([value=""]), span[data-value]');
          options.forEach(option => {
            const value = (option as HTMLOptionElement).value || 
                         option.getAttribute('data-value') || 
                         option.textContent!.trim();
                         
            if (value) {
              if (isColor && !productData.colors.includes(value)) productData.colors.push(value);
              if (isSize && !productData.sizes.includes(value)) productData.sizes.push(value);
            }
          });
        }
      });
      
      extractedProducts.push(productData);
    } else {
      // Page catalogue
      const productElements = document.querySelectorAll('.product, .type-product, li.product');
      
      productElements.forEach(element => {
        const link = element.querySelector('a.woocommerce-loop-product__link, a.woocommerce-LoopProduct-link');
        const title = element.querySelector('.woocommerce-loop-product__title, h2');
        const priceElement = element.querySelector('.price');
        const image = element.querySelector('img');
        
        if (title && link) {
          // Extraire les données de base
          let priceValue = 0;
          let productUrl = (link as HTMLAnchorElement).href || '';
          let imageUrl = '';
          
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
            imageUrl = (image as HTMLImageElement).src || 
                      (image as HTMLImageElement).getAttribute('data-src') || '';
                      
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = new URL(imageUrl, window.location.origin).href;
            }
          }
          
          extractedProducts.push({
            externalId: productUrl.split('/').pop() || '',
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
