// scripts/test-playwright.js
// Script de test pour vérifier la nouvelle implémentation de scraping avec Playwright

const { chromium } = require('playwright');

// Obtenir l'URL du site à tester depuis les arguments de la ligne de commande ou utiliser une URL par défaut
const url = process.argv[2] || 'https://www.ledressingdecloe.com/products/combinaison-florence-beige-copie'; // URL directe d'un produit pour test

async function testPlaywrightScraping() {
  console.log(`Démarrage du test de scraping avec Playwright pour l'URL: ${url}`);
  console.log('Ceci va ouvrir un navigateur en arrière-plan et extraire les produits de la page...');
  console.log('----------------------------------------------------------------------');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Exécuter l'extraction avec Playwright
    const startTime = Date.now();
    
    // Naviguer vers l'URL
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`Page chargée: ${page.url()}`);
    
    // *** AMÉLIORATION 1: Attendre plus longtemps que la page soit complètement chargée avec tous ses éléments ***
    console.log('Attente de chargement complet de la page et de tous ses éléments...');
    try {
      // Attendre que le réseau soit inactif (toutes les requêtes terminées)
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Attendre que tous les éléments potentiels de produit soient chargés
      await Promise.all([
        page.waitForSelector('img', { state: 'attached', timeout: 10000 }).catch(() => console.log('Certaines images peuvent ne pas être chargées')),
        page.waitForFunction(() => document.fonts.ready, { timeout: 5000 }).catch(() => console.log('Chargement des polices non terminé')),
        // Augmenter le délai d'attente pour s'assurer que le contenu dynamique est chargé
        page.waitForTimeout(3500) // Délai augmenté pour s'assurer que JavaScript a eu le temps de s'exécuter complètement
      ]);
      
      // Vérifier si des animations de chargement sont encore actives
      const loadingElements = await page.$$('[class*="loading"], .spinner, .loader, .preloader');
      if (loadingElements.length > 0) {
        console.log('Des éléments de chargement sont encore actifs, attendons encore un peu...');
        await page.waitForTimeout(2000);
      }
      
      // Attente spécifique pour Le Dressing de Cloé
      if (url.includes('ledressingdecloe')) {
        console.log('Site "Le Dressing de Cloé" détecté, utilisation d\'une stratégie spécifique...');
        
        // S'assurer que les images des produits sont chargées
        await page.waitForSelector('.grid__item .grid-product__image-wrapper', { 
          state: 'attached', 
          timeout: 10000 
        }).catch(() => console.log('Sélecteurs de produits non détectés, essai d\'une approche alternative'));
        
        // Attendre un peu plus pour les sites qui utilisent du lazy loading
        await page.waitForTimeout(2000);
        
        // Faire défiler la page pour charger tous les contenus en lazy loading
        console.log('Défilement progressif de la page pour charger tout le contenu...');
        await autoScroll(page);
      }
      
      console.log('Page entièrement chargée avec tous les éléments nécessaires');
    } catch (e) {
      console.log('Timeout en attendant le chargement complet, continuons avec les éléments disponibles...');
    }
    
    // Extraire les produits
    let products = await page.evaluate((siteUrl) => {
      // Fonction helper pour tester plusieurs sélecteurs
      const getTextFromSelectors = (element, selectors) => {
        for (const sel of selectors) {
          const el = element.querySelector(sel);
          if (el && el.textContent) {
            return el.textContent.trim();
          }
        }
        return '';
      };
      
      // Sélecteurs spécifiques pour Le Dressing de Cloé
      const isDressingDeCloe = siteUrl.includes('ledressingdecloe');
      
      // Sélecteurs pour les produits, avec priorité pour Le Dressing de Cloé
      const productSelectors = isDressingDeCloe 
        ? [
            '.grid__item', '.grid-product', '.grid-product__image-wrapper', 
            '.product-card', '.product-card__image-wrapper', 
            '[data-product-id]', '.grid .grid__item'
          ]
        : [
            '.product', '.product-item', '.item', 'article', 
            '[class*="product-card"]', '[class*="product-grid"]', 
            '[class*="product-list"]', '[class*="product-container"]'
          ];
      
      // Trouver tous les éléments qui pourraient être des produits
      let productElements = [];
      for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Sélecteur trouvé: ${selector} (${elements.length} éléments)`);
          productElements = Array.from(elements);
          break;
        }
      }
      
      // Si aucun produit n'a été trouvé avec les sélecteurs standards, essayer une approche alternative
      if (productElements.length === 0) {
        console.log('Aucun produit trouvé avec les sélecteurs standards, utilisation d\'une approche alternative');
        
        // Approche spécifique pour Le Dressing de Cloé
        if (isDressingDeCloe) {
          const alternativeSelectors = [
            'a[href*="/products/"]', // Liens vers les produits
            '.grid-product__meta', // Métadonnées de produit
            'img[data-product-img]', // Images de produit
            'img[data-product-featured-image]' // Images de produit
          ];
          
          for (const selector of alternativeSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              console.log(`Sélecteur alternatif trouvé: ${selector} (${elements.length} éléments)`);
              
              // Pour les liens de produits, remonter à l'élément parent qui contient toutes les infos
              if (selector === 'a[href*="/products/"]') {
                productElements = Array.from(elements).map(el => el.closest('.grid__item') || el.parentElement || el);
              } else {
                productElements = Array.from(elements).map(el => el.closest('.grid__item') || el.parentElement || el);
              }
              break;
            }
          }
          
          // Si toujours rien, chercher les éléments HTML avec des attributs qui font référence à des produits
          if (productElements.length === 0) {
            document.querySelectorAll('[class*="product"], [id*="product"], [data-product], [data-section-type="collection-template"]').forEach(el => {
              console.log('Structure de page détectée: ' + el.tagName + '.' + el.className);
            });
            
            // Essayer de récupérer directement depuis l'API JSON du site si elle existe (Shopify)
            try {
              const jsonScripts = document.querySelectorAll('script[type="application/json"]');
              for (const script of jsonScripts) {
                try {
                  const jsonData = JSON.parse(script.textContent);
                  console.log('Données JSON trouvées');
                  
                  // Si nous trouvons des données de produits dans le JSON, les utiliser
                  if (jsonData && jsonData.products) {
                    console.log(`${jsonData.products.length} produits trouvés dans le JSON`);
                    return jsonData.products.map((product, index) => {
                      return {
                        externalId: product.id || `json-product-${index}`,
                        name: product.title || '',
                        price: parseFloat(product.price) / 100 || 0, // Shopify stocke les prix en centimes
                        description: product.description || '',
                        imageUrl: product.featured_image || (product.images && product.images[0]) || '',
                        imageUrls: product.images || [],
                        productUrl: `${window.location.origin}/products/${product.handle}`,
                        sku: product.sku || product.id || '',
                        brand: '',
                        category: product.type || '',
                        colors: [],
                        sizes: [],
                        variants: (product.variants || []).map(v => ({
                          id: v.id,
                          color: v.option1 || '',
                          size: v.option2 || '',
                          price: parseFloat(v.price) / 100 || 0,
                          sku: v.sku || ''
                        }))
                      };
                    });
                  }
                } catch (e) {
                  // Ignorer les erreurs de parsing JSON
                }
              }
            } catch (e) {
              console.log('Erreur lors de la recherche de données JSON');
            }
          }
        } else {
          // Pour les autres sites, utiliser l'approche standard
          productElements = Array.from(document.querySelectorAll('article, .item, div.col, div.grid-item, [class*="product"], [class*="item"]'));
        }
      }
      
      // *** AMÉLIORATION 2: Collecte de données brutes pour tous les produits avant structuration ***
      const rawProductData = [];
      
      // Parcourir tous les éléments de produit potentiels pour collecter les données brutes
      for (let i = 0; i < productElements.length && i < 20; i++) {
        const el = productElements[i];
        
        // Ne considérer que les éléments qui contiennent à la fois une image et un texte qui pourrait être un prix
        const hasImage = el.querySelector('img') !== null;
        const textContent = el.textContent || '';
        const hasPriceText = /(\d+[,.]\d+|\d+)\s*[€$£]|[€$£]\s*(\d+[,.]\d+|\d+)/.test(textContent);
        
        if (!hasImage || !hasPriceText) {
          continue;
        }
        
        // Collecter toutes les données brutes possibles pour cet élément
        const rawData = {
          element: el,
          index: i,
          textContent: textContent,
          innerHTML: el.innerHTML,
          attributes: {},
          imageElements: Array.from(el.querySelectorAll('img')),
          linkElements: Array.from(el.querySelectorAll('a')),
          priceElements: Array.from(el.querySelectorAll('[class*="price"]')),
          titleElements: Array.from(el.querySelectorAll('h1, h2, h3, h4, [class*="title"], [class*="name"]')),
        };
        
        // Collecter tous les attributs de l'élément
        for (const attr of el.attributes) {
          rawData.attributes[attr.name] = attr.value;
        }
        
        rawProductData.push(rawData);
      }
      
      // *** AMÉLIORATION 3: Structuration des données en produits complets ***
      return rawProductData.map((rawData) => {
        try {
          const el = rawData.element;
          const index = rawData.index;
          
          // Générer un ID externe unique pour ce produit
          let externalId = el.getAttribute('data-product-id') || 
                          el.getAttribute('data-id') || 
                          el.getAttribute('id') || 
                          `product-${index}-${Date.now().toString().substring(8)}`;
          
          // Extraire le nom du produit à partir des éléments titre collectés
          let name = '';
          for (const titleEl of rawData.titleElements) {
            const text = titleEl.textContent.trim();
            if (text.length > 0 && text.length < 200) {
              name = text;
              break;
            }
          }
          
          // Si aucun nom n'a été trouvé via les éléments titre, essayer les sélecteurs standard
          if (!name) {
            name = getTextFromSelectors(el, [
              '.product-name', '.product-title', 'h1', 'h2', 'h3', '.title', '[itemprop="name"]',
              '.product-item-name', '.woocommerce-loop-product__title', '.product_title'
            ]);
          }
          
          // Extraire le prix du produit
          let price = 0;
          let priceText = '';
          
          // D'abord chercher dans les éléments de prix collectés
          for (const priceEl of rawData.priceElements) {
            priceText = priceEl.textContent.trim();
            if (priceText) break;
          }
          
          // Si aucun prix n'a été trouvé, essayer les sélecteurs standard
          if (!priceText) {
            priceText = getTextFromSelectors(el, [
              '.price', '[class*="price"]', '[itemprop="price"]', '.current-price',
              '.woocommerce-Price-amount', '.amount', '[data-price]'
            ]);
          }
          
          // Extraire le nombre du texte du prix
          if (priceText) {
            // Différentes façons d'extraire le prix
            const priceMatch = priceText.match(/(\d+[,.]\d+|\d+)/);
            if (priceMatch) {
              // Convertir en nombre en gérant les virgules comme séparateurs décimaux
              price = parseFloat(priceMatch[0].replace(',', '.'));
            }
          }
          
          // Extraire l'URL de l'image
          let imageUrl = '';
          let imageUrls = [];
          
          // Parcourir tous les éléments d'image collectés
          for (const imgEl of rawData.imageElements) {
            const imgSrc = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src');
            const imgSrcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset');
            
            if (imgSrc && !imgSrc.includes('placeholder') && !imgSrc.includes('blank.')) {
              // Convertir en URL absolue si nécessaire
              const fullImgUrl = new URL(imgSrc, window.location.href).href;
              imageUrls.push(fullImgUrl);
              if (!imageUrl) imageUrl = fullImgUrl;
            } else if (imgSrcset) {
              // Extraire la meilleure URL du srcset
              const srcsetParts = imgSrcset.split(',');
              if (srcsetParts.length > 0) {
                const bestImg = srcsetParts[srcsetParts.length - 1].trim().split(' ')[0];
                if (bestImg) {
                  const fullImgUrl = new URL(bestImg, window.location.href).href;
                  imageUrls.push(fullImgUrl);
                  if (!imageUrl) imageUrl = fullImgUrl;
                }
              }
            }
          }
          
          // Extraire l'URL du produit
          let productUrl = '';
          
          // Parcourir tous les éléments de lien collectés
          for (const linkEl of rawData.linkElements) {
            const href = linkEl.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
              // Si le lien contient le nom du produit ou semble être un lien de produit
              if (href.includes('product') || (name && href.includes(name.toLowerCase().replace(/\s+/g, '-').substring(0, 10)))) {
                productUrl = new URL(href, window.location.href).href;
                break;
              }
              // Sinon prendre le premier lien valide
              if (!productUrl) {
                productUrl = new URL(href, window.location.href).href;
              }
            }
          }
          
          // Extraire la description (si disponible)
          let description = getTextFromSelectors(el, [
            '.description', '.product-description', '[itemprop="description"]', '.short-description',
            '.woocommerce-product-details__short-description', '.product-information', '.product-detail'
          ]);
          
          // Si pas de description ou description trop courte, recherche plus large
          if (!description || description.length < 20) {
            // Rechercher des paragraphes qui pourraient contenir la description
            const paragraphs = el.querySelectorAll('p');
            for (const p of paragraphs) {
              const text = p.textContent.trim();
              if (text.length > 20 && text.length < 500) {
                description = text;
                break;
              }
            }
            
            // Rechercher dans div avec des mots clés de description
            const divs = el.querySelectorAll('div[class*="desc"], div[class*="detail"], div[class*="info"]');
            for (const div of divs) {
              const text = div.textContent.trim();
              if (text.length > description.length && text.length < 500) {
                description = text;
                break;
              }
            }
          }
          
          // Extraire les couleurs (si disponibles)
          let colors = [];
          const colorElements = el.querySelectorAll('.color, [class*="color"], [data-color], [class*="swatch"], [class*="variant"]');
          for (const colorEl of colorElements) {
            const colorText = colorEl.textContent.trim() || colorEl.getAttribute('title') || colorEl.getAttribute('data-color');
            if (colorText && !colors.includes(colorText)) {
              colors.push(colorText);
            }
          }
          
          // Extraire les tailles (si disponibles) AMÉLIORATION pour meilleure détection
          let sizes = [];
          
          // Recherche prioritaire dans les éléments dédiés aux tailles
          const explicitSizeElements = el.querySelectorAll('.size, [class*="size"], [data-size], [class*="size-option"]');
          for (const sizeEl of explicitSizeElements) {
            const sizeText = sizeEl.textContent.trim() || sizeEl.getAttribute('title') || sizeEl.getAttribute('data-size');
            if (sizeText && !sizes.includes(sizeText) && !/^\s*$/.test(sizeText)) {
              // Nettoyer le texte de la taille (supprimer les caractères non pertinents)
              const cleanSize = sizeText.replace(/^[^\w\d]+|[^\w\d]+$/g, '');
              if (cleanSize && cleanSize.length < 15) {
                sizes.push(cleanSize);
              }
            }
          }
          
          // Si aucune taille trouvée, recherche dans d'autres éléments qui pourraient contenir des tailles
          if (sizes.length === 0) {
            // Liste des formats de taille courants
            const sizePatterns = [
              /\b(XS|S|M|L|XL|XXL|XXXL|2XL|3XL)\b/i,
              /\b(\d{2,3}[x×]\d{2,3})\b/, // ex: 80x120
              /\b(\d{1,3}[ ]?[cC][mM])\b/, // ex: 80cm
              /\b(\d{1,3}[ ]?[xX][ ]?\d{1,3}[ ]?[cC][mM])\b/, // ex: 80 x 120 cm
              /\b([3-5]\d)\b/, // tailles numériques communes (30-59)
              /\b(one[ -]?size)\b/i
            ];
            
            // Parcourir tous les éléments de texte pour trouver des correspondances
            const textElements = el.querySelectorAll('[class*="variant"], li, span, option');
            for (const textEl of textElements) {
              const text = textEl.textContent.trim();
              
              // Tester chaque pattern de taille
              for (const pattern of sizePatterns) {
                const match = text.match(pattern);
                if (match && match[1] && !sizes.includes(match[1])) {
                  sizes.push(match[1]);
                }
              }
            }
          }
          
          // Construire l'objet produit complet
          return {
            externalId,
            name: name || 'Produit sans nom',
            price,
            description,
            stock: 0, // Non prioritaire selon les consignes
            imageUrl,
            imageUrls: imageUrls.length > 0 ? imageUrls : [],
            productUrl,
            sku: externalId,
            brand: '',
            category: getTextFromSelectors(el, ['.category', '[class*="category"]', '[data-category]', '.breadcrumb']),
            colors: colors.length > 0 ? colors : [],
            sizes: sizes.length > 0 ? sizes : []
          };
        } catch (error) {
          console.error('Erreur lors de l\'extraction d\'un produit:', error);
          return null;
        }
      }).filter(product => product !== null && product.name && product.price > 0);
    }, url);
    
    // *** AMÉLIORATION 4: Vérification et enrichissement des produits extraits ***
    console.log('Vérification et enrichissement des produits extraits...');
    
    // Approfondir l'extraction pour chaque produit si une URL de produit est disponible
    const enrichedProducts = [];
    const minimumRequiredFields = ['name', 'price', 'imageUrl', 'description'];
    
    // Parcourir tous les produits (pas seulement 5)
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      let isEnriched = false;
      
      // Vérifier les champs obligatoires
      const missingFields = minimumRequiredFields.filter(field => !product[field]);
      
      if (product.productUrl && (missingFields.length > 0 || !product.description || product.description.length < 30)) {
        try {
          console.log(`Enrichissement du produit ${i+1}/${products.length}: ${product.name}`);
          
          // Naviguer vers la page du produit pour extraire plus d'informations
          await page.goto(product.productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
          
          // Attendre que les éléments importants soient chargés
          await Promise.all([
            page.waitForSelector('img', { state: 'attached', timeout: 5000 }).catch(() => {}),
            page.waitForTimeout(2000)
          ]);
          
          // Extraire des informations supplémentaires de la page de produit
          const enrichedData = await page.evaluate((existingProduct, url) => {
            // Fonction helper
            const getTextContent = (selector) => {
              const el = document.querySelector(selector);
              return el ? el.textContent.trim() : '';
            };
            
            // Description complète (PRIORITÉ ÉLEVÉE)
            const descriptionSelectors = [
              '#description', '.description', '.product-description', '[itemprop="description"]',
              '.woocommerce-product-details__short-description', '.product-information', '.product-detail',
              '#details', '.details', '.product-details', '.product-content', '.product-text',
              '.summary', '.product-summary', '#product-details'
            ];
            
            let fullDescription = '';
            // D'abord rechercher dans des éléments spécifiques à la description
            for (const selector of descriptionSelectors) {
              const el = document.querySelector(selector);
              if (el && el.textContent.trim()) {
                fullDescription = el.textContent.trim();
                if (fullDescription.length > 50) break;
              }
            }
            
            // Si aucune description trouvée, rechercher dans les paragraphes
            if (!fullDescription || fullDescription.length < 50) {
              const paragraphs = document.querySelectorAll('.product-container p, .product-info p, .product-details p, #product-description p');
              let allParagraphs = '';
              
              for (const p of paragraphs) {
                const text = p.textContent.trim();
                if (text.length > 15 && !text.includes('€') && !text.includes('$')) {
                  allParagraphs += text + ' ';
                  if (allParagraphs.length > 100) break;
                }
              }
              
              if (allParagraphs.length > fullDescription.length) {
                fullDescription = allParagraphs.trim();
              }
            }
            
            // EXTRACTION AMÉLIORÉE DES TAILLES
            const allSizes = [];
            
            // 1. Recherche dans les éléments dédiés aux tailles
            const sizeSelectors = [
              '.swatches-size', '.size-options', '.product-size', '.swatch-size',
              '[data-option-name="size"]', '[aria-label*="size"]',
              '[class*="sizes"]', '[class*="size-"]', '[id*="size"]'
            ];
            
            for (const selector of sizeSelectors) {
              const sizeContainer = document.querySelector(selector);
              if (sizeContainer) {
                // Extraire tous les éléments enfants qui pourraient être des tailles
                const sizeElements = sizeContainer.querySelectorAll('li, option, button, [class*="swatch"], [class*="value"]');
                for (const el of sizeElements) {
                  const sizeText = el.textContent.trim() || el.getAttribute('data-value') || el.getAttribute('title');
                  if (sizeText && !/Choisir|Select/i.test(sizeText) && sizeText.length < 15) {
                    allSizes.push(sizeText);
                  }
                }
              }
            }
            
            // 2. Recherche dans les éléments de sélection
            const sizeSelects = document.querySelectorAll('select[name*="size"], select[id*="size"], select[class*="size"]');
            for (const select of sizeSelects) {
              const options = select.querySelectorAll('option');
              for (const option of options) {
                const value = option.textContent.trim();
                if (value && !/Choisir|Select/i.test(value) && value.length < 15) {
                  allSizes.push(value);
                }
              }
            }
            
            // 3. Recherche dans les tableaux de dimensions
            const sizeTables = document.querySelectorAll('table[class*="size"], [class*="size-chart"]');
            for (const table of sizeTables) {
              const cells = table.querySelectorAll('td, th');
              for (const cell of cells) {
                const text = cell.textContent.trim();
                // Détecter les formats typiques de taille (lettres ou mesures)
                if (/^(XS|S|M|L|XL|XXL|3XL|4XL)$/i.test(text) || /^\d+( ?cm)?$/i.test(text)) {
                  allSizes.push(text);
                }
              }
            }
            
            // Supprimer les doublons et les éléments vides
            const uniqueSizes = [...new Set(allSizes)].filter(s => s && s.length > 0 && s.length < 15);
            
            // Images supplémentaires
            const additionalImages = [];
            const imageSelectors = [
              '.product-gallery img', '.thumbnails img', '[class*="gallery"] img',
              '.carousel img', '.slider img', '[class*="slide"] img',
              '.product-image-gallery img', '.alternate-images img'
            ];
            
            for (const selector of imageSelectors) {
              const imageElements = document.querySelectorAll(selector);
              for (const img of imageElements) {
                const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
                if (src && !src.includes('placeholder') && !src.includes('blank.')) {
                  additionalImages.push(new URL(src, window.location.href).href);
                }
                
                // Rechercher aussi dans les srcset
                const srcset = img.getAttribute('srcset');
                if (srcset) {
                  const bestSrc = srcset.split(',').pop().trim().split(' ')[0];
                  if (bestSrc) {
                    additionalImages.push(new URL(bestSrc, window.location.href).href);
                  }
                }
              }
            }
            
            // Recherche avancée d'images dans les scripts JSON
            try {
              const scripts = document.querySelectorAll('script[type="application/ld+json"], script[type="application/json"]');
              for (const script of scripts) {
                try {
                  const jsonData = JSON.parse(script.textContent);
                  
                  // Rechercher des URLs d'images dans l'objet JSON
                  const findImagesInObject = (obj) => {
                    if (!obj || typeof obj !== 'object') return;
                    
                    // Parcourir les propriétés qui pourraient contenir des images
                    Object.keys(obj).forEach(key => {
                      if (typeof obj[key] === 'string' && 
                          (key.includes('image') || key.includes('img') || key.includes('photo')) && 
                          obj[key].match(/\.(jpg|jpeg|png|webp|gif)/i)) {
                        additionalImages.push(new URL(obj[key], window.location.href).href);
                      } else if (typeof obj[key] === 'object') {
                        findImagesInObject(obj[key]);
                      } else if (Array.isArray(obj[key])) {
                        obj[key].forEach(item => findImagesInObject(item));
                      }
                    });
                  };
                  
                  findImagesInObject(jsonData);
                } catch (e) {
                  // Ignorer les erreurs de parsing JSON
                }
              }
            } catch (e) {
              // Ignorer les erreurs dans la recherche d'images
            }
            
            // Variations de produit
            const variants = [];
            
            // 1. Chercher dans les éléments d'options de produit
            const variantElements = document.querySelectorAll('[class*="variant"], [class*="swatch"], [data-variant], [data-option], [class*="option"]');
            for (const el of variantElements) {
              const variantData = {
                color: el.getAttribute('data-color') || el.getAttribute('title') || '',
                size: el.getAttribute('data-size') || '',
                value: el.textContent.trim()
              };
              
              // N'ajouter que les variantes avec au moins une information utile
              if (variantData.color || variantData.size || (variantData.value && variantData.value.length < 20)) {
                variants.push(variantData);
              }
            }
            
            // 2. Chercher dans les scripts JSON pour les variantes
            try {
              const variantScripts = document.querySelectorAll('script');
              let variantJson = null;
              
              for (const script of variantScripts) {
                const content = script.textContent || '';
                if (content.includes('variants') || content.includes('options') || content.includes('product')) {
                  try {
                    // Rechercher un objet JSON dans le script
                    const jsonMatch = content.match(/\{.+\}/s);
                    if (jsonMatch) {
                      const jsonObj = JSON.parse(jsonMatch[0]);
                      if (jsonObj.variants || jsonObj.options || (jsonObj.product && jsonObj.product.variants)) {
                        variantJson = jsonObj;
                        break;
                      }
                    }
                  } catch (e) {
                    // Ignorer les erreurs de parsing
                  }
                }
              }
              
              if (variantJson) {
                const variantArray = variantJson.variants || 
                                     (variantJson.product ? variantJson.product.variants : []) || 
                                     [];
                
                for (const v of variantArray) {
                  if (v && typeof v === 'object') {
                    variants.push({
                      id: v.id || '',
                      color: v.color || v.option1 || '',
                      size: v.size || v.option2 || '',
                      price: v.price || v.price_amount || '',
                      sku: v.sku || v.reference || ''
                    });
                  }
                }
              }
            } catch (e) {
              // Ignorer les erreurs dans la recherche de variantes
            }
            
            // Catégorie du produit
            let category = '';
            const categorySelectors = [
              '.breadcrumbs', '.breadcrumb', '[itemprop="breadcrumb"]',
              '[class*="category"]', '[data-category]', '.product-category'
            ];
            
            for (const selector of categorySelectors) {
              const el = document.querySelector(selector);
              if (el) {
                category = el.textContent.trim()
                  .replace(/\s{2,}/g, ' ')  // Remplacer les espaces multiples par un seul
                  .replace(/^\s*Accueil\s*>\s*|\s*Home\s*>\s*/i, '')  // Supprimer "Accueil >" ou "Home >"
                  .replace(/>\s*$/, '');  // Supprimer ">" à la fin
                
                if (category && category.length > 2 && category.length < 100) break;
              }
            }
            
            // SKU et référence
            let sku = getTextContent('[itemprop="sku"], .sku, [class*="sku"], [class*="reference"], .product-reference, [data-product-reference]') || 
                      existingProduct.sku;
            
            // Si SKU non trouvé, chercher dans le texte avec regex
            if (!sku || sku === existingProduct.externalId) {
              const skuRegex = /R[ée]f[ée]rence\s*:?\s*([A-Z0-9-_]+)/i;
              const productInfoText = document.body.textContent;
              const skuMatch = productInfoText.match(skuRegex);
              if (skuMatch && skuMatch[1]) {
                sku = skuMatch[1].trim();
              }
            }
            
            // Marque/Brand
            let brand = getTextContent('[itemprop="brand"], .brand, [class*="brand"], .product-brand, .vendor, [data-product-vendor]');
            
            // Si pas de marque explicite, essayer d'extraire du titre ou de l'URL
            if (!brand) {
              // Extraire du titre
              const title = document.title || '';
              const titleParts = title.split(/[|\-–]/);
              if (titleParts.length > 1) {
                const potentialBrand = titleParts[0].trim();
                if (potentialBrand.length < 20) {
                  brand = potentialBrand;
                }
              }
              
              // Extraire de l'URL si toujours pas de marque
              if (!brand) {
                const urlParts = window.location.hostname.split('.');
                if (urlParts.length > 1) {
                  const domain = urlParts[urlParts.length - 2]; // Ex: pour www.brandname.com → brandname
                  if (domain && !['com', 'co', 'net', 'org', 'shop'].includes(domain)) {
                    brand = domain.charAt(0).toUpperCase() + domain.slice(1);
                  }
                }
              }
            }
            
            return {
              description: fullDescription || existingProduct.description,
              additionalImages: [...new Set(additionalImages)], // Éliminer les doublons
              variants,
              sizes: uniqueSizes,
              stock: getTextContent('[class*="stock"], [data-stock]').toLowerCase().includes('stock') ? 1 : 0,
              brand,
              sku,
              category: category || existingProduct.category
            };
          }, product, url);
          
          // Fusionner les informations enrichies avec le produit original
          isEnriched = true;
          
          // Description - AMÉLIORATION CRITIQUE
          if (enrichedData.description && enrichedData.description.length > 20) {
            // Nettoyer la description
            let cleanDescription = enrichedData.description
              .replace(/\s+/g, ' ')  // Remplacer les espaces multiples par un seul
              .replace(/^\s+|\s+$/g, '')  // Supprimer les espaces au début et à la fin
              .replace(/^(Description|Product Description|Details)\s*:?\s*/i, ''); // Supprimer les préfixes communs
            
            // Limiter la longueur pour éviter les descriptions excessivement longues
            if (cleanDescription.length > 500) {
              cleanDescription = cleanDescription.substring(0, 500) + '...';
            }
            
            product.description = cleanDescription;
          }
          
          // Ajouter des images supplémentaires
          if (enrichedData.additionalImages.length > 0) {
            // S'assurer que imageUrls est initialisé
            if (!product.imageUrls) {
              product.imageUrls = [];
            }
            
            // Ajouter chaque nouvelle image à la liste
            for (const imgUrl of enrichedData.additionalImages) {
              if (!product.imageUrls.includes(imgUrl)) {
                product.imageUrls.push(imgUrl);
              }
            }
            
            // Si pas d'image principale mais des images supplémentaires, utiliser la première
            if (!product.imageUrl && product.imageUrls.length > 0) {
              product.imageUrl = product.imageUrls[0];
            }
          }
          
          // Mettre à jour d'autres informations
          if (enrichedData.stock > 0) product.stock = enrichedData.stock;
          if (enrichedData.brand) product.brand = enrichedData.brand;
          if (enrichedData.sku && enrichedData.sku !== product.externalId) product.sku = enrichedData.sku;
          if (enrichedData.category) product.category = enrichedData.category;
          
          // Mise à jour critique des tailles
          if (enrichedData.sizes && enrichedData.sizes.length > 0) {
            product.sizes = [...new Set([...product.sizes || [], ...enrichedData.sizes])];
          }
          
          // Collecter les variantes
          if (enrichedData.variants && enrichedData.variants.length > 0) {
            // Extraire les couleurs et tailles des variantes
            const variantColors = enrichedData.variants
              .filter(v => v.color && !product.colors.includes(v.color))
              .map(v => v.color);
            
            const variantSizes = enrichedData.variants
              .filter(v => v.size && (!product.sizes || !product.sizes.includes(v.size)))
              .map(v => v.size);
            
            // Mettre à jour les couleurs et tailles
            product.colors = [...new Set([...product.colors || [], ...variantColors])];
            product.sizes = [...new Set([...product.sizes || [], ...variantSizes])];
            
            // Ajouter les variantes complètes
            if (!product.variants) product.variants = [];
            
            // Transformer les données de variantes au format attendu
            for (const v of enrichedData.variants) {
              if ((v.color || v.size) && !product.variants.some(existing => 
                  (existing.color === v.color && existing.size === v.size))) {
                product.variants.push({
                  id: v.id || `variant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  color: v.color || '',
                  size: v.size || '',
                  price: v.price || product.price,
                  sku: v.sku || '',
                  stock: v.stock || 0
                });
              }
            }
          }
          
        } catch (error) {
          console.error(`Erreur lors de l'enrichissement du produit ${product.name}:`, error);
        }
      }
      
      // Vérification de la qualité des données après enrichissement
      const productQuality = {
        hasName: !!product.name && product.name.length > 2,
        hasPrice: !!product.price && product.price > 0,
        hasDescription: !!product.description && product.description.length > 30,
        hasImage: !!product.imageUrl,
        hasSizes: Array.isArray(product.sizes) && product.sizes.length > 0,
        hasCategory: !!product.category && product.category.length > 0,
        hasSKU: !!product.sku && product.sku.length > 0
      };
      
      // Calculer le score de qualité (0-100)
      const qualityFields = Object.keys(productQuality);
      const qualityScore = Math.round(
        Object.values(productQuality).filter(Boolean).length / qualityFields.length * 100
      );
      
      // Ajouter le score de qualité au produit
      product.qualityScore = qualityScore;
      product.isComplete = qualityScore >= 70; // Considérer comme complet si score >= 70%
      product.enriched = isEnriched;
      
      console.log(`Produit "${product.name}" - Score qualité: ${qualityScore}% - Complet: ${product.isComplete ? 'OUI' : 'NON'}`);
      
      enrichedProducts.push(product);
    }
    
    // Filtrer uniquement les produits de qualité
    const highQualityProducts = enrichedProducts.filter(p => p.isComplete);
    const lowQualityProducts = enrichedProducts.filter(p => !p.isComplete);
    
    console.log(`\nProduits à haute qualité: ${highQualityProducts.length}/${enrichedProducts.length} (${Math.round(highQualityProducts.length/enrichedProducts.length*100)}%)`);
    if (lowQualityProducts.length > 0) {
      console.log(`Produits avec données incomplètes: ${lowQualityProducts.length}`);
    }
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000; // en secondes
    
    console.log('----------------------------------------------------------------------');
    console.log(`Extraction terminée en ${executionTime.toFixed(2)} secondes.`);
    console.log(`Nombre total de produits trouvés: ${products.length}`);
    console.log(`Nombre de produits complets: ${highQualityProducts.length}`);
    
    // Utiliser les produits de haute qualité pour l'affichage et l'exportation
    const displayProducts = highQualityProducts.length > 0 ? highQualityProducts : enrichedProducts;
    
    if (displayProducts.length > 0) {
      console.log('\nVoici un aperçu des produits de qualité extraits:');
      
      // Afficher les 5 premiers produits (ou moins s'il y en a moins)
      const previewCount = Math.min(5, displayProducts.length);
      for (let i = 0; i < previewCount; i++) {
        const p = displayProducts[i];
        console.log(`\n[${i+1}] ${p.name} (Qualité: ${p.qualityScore}%)`);
        console.log(`  Prix: ${p.price}€`);
        if (p.description) console.log(`  Description: ${p.description.substring(0, 120)}${p.description.length > 120 ? '...' : ''}`);
        if (p.imageUrl) console.log(`  Image principale: ${p.imageUrl}`);
        console.log(`  Nombre d'images: ${p.imageUrls ? p.imageUrls.length : 0}`);
        if (p.productUrl) console.log(`  URL: ${p.productUrl}`);
        if (p.colors && p.colors.length > 0) console.log(`  Couleurs: ${p.colors.join(', ')}`);
        if (p.sizes && p.sizes.length > 0) console.log(`  Tailles: ${p.sizes.join(', ')}`);
        if (p.sku) console.log(`  SKU: ${p.sku}`);
        if (p.category) console.log(`  Catégorie: ${p.category}`);
        if (p.variants && p.variants.length > 0) console.log(`  Nombre de variantes: ${p.variants.length}`);
      }
      
      // Analyser la complétude des données
      const stats = {
        avecDescription: displayProducts.filter(p => p.description && p.description.length > 30).length,
        avecImage: displayProducts.filter(p => p.imageUrl).length,
        avecMultipleImages: displayProducts.filter(p => p.imageUrls && p.imageUrls.length > 1).length,
        avecURL: displayProducts.filter(p => p.productUrl).length,
        avecSKU: displayProducts.filter(p => p.sku).length,
        avecMarque: displayProducts.filter(p => p.brand).length,
        avecCategorie: displayProducts.filter(p => p.category).length,
        avecCouleurs: displayProducts.filter(p => p.colors && p.colors.length > 0).length,
        avecTailles: displayProducts.filter(p => p.sizes && p.sizes.length > 0).length,
        avecVariantes: displayProducts.filter(p => p.variants && p.variants.length > 0).length
      };
      
      console.log('\nStatistiques sur les données extraites (produits de qualité):');
      console.log(`  Produits avec description: ${stats.avecDescription}/${displayProducts.length} (${Math.round(stats.avecDescription/displayProducts.length*100)}%)`);
      console.log(`  Produits avec image principale: ${stats.avecImage}/${displayProducts.length} (${Math.round(stats.avecImage/displayProducts.length*100)}%)`);
      console.log(`  Produits avec plusieurs images: ${stats.avecMultipleImages}/${displayProducts.length} (${Math.round(stats.avecMultipleImages/displayProducts.length*100)}%)`);
      console.log(`  Produits avec URL: ${stats.avecURL}/${displayProducts.length} (${Math.round(stats.avecURL/displayProducts.length*100)}%)`);
      console.log(`  Produits avec SKU: ${stats.avecSKU}/${displayProducts.length} (${Math.round(stats.avecSKU/displayProducts.length*100)}%)`);
      console.log(`  Produits avec marque: ${stats.avecMarque}/${displayProducts.length} (${Math.round(stats.avecMarque/displayProducts.length*100)}%)`);
      console.log(`  Produits avec catégorie: ${stats.avecCategorie}/${displayProducts.length} (${Math.round(stats.avecCategorie/displayProducts.length*100)}%)`);
      console.log(`  Produits avec couleurs: ${stats.avecCouleurs}/${displayProducts.length} (${Math.round(stats.avecCouleurs/displayProducts.length*100)}%)`);
      console.log(`  Produits avec tailles: ${stats.avecTailles}/${displayProducts.length} (${Math.round(stats.avecTailles/displayProducts.length*100)}%)`);
      console.log(`  Produits avec variantes: ${stats.avecVariantes}/${displayProducts.length} (${Math.round(stats.avecVariantes/displayProducts.length*100)}%)`);
      
      // Calculer la complétude globale
      const kpiFields = Object.keys(stats).length;
      const totalKPIs = kpiFields * displayProducts.length;
      const completeness = Math.round(
        Object.values(stats).reduce((sum, val) => sum + val, 0) / totalKPIs * 100
      );
      
      console.log(`\nComplétude globale des données: ${completeness}%`);
      
      // Sauvegarder les produits dans un fichier
      try {
        const fs = require('fs');
        const path = require('path');
        const outputDir = path.join(__dirname, '../data');
        
        // Créer le répertoire s'il n'existe pas
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Nom de fichier basé sur l'URL du site et la date
        const hostname = new URL(url).hostname.replace(/www\.|\.com|\.net|\.org|\.fr/g, '');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputFile = path.join(outputDir, `produits-${hostname}-${timestamp}.json`);
        
        // Sauvegarder uniquement les produits de qualité
        fs.writeFileSync(outputFile, JSON.stringify(displayProducts, null, 2));
        
        console.log(`\nLes produits ont été sauvegardés dans le fichier: ${outputFile}`);
        console.log(`Les données sont maintenant prêtes pour la synchronisation.`);
      } catch (err) {
        console.error('Erreur lors de la sauvegarde des produits:', err);
      }
    } else {
      console.log('\nAucun produit de qualité n\'a été trouvé sur cette page.');
      console.log('Veuillez essayer une autre URL ou vérifier que la page contient bien des produits.');
    }
    
  } catch (error) {
    console.error('Erreur lors du test de scraping avec Playwright:', error);
  } finally {
    await browser.close();
  }
}

// Fonction pour extraire les données d'un site Shopify (comme Le Dressing de Cloé)
async function extractShopifyData(page, url) {
  console.log('Détection d\'un site Shopify, utilisation d\'une méthode d\'extraction spécifique...');
  
  // Approche 1: Extraire les données via la variable window.ShopifyAnalytics qui contient souvent les données produit
  let products = await page.evaluate(() => {
    // Vérifier si c'est une page produit
    const isProductPage = window.location.pathname.includes('/products/');
    let extractedProducts = [];
    
    // Méthode 1: Utiliser ShopifyAnalytics pour extraire les données produit
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      const meta = window.ShopifyAnalytics.meta;
      console.log('ShopifyAnalytics détecté');
      
      if (isProductPage && meta.product) {
        // Page produit individuelle
        const product = meta.product;
        console.log('Données produit trouvées dans ShopifyAnalytics');
        
        // Convertir les variantes en format standard
        const variants = (product.variants || []).map(v => ({
          id: v.id,
          sku: v.sku || '',
          color: '', // À extraire des options
          size: '',  // À extraire des options
          price: parseFloat(v.price) / 100
        }));
        
        // Extraire les couleurs et tailles des options
        const colors = [];
        const sizes = [];
        if (product.options) {
          product.options.forEach(option => {
            if (option.name.toLowerCase().includes('couleur') || option.name.toLowerCase().includes('color')) {
              option.values.forEach(v => colors.push(v));
            } else if (option.name.toLowerCase().includes('taille') || option.name.toLowerCase().includes('size')) {
              option.values.forEach(v => sizes.push(v));
            }
          });
        }
        
        extractedProducts.push({
          externalId: product.id.toString(),
          name: product.title,
          price: parseFloat(product.price) / 100,
          description: product.description || '',
          imageUrl: product.featured_image || '',
          imageUrls: product.images || [],
          productUrl: window.location.href,
          sku: product.sku || product.id.toString(),
          brand: meta.page.vendor || '',
          category: product.type || '',
          colors: colors,
          sizes: sizes,
          variants: variants,
          qualityScore: 90, // Généralement bonne qualité de données
          isComplete: true
        });
        
        return extractedProducts;
      } else if (meta.products) {
        // Page collection - plusieurs produits
        console.log(`${meta.products.length} produits trouvés dans ShopifyAnalytics`);
        
        meta.products.forEach((product, index) => {
          // Pour la liste des produits, nous avons généralement moins d'informations
          extractedProducts.push({
            externalId: product.id.toString(),
            name: product.title,
            price: parseFloat(product.price) / 100,
            description: product.description || '',
            imageUrl: product.featured_image || '',
            productUrl: `${window.location.origin}/products/${product.handle}`,
            sku: product.id.toString(),
            brand: meta.page.vendor || '',
            category: product.type || '',
            qualityScore: 70,
            isComplete: true
          });
        });
        
        return extractedProducts;
      }
    }
    
    // Méthode 2: Rechercher des données produit dans les scripts JSON
    const jsonElements = document.querySelectorAll('script[type="application/json"]');
    for (const element of jsonElements) {
      try {
        const json = JSON.parse(element.textContent);
        
        // Pour les produits uniques
        if (isProductPage && json.product) {
          console.log('Données produit trouvées dans JSON script');
          const product = json.product;
          
          // Extraire les couleurs et tailles
          const colors = [];
          const sizes = [];
          if (product.options) {
            product.options.forEach(option => {
              if (option.name.toLowerCase().includes('couleur') || option.name.toLowerCase().includes('color')) {
                option.values.forEach(v => colors.push(v));
              } else if (option.name.toLowerCase().includes('taille') || option.name.toLowerCase().includes('size')) {
                option.values.forEach(v => sizes.push(v));
              }
            });
          }
          
          // Variantes
          const variants = (product.variants || []).map(v => ({
            id: v.id,
            sku: v.sku || '',
            color: v.option1 || '',
            size: v.option2 || '',
            price: parseFloat(v.price) / 100 || parseFloat(product.price) / 100
          }));
          
          extractedProducts.push({
            externalId: product.id.toString(),
            name: product.title,
            price: parseFloat(product.price) / 100,
            description: product.description || '',
            imageUrl: product.featured_image || (product.images && product.images[0]) || '',
            imageUrls: product.images || [],
            productUrl: window.location.href,
            sku: product.sku || product.id.toString(),
            brand: product.vendor || '',
            category: product.type || '',
            colors: colors,
            sizes: sizes,
            variants: variants,
            qualityScore: 90,
            isComplete: true
          });
          
          return extractedProducts;
        }
        
        // Pour les collections de produits
        if (json.products) {
          console.log(`${json.products.length} produits trouvés dans JSON script`);
          
          json.products.forEach(product => {
            extractedProducts.push({
              externalId: product.id.toString(),
              name: product.title,
              price: parseFloat(product.price) / 100,
              description: product.description || '',
              imageUrl: product.featured_image || (product.images && product.images[0]) || '',
              productUrl: `${window.location.origin}/products/${product.handle}`,
              sku: product.id.toString(),
              brand: product.vendor || '',
              category: product.type || '',
              qualityScore: 70,
              isComplete: true
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
    
    // Méthode 3: Extraire directement des éléments HTML (fallback)
    if (isProductPage) {
      console.log('Extraction à partir du HTML');
      
      // Pour une page produit
      const titleElement = document.querySelector('.product-single__title, h1.title, .product__title');
      const priceElement = document.querySelector('.product__price, .price, .product-single__price');
      const descriptionElement = document.querySelector('.product-single__description, .description, .product__description');
      const imageElement = document.querySelector('.product-featured-img, .product-single__media img, .product-single__image');
      
      if (titleElement) {
        const productData = {
          externalId: window.location.pathname.split('/').pop(),
          name: titleElement.textContent.trim(),
          price: priceElement ? parseFloat(priceElement.textContent.replace(/[^0-9,.]/g, '').replace(',', '.')) : 0,
          description: descriptionElement ? descriptionElement.textContent.trim() : '',
          imageUrl: imageElement ? (imageElement.getAttribute('src') || imageElement.getAttribute('data-src')) : '',
          productUrl: window.location.href,
          qualityScore: 60,
          isComplete: true
        };
        
        // Trouver les variantes et options
        const variantSelectors = document.querySelectorAll('.single-option-selector, .swatch-element, [data-option-index]');
        const colors = [];
        const sizes = [];
        
        variantSelectors.forEach(selector => {
          const optionType = selector.getAttribute('data-option-index') || 
                          selector.getAttribute('data-option') || 
                          selector.parentElement.textContent.toLowerCase();
          
          if (optionType.includes('couleur') || optionType.includes('color')) {
            selector.querySelectorAll('option, [data-value]').forEach(opt => {
              const val = opt.getAttribute('value') || opt.getAttribute('data-value') || opt.textContent.trim();
              if (val && !colors.includes(val)) colors.push(val);
            });
          } else if (optionType.includes('taille') || optionType.includes('size')) {
            selector.querySelectorAll('option, [data-value]').forEach(opt => {
              const val = opt.getAttribute('value') || opt.getAttribute('data-value') || opt.textContent.trim();
              if (val && !sizes.includes(val)) sizes.push(val);
            });
          }
        });
        
        productData.colors = colors;
        productData.sizes = sizes;
        
        extractedProducts.push(productData);
      }
    } else {
      // Pour une page collection
      const productElements = document.querySelectorAll('.grid-product, .grid__item, .product-card, [data-product-id]');
      
      productElements.forEach(element => {
        const linkElement = element.querySelector('a[href*="/products/"]');
        const titleElement = element.querySelector('.grid-product__title, .product-card__title, .product-card__name, h2, h3');
        const priceElement = element.querySelector('.grid-product__price, .product-card__price, .price');
        const imageElement = element.querySelector('img');
        
        if (titleElement && linkElement) {
          const productUrl = new URL(linkElement.getAttribute('href'), window.location.origin).href;
          
          extractedProducts.push({
            externalId: productUrl.split('/').pop().split('?')[0],
            name: titleElement.textContent.trim(),
            price: priceElement ? parseFloat(priceElement.textContent.replace(/[^0-9,.]/g, '').replace(',', '.')) : 0,
            imageUrl: imageElement ? (imageElement.getAttribute('src') || imageElement.getAttribute('data-src')) : '',
            productUrl: productUrl,
            qualityScore: 50,
            isComplete: false
          });
        }
      });
    }
    
    return extractedProducts;
  });
  
  // Si des produits ont été trouvés mais qu'ils manquent de détails, visiter les pages individuelles
  if (products.length > 0) {
    console.log(`${products.length} produits trouvés sur le site Shopify`);
    
    // Limiter le nombre de produits à enrichir pour éviter les longs temps d'exécution
    const productsToEnrich = products.slice(0, 10);
    const enrichedProducts = [];
    
    for (let i = 0; i < productsToEnrich.length; i++) {
      const product = productsToEnrich[i];
      
      // N'enrichir que les produits incomplets qui ont une URL
      if (product.productUrl && (!product.description || !product.sizes || product.sizes.length === 0)) {
        try {
          console.log(`Enrichissement du produit Shopify: ${product.name}`);
          
          // Visiter la page produit
          await page.goto(product.productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
          
          // Extraction détaillée de cette page produit
          const detailedProducts = await extractShopifyData(page, product.productUrl);
          
          if (detailedProducts && detailedProducts.length > 0) {
            // Fusionner les données
            const detailedProduct = detailedProducts[0];
            
            // Mettre à jour les propriétés manquantes
            if (detailedProduct.description) product.description = detailedProduct.description;
            if (detailedProduct.colors && detailedProduct.colors.length > 0) product.colors = detailedProduct.colors;
            if (detailedProduct.sizes && detailedProduct.sizes.length > 0) product.sizes = detailedProduct.sizes;
            if (detailedProduct.variants && detailedProduct.variants.length > 0) product.variants = detailedProduct.variants;
            if (detailedProduct.imageUrls && detailedProduct.imageUrls.length > 0) product.imageUrls = detailedProduct.imageUrls;
            if (detailedProduct.brand) product.brand = detailedProduct.brand;
            if (detailedProduct.category) product.category = detailedProduct.category;
            
            // Recalculer le score de qualité
            product.qualityScore = calculateProductQuality(product);
            product.isComplete = product.qualityScore >= 70;
          }
        } catch (error) {
          console.error(`Erreur lors de l'enrichissement du produit Shopify: ${error.message}`);
        }
      }
      
      enrichedProducts.push(product);
    }
    
    return enrichedProducts;
  }
  
  return [];
}

// Fonction utilitaire pour calculer le score de qualité d'un produit
function calculateProductQuality(product) {
  const qualityChecks = {
    hasName: !!product.name && product.name.length > 2,
    hasPrice: !!product.price && product.price > 0,
    hasDescription: !!product.description && product.description.length > 30,
    hasImage: !!product.imageUrl,
    hasSizes: Array.isArray(product.sizes) && product.sizes.length > 0,
    hasCategory: !!product.category && product.category.length > 0,
    hasSKU: !!product.sku && product.sku.length > 0
  };
  
  const qualityFields = Object.keys(qualityChecks);
  return Math.round(
    Object.values(qualityChecks).filter(Boolean).length / qualityFields.length * 100
  );
}

// Fonction pour faire défiler la page automatiquement (pour déclencher le lazy loading)
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

testPlaywrightScraping();
