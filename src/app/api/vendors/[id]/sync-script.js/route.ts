import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vendors/[id]/sync-script.js
 * Sert le script de synchronisation en tant que fichier JavaScript
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id;
    
    // Récupérer le vendeur
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return new NextResponse('console.error("Vendeur non trouvé");', {
        status: 404,
        headers: {
          'Content-Type': 'application/javascript',
        },
      });
    }

    // Obtenir l'URL de base de l'application
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Générer le script de synchronisation
    const script = `
/**
 * FBE Sync Client v1.0.0
 * Script de synchronisation automatique pour la plateforme FBE
 */
(function() {
  // Objet global pour le client de synchronisation
  window.FBE_SYNC = {
    // Configuration par défaut
    config: {
      apiBaseUrl: "${baseUrl}",
      vendorId: "${vendor.id}",
      apiKey: "${vendor.apiKey}",
      autoSync: true,
      syncInterval: 3600000, // 1 heure en millisecondes
      debug: false
    },
    
    // Initialisation avec configuration personnalisée
    init: function(customConfig = {}) {
      // Fusionner la configuration par défaut avec la configuration personnalisée
      this.config = { ...this.config, ...customConfig };
      
      this.log('FBE Sync Client initialisé');
      
      // Ajouter les styles CSS
      this.addStyles();
      
      // Ajouter le bouton de synchronisation si autoSync est désactivé
      if (!this.config.autoSync) {
        this.addSyncButton();
      } else {
        // Sinon, configurer la synchronisation automatique
        this.setupAutoSync();
      }
      
      // Exécuter une première synchronisation après 5 secondes
      if (this.config.autoSync) {
        setTimeout(() => {
          this.sync();
        }, 5000);
      }
      
      return this;
    },
    
    // Configuration de la synchronisation automatique
    setupAutoSync: function() {
      this.syncInterval = setInterval(() => {
        this.sync();
      }, this.config.syncInterval);
      
      // Synchroniser également lors des modifications du DOM
      if (window.MutationObserver) {
        this.setupDomObserver();
      }
    },
    
    // Observer les changements du DOM pour détecter les nouveaux produits
    setupDomObserver: function() {
      const observer = new MutationObserver((mutations) => {
        let shouldSync = false;
        
        // Vérifier si des modifications concernent potentiellement des produits
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              if (node.nodeType === 1) { // ELEMENT_NODE
                // Vérifier si l'élément ou ses enfants contiennent des produits
                if (this.containsProductElements(node)) {
                  shouldSync = true;
                  break;
                }
              }
            }
          }
        });
        
        if (shouldSync) {
          this.log('Changements de produits détectés, synchronisation...');
          this.sync();
        }
      });
      
      // Observer le corps du document pour les changements
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });
    },
    
    // Vérifie si un élément contient des produits
    containsProductElements: function(element) {
      // Cette fonction doit être adaptée en fonction de la structure du site
      // Par défaut, nous recherchons des éléments avec des classes ou attributs communs pour les produits
      if (!(element instanceof Element)) return false;
      
      // Vérifier si l'élément lui-même est un produit
      if (
        element.classList.contains('product') ||
        element.hasAttribute('data-product-id') ||
        element.hasAttribute('data-product') ||
        element.querySelector('.product-price, .price, [data-product-price]')
      ) {
        return true;
      }
      
      // Vérifier les enfants
      return !!element.querySelector('.product, [data-product-id], [data-product], .product-price, .price, [data-product-price]');
    },
    
    // Ajouter les styles CSS
    addStyles: function() {
      const style = document.createElement('style');
      style.textContent = \`
        .fbe-sync-button {
          position: fixed;
          bottom: 20px;
          left: 20px;
          padding: 10px 15px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          z-index: 9999;
          font-family: Arial, sans-serif;
          font-size: 14px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .fbe-sync-button:hover {
          background: #45a049;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .fbe-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 15px;
          background: white;
          border-radius: 5px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
          z-index: 9999;
          max-width: 300px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .fbe-notification-success {
          border-left: 4px solid #4CAF50;
        }
        .fbe-notification-error {
          border-left: 4px solid #F44336;
        }
        .fbe-notification-info {
          border-left: 4px solid #2196F3;
        }
        .fbe-notification-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fbe-notification-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          margin-left: 10px;
        }
      \`;
      document.head.appendChild(style);
    },
    
    // Ajouter le bouton de synchronisation
    addSyncButton: function() {
      const button = document.createElement('button');
      button.className = 'fbe-sync-button';
      button.textContent = 'Synchroniser avec FBE';
      button.addEventListener('click', () => {
        this.sync();
      });
      document.body.appendChild(button);
    },
    
    // Afficher une notification
    showNotification: function(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = 'fbe-notification fbe-notification-' + type;
      notification.innerHTML = \`
        <div class="fbe-notification-content">
          <span>\${message}</span>
          <button class="fbe-notification-close">&times;</button>
        </div>
      \`;
      
      // Fermer la notification au clic
      notification.querySelector('.fbe-notification-close').addEventListener('click', () => {
        notification.remove();
      });
      
      document.body.appendChild(notification);
      
      // Auto-fermeture après 5 secondes
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 5000);
    },
    
    // Collecter les produits de la page
    collectProducts: function() {
      this.log('Collecte des produits...');
      
      // Cette fonction doit être adaptée en fonction de la structure du site du vendeur
      // Exemple pour un site e-commerce standard
      const productElements = document.querySelectorAll('.product, [data-product-id], [data-product], .product-item');
      const products = [];
      
      this.log(\`\${productElements.length} éléments de produits trouvés\`);
      
      productElements.forEach((el, index) => {
        try {
          // Essayer différents sélecteurs pour extraire les informations du produit
          const productId = el.getAttribute('data-product-id') || 
                          el.getAttribute('id') || 
                          'product-' + index;
          
          // Essayer différents sélecteurs pour le nom
          let name = null;
          const nameSelectors = [
            '.product-name', '.product-title', '.name', '.title', 
            'h2', 'h3', '[data-product-name]', '[data-product-title]'
          ];
          
          for (const selector of nameSelectors) {
            const nameEl = el.querySelector(selector);
            if (nameEl && nameEl.textContent.trim()) {
              name = nameEl.textContent.trim();
              break;
            }
          }
          
          // Essayer différents sélecteurs pour le prix
          let price = null;
          const priceSelectors = [
            '.product-price', '.price', '[data-product-price]', 
            '.amount', '.current-price', '.regular-price'
          ];
          
          for (const selector of priceSelectors) {
            const priceEl = el.querySelector(selector);
            if (priceEl && priceEl.textContent.trim()) {
              // Extraire le prix en tant que nombre
              const priceText = priceEl.textContent.trim();
              const priceMatch = priceText.match(/[\\d.,]+/);
              if (priceMatch) {
                // Convertir en nombre en gérant les différents formats (1,234.56 ou 1.234,56)
                price = parseFloat(
                  priceMatch[0]
                    .replace(/\\s/g, '')
                    .replace(/\\.(?=\\d{3})/g, '')  // Supprimer les points comme séparateurs de milliers
                    .replace(',', '.')  // Remplacer la virgule par un point pour la décimale
                );
                break;
              }
            }
          }
          
          // Essayer différents sélecteurs pour la description
          let description = null;
          const descSelectors = [
            '.product-description', '.description', '[data-product-description]', 
            '.short-description', '.excerpt'
          ];
          
          for (const selector of descSelectors) {
            const descEl = el.querySelector(selector);
            if (descEl && descEl.textContent.trim()) {
              description = descEl.textContent.trim();
              break;
            }
          }
          
          // Essayer différents sélecteurs pour le stock
          let stock = null;
          const stockSelectors = [
            '.product-stock', '.stock', '[data-product-stock]', 
            '.inventory', '[data-inventory]'
          ];
          
          for (const selector of stockSelectors) {
            const stockEl = el.querySelector(selector);
            if (stockEl && stockEl.textContent.trim()) {
              // Extraire le stock en tant que nombre
              const stockText = stockEl.textContent.trim();
              const stockMatch = stockText.match(/\\d+/);
              if (stockMatch) {
                stock = parseInt(stockMatch[0], 10);
                break;
              }
            }
          }
          
          // Essayer différents sélecteurs pour l'image
          let imageUrl = null;
          const imgEl = el.querySelector('img.product-image, img.product-img, .product-image img, .product-img img, [data-product-image]');
          if (imgEl) {
            imageUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src');
          }
          
          // Si nous avons au moins un ID et un nom, ajouter le produit
          if (productId && (name || price)) {
            products.push({
              externalId: productId,
              name: name || 'Produit ' + productId,
              price: price || 0,
              description,
              stock: stock || 0,
              imageUrl
            });
          }
        } catch (err) {
          this.log('Erreur lors de la collecte du produit: ' + err.message, 'error');
        }
      });
      
      return products;
    },
    
    // Synchroniser les produits avec la plateforme FBE
    sync: function() {
      this.log('Démarrage de la synchronisation...');
      
      const products = this.collectProducts();
      
      if (products.length === 0) {
        this.log('Aucun produit trouvé à synchroniser', 'warning');
        this.showNotification('Aucun produit trouvé à synchroniser', 'info');
        return;
      }
      
      this.log(\`\${products.length} produits collectés, envoi à la plateforme FBE...\`);
      
      fetch(\`\${this.config.apiBaseUrl}/api/vendors/\${this.config.vendorId}/sync\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${this.config.apiKey}\`
        },
        body: JSON.stringify({ products })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Erreur lors de la synchronisation');
          });
        }
        return response.json();
      })
      .then(result => {
        this.log('Synchronisation réussie', 'success');
        this.log(result);
        
        // Compter les produits créés et mis à jour
        const created = result.results.filter(r => r.status === 'created').length;
        const updated = result.results.filter(r => r.status === 'updated').length;
        const errors = result.results.filter(r => r.status === 'error').length;
        
        let message = \`Synchronisation réussie: \${created} produits créés, \${updated} mis à jour\`;
        if (errors > 0) {
          message += \`, \${errors} erreurs\`;
        }
        
        this.showNotification(message, 'success');
      })
      .catch(error => {
        this.log('Erreur de synchronisation: ' + error.message, 'error');
        this.showNotification('Erreur de synchronisation: ' + error.message, 'error');
      });
    },
    
    // Fonction de journalisation
    log: function(message, level = 'info') {
      if (!this.config.debug && level !== 'error') return;
      
      const prefix = 'FBE Sync:';
      
      switch (level) {
        case 'error':
          console.error(prefix, message);
          break;
        case 'warning':
          console.warn(prefix, message);
          break;
        case 'success':
          console.log('%c' + prefix, 'color: green', message);
          break;
        default:
          console.log(prefix, message);
      }
    }
  };
  
  // Si le document est déjà chargé, initialiser immédiatement
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
      window.FBE_SYNC.init();
    }, 1);
  } else {
    // Sinon, attendre que le document soit chargé
    document.addEventListener('DOMContentLoaded', () => {
      window.FBE_SYNC.init();
    });
  }
})();
    `;

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'max-age=3600',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération du script de synchronisation:', error);
    return new NextResponse('console.error("Erreur serveur");', {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  }
}
