// scripts/test-shopify.js
// Script spécialisé pour l'extraction de données de produits des sites Shopify (comme Le Dressing de Cloé)

const { chromium } = require('playwright');

// Obtenir l'URL du site Shopify à tester depuis les arguments ou utiliser une URL par défaut
const url = process.argv[2] || 'https://www.ledressingdecloe.com/collections/nouveautes';

async function testShopifyExtraction() {
  console.log(`Démarrage de l'extraction Shopify avec Playwright pour l'URL: ${url}`);
  console.log('----------------------------------------------------------------------');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
  });
  const page = await context.newPage();
  
  try {
    const startTime = Date.now();
    
    // Naviguer vers l'URL
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`Page chargée: ${page.url()}`);
    
    // Attendre que la page soit complètement chargée
    console.log('Attente du chargement complet...');
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      console.log('Timeout atteint, mais nous continuons...');
    });
    
    // Attendre un peu plus pour s'assurer que JavaScript est exécuté
    await page.waitForTimeout(2000);
    
    // Faire défiler la page pour déclencher le chargement des éléments lazy-loaded
    console.log('Défilement de la page pour charger tout le contenu...');
    await autoScroll(page);
    
    // Extraire les données du produit
    console.log('Extraction des données produit...');
    const products = await extractShopifyProducts(page);
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000; // en secondes
    
    console.log('----------------------------------------------------------------------');
    console.log(`Extraction terminée en ${executionTime.toFixed(2)} secondes.`);
    console.log(`Nombre de produits trouvés: ${products.length}`);
    
    if (products.length > 0) {
      console.log('\nVoici un aperçu des produits extraits:');
      
      // Afficher les produits (limité à 5)
      const previewCount = Math.min(5, products.length);
      for (let i = 0; i < previewCount; i++) {
        const p = products[i];
        console.log(`\n[${i+1}] ${p.name} (Qualité: ${p.qualityScore}%)`);
        console.log(`  Prix: ${p.price}€`);
        if (p.description) console.log(`  Description: ${p.description.substring(0, 120)}${p.description.length > 120 ? '...' : ''}`);
        if (p.imageUrl) console.log(`  Image principale: ${p.imageUrl}`);
        console.log(`  Nombre d'images: ${p.imageUrls ? p.imageUrls.length : 0}`);
        if (p.productUrl) console.log(`  URL: ${p.productUrl}`);
        if (p.colors && p.colors.length > 0) console.log(`  Couleurs: ${p.colors.join(', ')}`);
        if (p.sizes && p.sizes.length > 0) console.log(`  Tailles: ${p.sizes.join(', ')}`);
        if (p.variants && p.variants.length > 0) console.log(`  Variantes: ${p.variants.length}`);
        if (p.sku) console.log(`  SKU: ${p.sku}`);
        if (p.brand) console.log(`  Marque: ${p.brand}`);
        if (p.category) console.log(`  Catégorie: ${p.category}`);
      }
      
      // Sauvegarder les produits dans un fichier JSON
      try {
        const fs = require('fs');
        const path = require('path');
        const outputDir = path.join(__dirname, '../data');
        
        // Créer le répertoire s'il n'existe pas
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Nom de fichier basé sur l'URL et la date
        const hostname = new URL(url).hostname.replace(/www\.|\.com|\.fr/g, '');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputFile = path.join(outputDir, `shopify-${hostname}-${timestamp}.json`);
        
        // Sauvegarder les produits
        fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
        
        console.log(`\nLes produits ont été sauvegardés dans le fichier: ${outputFile}`);
      } catch (err) {
        console.error('Erreur lors de la sauvegarde des produits:', err);
      }
    } else {
      console.log('\nAucun produit n\'a été trouvé sur cette page.');
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'extraction:', error);
  } finally {
    await browser.close();
  }
}

// Fonction pour extraire les produits d'un site Shopify
async function extractShopifyProducts(page) {
  // 1. Approche via API ShopifyAnalytics/window
  let products = await page.evaluate(() => {
    // Fonction utilitaire pour nettoyer les données HTML
    const cleanHTML = (html) => {
      if (!html) return '';
      return html.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
    };
    
    // Vérifier si c'est une page produit ou collection
    const isProductPage = window.location.pathname.includes('/products/');
    const extractedProducts = [];
    
    // MÉTHODE 1: Utiliser ShopifyAnalytics ou meta qui contient souvent les données produit
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      console.log('ShopifyAnalytics détecté');
      const meta = window.ShopifyAnalytics.meta;
      
      // Page produit
      if (isProductPage && meta.product) {
        const p = meta.product;
        
        // Extraire options (couleurs/tailles)
        let colors = [], sizes = [];
        if (p.options) {
          p.options.forEach(option => {
            if (option.name && (option.name.toLowerCase().includes('couleur') || option.name.toLowerCase().includes('color'))) {
              colors = option.values || [];
            } else if (option.name && (option.name.toLowerCase().includes('taille') || option.name.toLowerCase().includes('size'))) {
              sizes = option.values || [];
            }
          });
        }
        
        // Convertir variantes
        const variants = (p.variants || []).map(v => ({
          id: v.id,
          sku: v.sku || '',
          color: v.option1 || '',
          size: v.option2 || '',
          price: parseFloat(v.price) / 100 || 0
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
          variants: variants,
          qualityScore: 95, // Bonne qualité de données à partir de l'API
          isComplete: true
        });
        
        return extractedProducts;
      }
      
      // Page collection
      if (meta.products && Array.isArray(meta.products) && meta.products.length > 0) {
        console.log(`${meta.products.length} produits trouvés via ShopifyAnalytics`);
        
        meta.products.forEach(p => {
          extractedProducts.push({
            externalId: p.id.toString(),
            name: p.title,
            price: parseFloat(p.price) / 100,
            description: cleanHTML(p.description || ''),
            imageUrl: p.featured_image || '',
            productUrl: `${window.location.origin}/products/${p.handle}`,
            sku: p.id.toString(),
            brand: meta.page && meta.page.vendor ? meta.page.vendor : '',
            category: p.type || '',
            qualityScore: 80,
            isComplete: true,
            needsEnrichment: true
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
        const json = JSON.parse(element.textContent);
        
        // Pour une page produit
        if (isProductPage && json.product) {
          const p = json.product;
          console.log('Données produit trouvées dans JSON script');
          
          // Extraire options (couleurs/tailles)
          let colors = [], sizes = [];
          if (p.options) {
            p.options.forEach(option => {
              if (option.name && (option.name.toLowerCase().includes('couleur') || option.name.toLowerCase().includes('color'))) {
                colors = option.values || [];
              } else if (option.name && (option.name.toLowerCase().includes('taille') || option.name.toLowerCase().includes('size'))) {
                sizes = option.values || [];
              }
            });
          }
          
          // Convertir variantes
          const variants = (p.variants || []).map(v => ({
            id: v.id,
            sku: v.sku || '',
            color: v.option1 || '',
            size: v.option2 || '',
            price: parseFloat(v.price) / 100 || 0
          }));
          
          // Extraire les images
          let images = [];
          if (p.images && Array.isArray(p.images)) {
            images = p.images.map(img => {
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
            variants: variants,
            qualityScore: 95,
            isComplete: true
          });
          
          return extractedProducts;
        }
        
        // Pour les collections
        if (json.products && Array.isArray(json.products) && json.products.length > 0) {
          console.log(`${json.products.length} produits trouvés dans JSON script`);
          
          json.products.forEach(p => {
            extractedProducts.push({
              externalId: p.id.toString(),
              name: p.title || '',
              price: parseFloat(p.price) / 100 || 0,
              imageUrl: p.featured_image || p.image || '',
              productUrl: `${window.location.origin}/products/${p.handle}`,
              sku: p.id.toString(),
              brand: p.vendor || '',
              category: p.type || '',
              qualityScore: 70,
              isComplete: false,
              needsEnrichment: true
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
    
    // MÉTHODE 3: Extraction à partir des éléments HTML (fallback)
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
        let colors = [];
        let sizes = [];
        
        // Extraire le prix
        if (price) {
          const priceText = price.textContent.trim();
          const priceMatch = priceText.match(/(\d+[,.]\d+|\d+)/);
          if (priceMatch) {
            priceValue = parseFloat(priceMatch[0].replace(',', '.'));
          }
        }
        
        // Extraire la description
        if (description) {
          descriptionText = description.textContent.trim();
        }
        
        // Extraire l'image
        if (image) {
          imageUrl = image.getAttribute('src') || image.getAttribute('data-src') || '';
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
                          selector.previousElementSibling?.textContent || '';
          
          const isColor = optionType.toLowerCase().includes('couleur') || optionType.toLowerCase().includes('color');
          const isSize = optionType.toLowerCase().includes('taille') || optionType.toLowerCase().includes('size');
          
          // Collecter les valeurs
          if (isColor || isSize) {
            const options = selector.querySelectorAll('option, [data-value]');
            options.forEach(opt => {
              const value = opt.getAttribute('value') || opt.getAttribute('data-value') || opt.textContent.trim();
              if (value && value !== 'Default Title') {
                if (isColor && !colors.includes(value)) colors.push(value);
                if (isSize && !sizes.includes(value)) sizes.push(value);
              }
            });
          }
        });
        
        // Ajouter le produit à la liste
        extractedProducts.push({
          externalId: window.location.pathname.split('/').pop(),
          name: title.textContent.trim(),
          price: priceValue,
          description: descriptionText,
          imageUrl: imageUrl,
          productUrl: window.location.href,
          colors: colors,
          sizes: sizes,
          qualityScore: 75,
          isComplete: true
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
          let productUrl = link.getAttribute('href');
          let imageUrl = '';
          
          // Normaliser l'URL
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = new URL(productUrl, window.location.origin).href;
          }
          
          // Extraire le prix
          if (priceElement) {
            const priceText = priceElement.textContent.trim();
            const priceMatch = priceText.match(/(\d+[,.]\d+|\d+)/);
            if (priceMatch) {
              priceValue = parseFloat(priceMatch[0].replace(',', '.'));
            }
          }
          
          // Extraire l'image
          if (image) {
            imageUrl = image.getAttribute('src') || image.getAttribute('data-src') || '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = new URL(imageUrl, window.location.origin).href;
            }
          }
          
          // Ajouter le produit à la liste
          extractedProducts.push({
            externalId: productUrl.split('/').pop().split('?')[0],
            name: title.textContent.trim(),
            price: priceValue,
            imageUrl: imageUrl,
            productUrl: productUrl,
            qualityScore: 50,
            isComplete: false,
            needsEnrichment: true
          });
        }
      });
    }
    
    return extractedProducts;
  });
  
  // 2. Enrichissement des produits qui ont besoin de plus d'informations
  if (products.length > 0) {
    console.log(`${products.length} produits trouvés, enrichissement des données manquantes...`);
    
    // Limitation à 5 produits pour éviter les temps d'exécution trop longs
    const productsToEnrich = products.filter(p => p.needsEnrichment).slice(0, 5);
    
    // Produits déjà complets
    const completeProducts = products.filter(p => !p.needsEnrichment);
    
    // Enrichir chaque produit incomplet
    for (let i = 0; i < productsToEnrich.length; i++) {
      const product = productsToEnrich[i];
      
      console.log(`Enrichissement du produit ${i+1}/${productsToEnrich.length}: ${product.name}`);
      
      try {
        // Visiter la page du produit
        await page.goto(product.productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        
        // Extraire les données détaillées
        const detailedProducts = await extractShopifyProducts(page);
        
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
          
          // Marquer comme enrichi et complet
          delete product.needsEnrichment;
          product.qualityScore = calculateProductQuality(product);
          product.isComplete = product.qualityScore >= 70;
        }
      } catch (error) {
        console.error(`Erreur lors de l'enrichissement: ${error.message}`);
      }
    }
    
    // Combiner les produits enrichis avec les produits déjà complets
    products = [...completeProducts, ...productsToEnrich];
  }
  
  // Retourner les produits triés par score de qualité
  return products.sort((a, b) => b.qualityScore - a.qualityScore);
}

// Fonction utilitaire pour faire défiler la page
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  
  // Revenir en haut de la page
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
}

// Fonction pour calculer le score de qualité d'un produit
function calculateProductQuality(product) {
  const qualityChecks = {
    hasName: !!product.name && product.name.length > 2,
    hasPrice: !!product.price && product.price > 0,
    hasDescription: !!product.description && product.description.length > 20,
    hasImage: !!product.imageUrl,
    hasSizes: Array.isArray(product.sizes) && product.sizes.length > 0,
    hasCategory: !!product.category && product.category.length > 0,
    hasSKU: !!product.sku && product.sku.length > 0,
    hasBrand: !!product.brand && product.brand.length > 0
  };
  
  const qualityFields = Object.keys(qualityChecks);
  return Math.round(
    Object.values(qualityChecks).filter(Boolean).length / qualityFields.length * 100
  );
}

// Lancer l'extraction
testShopifyExtraction();
