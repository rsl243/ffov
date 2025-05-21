/**
 * Client de synchronisation pour les vendeurs
 * 
 * Ce module fournit des fonctions pour synchroniser les produits d'un site web de vendeur
 * avec la plateforme FBE. Il peut être utilisé comme un script côté client ou comme
 * un module Node.js pour l'intégration serveur.
 */

export interface ProductData {
  externalId: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  imageUrl?: string;
}

export interface SyncOptions {
  apiBaseUrl: string;
  vendorId: string;
  apiKey: string;
  onProgress?: (current: number, total: number) => void;
  onComplete?: (result: any) => void;
  onError?: (error: any) => void;
}

/**
 * Synchronise les produits avec la plateforme FBE
 */
export async function syncProducts(products: ProductData[], options: SyncOptions): Promise<any> {
  const { apiBaseUrl, vendorId, apiKey, onProgress, onComplete, onError } = options;
  
  try {
    // Valider les données des produits
    const validProducts = products.filter(product => {
      return product.externalId && product.name && product.price !== undefined;
    });
    
    if (validProducts.length === 0) {
      throw new Error('Aucun produit valide à synchroniser');
    }
    
    // Informer de la progression
    if (onProgress) {
      onProgress(0, validProducts.length);
    }
    
    // Envoyer les produits à l'API
    const response = await fetch(`${apiBaseUrl}/api/vendors/${vendorId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ products: validProducts })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la synchronisation');
    }
    
    const result = await response.json();
    
    // Informer de la fin de la synchronisation
    if (onProgress) {
      onProgress(validProducts.length, validProducts.length);
    }
    
    if (onComplete) {
      onComplete(result);
    }
    
    return result;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

/**
 * Vérifie l'état de synchronisation avec la plateforme FBE
 */
export async function checkSyncStatus(options: SyncOptions): Promise<any> {
  const { apiBaseUrl, vendorId, apiKey } = options;
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/vendors/${vendorId}/sync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la vérification de l\'état de synchronisation');
    }
    
    return await response.json();
  } catch (error) {
    if (options.onError) {
      options.onError(error);
    }
    throw error;
  }
}

/**
 * Génère un script de synchronisation à intégrer dans le site du vendeur
 */
export function generateSyncScript(options: SyncOptions): string {
  const { apiBaseUrl, vendorId, apiKey } = options;
  
  return `
<script>
// Script de synchronisation FBE
(function() {
  const FBE_SYNC = {
    apiBaseUrl: "${apiBaseUrl}",
    vendorId: "${vendorId}",
    apiKey: "${apiKey}",
    
    // Collecte les produits de la page
    collectProducts: function() {
      // Cette fonction doit être personnalisée en fonction de la structure du site du vendeur
      // Exemple pour un site e-commerce standard avec des produits dans des éléments avec la classe 'product'
      const productElements = document.querySelectorAll('.product');
      const products = [];
      
      productElements.forEach((el, index) => {
        try {
          // Adapter ces sélecteurs à la structure HTML du site du vendeur
          const id = el.getAttribute('data-product-id') || 'product-' + index;
          const name = el.querySelector('.product-name')?.textContent?.trim();
          const priceText = el.querySelector('.product-price')?.textContent?.trim();
          const price = priceText ? parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) : 0;
          const description = el.querySelector('.product-description')?.textContent?.trim();
          const stock = parseInt(el.querySelector('.product-stock')?.textContent?.trim() || '0');
          const imageUrl = el.querySelector('.product-image')?.getAttribute('src');
          
          if (id && name && !isNaN(price)) {
            products.push({
              externalId: id,
              name,
              price,
              description,
              stock,
              imageUrl
            });
          }
        } catch (err) {
          console.error('Erreur lors de la collecte du produit:', err);
        }
      });
      
      return products;
    },
    
    // Synchronise les produits avec la plateforme FBE
    sync: async function() {
      const products = this.collectProducts();
      console.log('Produits collectés:', products.length);
      
      if (products.length === 0) {
        console.warn('Aucun produit trouvé à synchroniser');
        return;
      }
      
      try {
        const response = await fetch(\`\${this.apiBaseUrl}/api/vendors/\${this.vendorId}/sync\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${this.apiKey}\`
          },
          body: JSON.stringify({ products })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la synchronisation');
        }
        
        const result = await response.json();
        console.log('Synchronisation réussie:', result);
        
        // Afficher une notification de succès
        this.showNotification('Synchronisation réussie avec FBE!', 'success');
        
        return result;
      } catch (error) {
        console.error('Erreur de synchronisation:', error);
        this.showNotification('Erreur de synchronisation avec FBE', 'error');
        throw error;
      }
    },
    
    // Affiche une notification
    showNotification: function(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = 'fbe-notification fbe-notification-' + type;
      notification.innerHTML = \`
        <div class="fbe-notification-content">
          <span>\${message}</span>
          <button class="fbe-notification-close">&times;</button>
        </div>
      \`;
      
      // Ajouter des styles
      const style = document.createElement('style');
      style.textContent = \`
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
      document.body.appendChild(notification);
      
      // Fermer la notification au clic
      notification.querySelector('.fbe-notification-close').addEventListener('click', () => {
        notification.remove();
      });
      
      // Auto-fermeture après 5 secondes
      setTimeout(() => {
        notification.remove();
      }, 5000);
    },
    
    // Initialise le bouton de synchronisation
    init: function() {
      // Créer un bouton de synchronisation
      const syncButton = document.createElement('button');
      syncButton.textContent = 'Synchroniser avec FBE';
      syncButton.className = 'fbe-sync-button';
      syncButton.style.cssText = \`
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
      \`;
      
      syncButton.addEventListener('click', () => {
        this.sync();
      });
      
      document.body.appendChild(syncButton);
      
      console.log('FBE Sync Client initialisé');
    }
  };
  
  // Initialiser le client de synchronisation
  document.addEventListener('DOMContentLoaded', () => {
    FBE_SYNC.init();
  });
  
  // Exposer l'API globalement
  window.FBE_SYNC = FBE_SYNC;
})();
</script>
  `;
}
