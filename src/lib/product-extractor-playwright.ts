import { chromium, Browser, Page } from 'playwright';
import axios from 'axios';
import { ExtractedProduct } from '@/types/product';

/**
 * Extracteur de produits utilisant Playwright
 * Cette version est plus robuste que celle basée sur Cheerio car elle peut gérer :
 * - Le contenu chargé dynamiquement par JavaScript
 * - Les sites SPA (Single Page Applications)
 * - Les interactions utilisateur comme les clics et le défilement
 */
export class PlaywrightProductExtractor {
  private browser: Browser | null = null;
  
  /**
   * Initialise l'extracteur
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true, // true pour le mode sans interface, false pour voir le navigateur
      });
    }
  }
  
  /**
   * Ferme le navigateur
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
  
  /**
   * Extrait les produits d'un site web
   * @param websiteUrl URL du site web
   * @param options Options d'extraction
   * @returns Liste des produits extraits
   */
  async extractProducts(
    websiteUrl: string,
    options: {
      productSelector?: string;
      maxProducts?: number;
      scrollToLoad?: boolean;
      waitForSelector?: string;
    } = {}
  ): Promise<ExtractedProduct[]> {
    if (!this.browser) {
      await this.initialize();
    }
    
    const {
      productSelector = '.product, .product-item, [itemtype*="Product"], .card, .item',
      maxProducts = 100,
      scrollToLoad = false,
      waitForSelector = productSelector
    } = options;
    
    const context = await this.browser!.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });
    
    const page = await context.newPage();
    
    try {
      // Naviguer vers l'URL
      await page.goto(websiteUrl, { waitUntil: 'domcontentloaded' });
      
      // Attendre que les produits soient chargés
      await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {
        console.log('Timeout en attendant le sélecteur de produits. Continuons quand même.');
      });
      
      // Si l'option scrollToLoad est activée, faire défiler la page pour charger plus de contenu
      if (scrollToLoad) {
        await this.scrollToLoadMore(page);
      }
      
      // Extraire les données des produits
      const products = await this.extractProductsFromPage(page, productSelector, maxProducts, websiteUrl);
      
      return products;
    } catch (error) {
      console.error('Erreur lors de l\'extraction des produits:', error);
      return [];
    } finally {
      await context.close();
    }
  }
  
  /**
   * Fait défiler la page pour charger plus de contenu (utile pour les sites avec chargement paresseux)
   * @param page Page Playwright
   */
  private async scrollToLoadMore(page: Page): Promise<void> {
    // Faire défiler plusieurs fois avec des pauses pour permettre le chargement
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      
      // Attendre que le contenu se charge
      await page.waitForTimeout(1000);
    }
  }
  
  /**
   * Extrait les données des produits à partir de la page
   * @param page Page Playwright
   * @param productSelector Sélecteur CSS pour les éléments de produit
   * @param maxProducts Nombre maximum de produits à extraire
   * @param websiteUrl URL du site web (pour les URL relatives)
   * @returns Liste des produits extraits
   */
  private async extractProductsFromPage(
    page: Page,
    productSelector: string,
    maxProducts: number,
    websiteUrl: string
  ): Promise<ExtractedProduct[]> {
    // Obtenir les éléments de produit
    const productElements = await page.$$(productSelector);
    const productCount = Math.min(productElements.length, maxProducts);
    
    console.log(`Trouvé ${productElements.length} produits, extraction de ${productCount}`);
    
    const productFragments: ExtractedProduct[] = [];
    
    // Extraire les données de chaque produit
    for (let i = 0; i < productCount; i++) {
      const productElement = productElements[i];
      
      try {
        const product = await this.extractProductData(page, productElement, websiteUrl);
        if (product) {
          productFragments.push(product);
        }
      } catch (error) {
        console.error('Erreur lors de l\'extraction des données d\'un produit:', error);
      }
    }
    
    // Regrouper les fragments de produits
    const productMap = new Map<string, ExtractedProduct>();
    const groupedProducts = this.groupProductFragments(productFragments);
    
    return groupedProducts;
  }
  
  /**
   * Extrait les données d'un produit à partir d'un élément
   * @param page Page Playwright
   * @param productElement Élément de produit
   * @param websiteUrl URL du site web (pour les URL relatives)
   * @returns Données du produit extraites
   */
  private async extractProductData(
    page: Page,
    productElement: any,
    websiteUrl: string
  ): Promise<ExtractedProduct | null> {
    try {
      // Extraire le nom du produit
      const name = await this.extractText(page, productElement, [
        '.product-name', '.product-title', 'h1', 'h2', 'h3', '.title', '[itemprop="name"]',
        '.product-item-name', '.woocommerce-loop-product__title', '.product_title',
        '.product-single__title', '.product-info__title', '.card-title'
      ]);
      
      // Vérifier si le nom ressemble à un nom de fichier d'image
      let finalName = name;
      if (name.match(/^IMG_\d+$/) || name.match(/^DSC_\d+$/) || name.match(/^P\d+$/) || name.match(/^\d+\.jpg$/i)) {
        // Essayer d'extraire un meilleur nom
        const description = await this.extractText(page, productElement, [
          '.description', '.product-description', '[itemprop="description"]'
        ]);
        
        if (description) {
          const firstSentence = description.split('.')[0];
          if (firstSentence && firstSentence.length > 3) {
            finalName = firstSentence;
          }
        }
        
        // Si on n'a toujours pas de bon nom, essayer d'utiliser le titre de la page
        if (finalName.match(/^IMG_\d+$/) || finalName.match(/^DSC_\d+$/) || finalName.match(/^P\d+$/) || finalName.match(/^\d+\.jpg$/i)) {
          const pageTitle = await page.title();
          if (pageTitle && pageTitle !== 'Page' && pageTitle !== 'Home' && pageTitle !== 'Accueil') {
            finalName = pageTitle;
          }
        }
        
        // Si on n'a toujours pas de bon nom, utiliser un nom générique avec la marque si disponible
        if (finalName.match(/^IMG_\d+$/) || finalName.match(/^DSC_\d+$/) || finalName.match(/^P\d+$/) || finalName.match(/^\d+\.jpg$/i)) {
          const brand = await this.extractText(page, productElement, [
            '[itemprop="brand"]', '.brand', '.manufacturer'
          ]);
          
          if (brand) {
            finalName = `Produit ${brand}`;
          } else {
            finalName = 'Produit';
          }
        }
      }
      
      // Extraire le prix du produit
      const priceText = await this.extractText(page, productElement, [
        '.price', '[itemprop="price"]', '.product-price', '.regular-price',
        '.current-price', '.amount', '.product__price', '.price-item'
      ]);
      
      let price = 0;
      if (priceText) {
        // Extraire le nombre du texte du prix (gère les formats européens et américains)
        const priceMatch = priceText.match(/[\d.,]+/);
        if (priceMatch) {
          const priceString = priceMatch[0];
          // Convertir en nombre en tenant compte des formats européens (virgule comme séparateur décimal)
          price = parseFloat(priceString.replace(',', '.'));
        }
      }
      
      // Extraire l'URL de l'image
      const imageUrl = await this.extractAttribute(page, productElement, 'img', 'src', [
        '.product-image', '.product-img', '[itemprop="image"]', '.card-img',
        '.product-photo', '.product-thumbnail', '.woocommerce-product-gallery__image'
      ]);
      
      // Extraire l'URL du produit
      const productUrl = await this.extractAttribute(page, productElement, 'a', 'href', [
        '.product-link', '.product-url', '[itemprop="url"]', '.card-link'
      ]);
      
      // Extraire la description du produit
      const description = await this.extractText(page, productElement, [
        '.description', '.product-description', '[itemprop="description"]',
        '.product-short-description', '.card-text', '.product-excerpt'
      ]);
      
      // Extraire le SKU du produit
      const sku = await this.extractText(page, productElement, [
        '[itemprop="sku"]', '.sku', '.product-sku', '.product-meta-sku'
      ]);
      
      // Extraire la marque du produit
      const brand = await this.extractText(page, productElement, [
        '[itemprop="brand"]', '.brand', '.manufacturer', '.product-brand'
      ]);
      
      // Extraire les tailles disponibles
      const sizes = await this.extractOptions(page, productElement, [
        '.size-options', '.product-size', '.swatch-size', 'select[name*="size"]',
        '[data-option-name*="size" i]', '[data-option-name*="taille" i]'
      ]);
      
      // Extraire les couleurs disponibles
      const colors = await this.extractOptions(page, productElement, [
        '.color-options', '.product-color', '.swatch-color', 'select[name*="color"]',
        '[data-option-name*="color" i]', '[data-option-name*="couleur" i]'
      ]);
      
      // Générer un ID externe basé sur le nom et l'URL
      const externalId = this.generateExternalId(finalName, productUrl || websiteUrl);
      
      // Créer l'objet produit
      return {
        externalId,
        name: finalName,
        price,
        description: description || '',
        imageUrl: this.makeAbsoluteUrl(imageUrl || '', websiteUrl),
        productUrl: this.makeAbsoluteUrl(productUrl || '', websiteUrl) || websiteUrl,
        sku: sku || '',
        brand: brand || '',
        stock: 1, // Valeur par défaut
        variants: sizes.length > 0 ? sizes : undefined,
        category: colors.length > 0 ? colors.join(', ') : undefined
      };
    } catch (error) {
      console.error('Erreur lors de l\'extraction des données d\'un produit:', error);
      return null;
    }
  }
  
  /**
   * Extrait le texte d'un élément en utilisant plusieurs sélecteurs
   * @param page Page Playwright
   * @param element Élément parent
   * @param selectors Liste des sélecteurs à essayer
   * @returns Texte extrait
   */
  private async extractText(
    page: Page,
    element: any,
    selectors: string[]
  ): Promise<string> {
    for (const selector of selectors) {
      try {
        const childElement = await element.$(selector);
        if (childElement) {
          const text = await childElement.textContent();
          if (text) {
            return text.trim();
          }
        }
      } catch (error) {
        // Ignorer les erreurs et continuer avec le prochain sélecteur
      }
    }
    
    // Si aucun sélecteur n'a fonctionné, essayer d'obtenir le texte de l'élément lui-même
    try {
      const text = await element.textContent();
      if (text) {
        const firstLine = text.trim().split('\n')[0];
        // Limiter la longueur si on utilise le texte brut
        return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
      }
    } catch (error) {
      // Ignorer les erreurs
    }
    
    return '';
  }
  
  /**
   * Extrait un attribut d'un élément en utilisant plusieurs sélecteurs
   * @param page Page Playwright
   * @param element Élément parent
   * @param tagName Nom de la balise à rechercher
   * @param attributeName Nom de l'attribut à extraire
   * @param selectors Liste des sélecteurs à essayer
   * @returns Valeur de l'attribut
   */
  private async extractAttribute(
    page: Page,
    element: any,
    tagName: string,
    attributeName: string,
    selectors: string[]
  ): Promise<string> {
    // D'abord, essayer avec les sélecteurs spécifiques
    for (const selector of selectors) {
      try {
        const childElement = await element.$(selector);
        if (childElement) {
          const attr = await childElement.getAttribute(attributeName);
          if (attr) {
            return attr;
          }
          
          // Si l'élément trouvé n'a pas l'attribut mais correspond au tagName, chercher dans ses enfants
          const tagElement = await childElement.$(tagName);
          if (tagElement) {
            const tagAttr = await tagElement.getAttribute(attributeName);
            if (tagAttr) {
              return tagAttr;
            }
          }
        }
      } catch (error) {
        // Ignorer les erreurs et continuer avec le prochain sélecteur
      }
    }
    
    // Si aucun sélecteur spécifique n'a fonctionné, chercher directement le tagName
    try {
      const tagElement = await element.$(tagName);
      if (tagElement) {
        const attr = await tagElement.getAttribute(attributeName);
        if (attr) {
          return attr;
        }
      }
    } catch (error) {
      // Ignorer les erreurs
    }
    
    return '';
  }
  
  /**
   * Extrait les options (tailles, couleurs) d'un élément
   * @param page Page Playwright
   * @param element Élément parent
   * @param selectors Liste des sélecteurs à essayer
   * @returns Liste des options
   */
  private async extractOptions(
    page: Page,
    element: any,
    selectors: string[]
  ): Promise<string[]> {
    const options: string[] = [];
    
    for (const selector of selectors) {
      try {
        // Essayer de trouver un élément select
        const selectElement = await element.$(`${selector}`);
        if (selectElement) {
          // Extraire les options du select
          const optionElements = await selectElement.$$('option');
          for (const optionElement of optionElements) {
            const optionText = await optionElement.textContent();
            if (optionText && optionText.trim() !== '' && !['Choisir', 'Select', '--'].includes(optionText.trim())) {
              options.push(optionText.trim());
            }
          }
          
          if (options.length > 0) {
            return options;
          }
        }
        
        // Essayer de trouver des éléments de liste (li, div, span, etc.)
        const listElements = await element.$$(`${selector} li, ${selector} .swatch, ${selector} [data-value]`);
        if (listElements.length > 0) {
          for (const listElement of listElements) {
            const listText = await listElement.textContent();
            if (listText && listText.trim() !== '') {
              options.push(listText.trim());
            } else {
              // Si pas de texte, essayer d'obtenir l'attribut title, data-value ou value
              const attrValue = await listElement.getAttribute('title') || 
                                await listElement.getAttribute('data-value') || 
                                await listElement.getAttribute('value');
              if (attrValue && attrValue.trim() !== '') {
                options.push(attrValue.trim());
              }
            }
          }
          
          if (options.length > 0) {
            return options;
          }
        }
      } catch (error) {
        // Ignorer les erreurs et continuer avec le prochain sélecteur
      }
    }
    
    return options;
  }
  
  /**
   * Regroupe les fragments de produits en produits complets
   * @param productFragments Fragments de produits
   * @returns Produits regroupés
   */
  private groupProductFragments(productFragments: ExtractedProduct[]): ExtractedProduct[] {
    const productMap = new Map<string, ExtractedProduct>();
    
    // Phase 1: Filtrer les fragments invalides
    const validFragments = productFragments.filter(fragment => 
      fragment.name && fragment.price > 0
    );
    
    // Phase 2: Regrouper les fragments par caractéristiques communes
    validFragments.forEach(fragment => {
      // Normaliser le nom pour la comparaison
      const normalizedName = fragment.name.toLowerCase().trim();
      
      // Ignorer les fragments avec des noms qui ressemblent à des noms de fichiers d'image
      if (normalizedName.match(/^img_\d+$/) || normalizedName.match(/^dsc_\d+$/) || normalizedName.match(/^p\d+$/) || normalizedName.match(/^\d+\.jpg$/i)) {
        // Sauf s'ils ont des informations importantes que d'autres fragments n'ont pas
        if (fragment.description || fragment.imageUrl || fragment.productUrl) {
          // Dans ce cas, on les garde pour enrichir d'autres produits
        } else {
          // Sinon, on les ignore complètement
          return;
        }
      }
      
      // Essayer d'abord de regrouper par externalId explicite
      if (fragment.externalId && productMap.has(fragment.externalId)) {
        const existingProduct = productMap.get(fragment.externalId)!;
        const mergedProduct = this.mergeProductData(existingProduct, fragment);
        productMap.delete(existingProduct.externalId); // Supprimer l'ancienne entrée
        productMap.set(mergedProduct.externalId, mergedProduct);
        return;
      }
      
      // Essayer de regrouper par URL de produit
      if (fragment.productUrl) {
        const matchByUrl = Array.from(productMap.values()).find(p => 
          p.productUrl === fragment.productUrl);
        if (matchByUrl) {
          const mergedProduct = this.mergeProductData(matchByUrl, fragment);
          productMap.delete(matchByUrl.externalId); // Supprimer l'ancienne entrée
          productMap.set(mergedProduct.externalId, mergedProduct);
          return;
        }
      }
      
      // Essayer de regrouper par nom similaire (plus flexible)
      const matchByName = Array.from(productMap.values()).find(p => {
        const pNormalizedName = p.name.toLowerCase().trim();
        // Vérifier si les noms sont identiques ou très similaires
        return pNormalizedName === normalizedName || 
               pNormalizedName.includes(normalizedName) || 
               normalizedName.includes(pNormalizedName) ||
               // Vérifier la similarité des noms (si un nom contient au moins 70% des mots de l'autre)
               this.calculateNameSimilarity(pNormalizedName, normalizedName) > 0.7;
      });
      
      if (matchByName) {
        const mergedProduct = this.mergeProductData(matchByName, fragment);
        productMap.delete(matchByName.externalId); // Supprimer l'ancienne entrée
        productMap.set(mergedProduct.externalId, mergedProduct);
        return;
      }
      
      // Si on n'a pas trouvé de correspondance, ajouter comme nouveau produit
      if (fragment.externalId) {
        productMap.set(fragment.externalId, fragment);
      } else {
        // Générer un ID basé sur le nom du produit pour plus de cohérence
        const slugifiedName = normalizedName
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const generatedId = `product-${slugifiedName}-${Math.floor(Math.random() * 1000)}`;
        fragment.externalId = generatedId;
        productMap.set(generatedId, fragment);
      }
    });
    
    // Phase 3: Convertir la map en tableau
    return Array.from(productMap.values());
  }
  
  /**
   * Fusionne les données de deux produits
   * @param product1 Premier produit
   * @param product2 Deuxième produit
   * @returns Produit fusionné
   */
  private mergeProductData(product1: ExtractedProduct, product2: ExtractedProduct): ExtractedProduct {
    // Utiliser l'ID externe du premier produit par défaut
    const externalId = product1.externalId;
    
    // Pour le nom, préférer celui qui n'est pas un nom de fichier d'image
    let name = product1.name;
    if (product1.name.match(/^IMG_\d+$/) || product1.name.match(/^DSC_\d+$/) || product1.name.match(/^P\d+$/) || product1.name.match(/^\d+\.jpg$/i)) {
      if (!product2.name.match(/^IMG_\d+$/) && !product2.name.match(/^DSC_\d+$/) && !product2.name.match(/^P\d+$/) && !product2.name.match(/^\d+\.jpg$/i)) {
        name = product2.name;
      }
    }
    
    // Pour la description, préférer la plus longue
    const description = (product1.description && product2.description) 
      ? (product1.description.length > product2.description.length ? product1.description : product2.description)
      : (product1.description || product2.description || '');
    
    // Combiner les attributs des deux produits
    const attributes = {
      ...(product2.attributes || {}),
      ...(product1.attributes || {})
    };
    
    // Pour les variants, combiner les deux tableaux sans doublons
    const variants = [...new Set([
      ...(product1.variants || []),
      ...(product2.variants || [])
    ])];
    
    return {
      externalId,
      name,
      // Préférer le prix non nul ou le plus élevé (supposant que le prix le plus élevé inclut plus d'options)
      price: product1.price > 0 ? product1.price : product2.price,
      description,
      // Préférer le stock non nul
      stock: product1.stock || product2.stock,
      // Préférer l'URL d'image non nulle
      imageUrl: product1.imageUrl || product2.imageUrl,
      // Préférer l'URL de produit non nulle
      productUrl: product1.productUrl || product2.productUrl,
      // Préférer le SKU non nul
      sku: product1.sku || product2.sku,
      // Préférer la marque non nulle
      brand: product1.brand || product2.brand,
      // Préférer la catégorie non nulle (couleurs)
      category: product1.category || product2.category,
      // Utiliser les variants combinés
      variants: variants.length > 0 ? variants : undefined,
      // Préférer le poids non nul
      weight: product1.weight || product2.weight,
      // Préférer les dimensions non nulles
      dimensions: product1.dimensions || product2.dimensions,
      // Utiliser les attributs combinés
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined
    };
  }
  
  /**
   * Calcule la similarité entre deux noms de produits
   * @param name1 Premier nom
   * @param name2 Deuxième nom
   * @returns Score de similarité (0-1)
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }
  
  /**
   * Génère un ID externe basé sur le nom et l'URL du produit
   * @param name Nom du produit
   * @param url URL du produit
   * @returns ID externe
   */
  private generateExternalId(name: string, url: string): string {
    const normalizedName = name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Extraire le domaine de l'URL
    let domain = '';
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '');
    } catch (error) {
      domain = 'unknown-domain';
    }
    
    // Générer un ID unique basé sur le nom et le domaine
    return `${domain}-${normalizedName}-${Math.floor(Math.random() * 10000)}`;
  }
  
  /**
   * Convertit une URL relative en URL absolue
   * @param url URL à convertir
   * @param baseUrl URL de base
   * @returns URL absolue
   */
  private makeAbsoluteUrl(url: string, baseUrl: string): string {
    if (!url) return '';
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Si l'URL commence par //, ajouter le protocole
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    try {
      // Utiliser l'API URL pour résoudre l'URL relative
      return new URL(url, baseUrl).href;
    } catch (error) {
      console.error('Erreur lors de la conversion de l\'URL relative en URL absolue:', error);
      return '';
    }
  }
}
