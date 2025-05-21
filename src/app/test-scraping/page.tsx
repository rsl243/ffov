'use client';

import { useState } from 'react';

export default function TestScrapingPage() {
  const [url, setUrl] = useState('https://www.ledressingdecloe.com/');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleScrape = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/test-scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Réponse non-JSON reçue: ${text.substring(0, 100)}...`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors du scraping');
      }

      setResults(data.products || []);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Test de Scraping avec Playwright</h1>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="url" className="mb-2 block font-medium">URL du site à scraper</label>
            <input 
              id="url"
              type="text"
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="https://example.com"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button 
            onClick={handleScrape} 
            disabled={loading || !url}
            className={`px-4 py-2 rounded font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {loading ? 'Chargement...' : 'Scraper'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
      
      {results.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Résultats ({results.length} produits)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((product, index) => (
              <div key={index} className="border rounded overflow-hidden shadow-sm">
                {product.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-gray-700 mb-3">
                    {product.price ? `${product.price}€` : 'Prix non disponible'}
                  </p>
                  
                  {product.description && (
                    <p className="text-sm text-gray-500 line-clamp-3 mb-2">
                      {product.description}
                    </p>
                  )}
                  
                  {product.brand && (
                    <p className="text-sm"><span className="font-medium">Marque:</span> {product.brand}</p>
                  )}
                  
                  {product.variants && product.variants.length > 0 && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Tailles:</span> {Array.isArray(product.variants) ? product.variants.join(', ') : product.variants}
                    </p>
                  )}
                  
                  {product.category && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Couleurs:</span> {product.category}
                    </p>
                  )}
                  
                  {product.productUrl && (
                    <div className="mt-3">
                      <a 
                        href={product.productUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Voir le produit
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
