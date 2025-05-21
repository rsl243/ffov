// Données de test pour les produits
export const mockProducts = [
  // Produits avec succès (10 produits)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `success-${i + 1}`,
    name: `Produit Complet ${i + 1}`,
    price: 29.90 + i,
    sku: `product-${i + 1}-${Math.floor(Math.random() * 10000)}`,
    externalId: `ext-${i + 1}-${Math.floor(Math.random() * 10000)}`,
    stock: Math.floor(Math.random() * 100),
    imageUrl: `https://via.placeholder.com/400x400?text=Produit+${i + 1}`,
    description: `Description complète du produit ${i + 1}. Ce produit est de haute qualité et répond à tous les critères.`,
    productUrl: `https://www.example.com/product-${i + 1}`,
    brand: `Marque ${i % 3 + 1}`,
    category: `Catégorie ${i % 5 + 1}`,
    variants: JSON.stringify(['S', 'M', 'L', 'XL']),
    weight: 0.5 + (i * 0.1),
    dimensions: '20x30x10',
    attributes: JSON.stringify({ color: 'Bleu', material: 'Coton' }),
    updatedAt: new Date(2025, 3, 24, 22, 21, 13).toISOString(),
    vendorId: ''
  })),

  // Produits avec attention requise (8 produits)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `warning-${i + 1}`,
    name: `Produit Incomplet ${i + 1}`,
    price: 39.90 + i,
    sku: `product-warning-${i + 1}-${Math.floor(Math.random() * 10000)}`,
    externalId: `ext-warning-${i + 1}-${Math.floor(Math.random() * 10000)}`,
    stock: Math.floor(Math.random() * 50),
    imageUrl: i % 2 === 0 ? '' : `https://via.placeholder.com/400x400?text=Produit+Incomplet+${i + 1}`,
    description: i % 3 === 0 ? '' : `Description partielle du produit ${i + 1}.`,
    productUrl: i % 4 === 0 ? '' : `https://www.example.com/product-incomplet-${i + 1}`,
    brand: i % 2 === 0 ? `Marque ${i % 3 + 1}` : '',
    category: i % 3 === 0 ? `Catégorie ${i % 5 + 1}` : '',
    variants: i % 2 === 0 ? JSON.stringify(['M', 'L']) : '',
    weight: i % 2 === 0 ? 0.5 + (i * 0.1) : null,
    dimensions: i % 3 === 0 ? '20x30x10' : '',
    attributes: i % 2 === 0 ? JSON.stringify({ color: 'Rouge' }) : '',
    updatedAt: new Date(2025, 3, 24, 22, 21, 13).toISOString(),
    vendorId: ''
  })),

  // Produits avec erreurs (5 produits)
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `error-${i + 1}`,
    name: i % 2 === 0 ? `Produit Erreur ${i + 1}` : '',
    price: i % 2 === 0 ? 0 : 49.90 + i,
    sku: `product-error-${i + 1}-${Math.floor(Math.random() * 10000)}`,
    externalId: `ext-error-${i + 1}-${Math.floor(Math.random() * 10000)}`,
    stock: 0,
    imageUrl: '',
    description: '',
    productUrl: '',
    brand: '',
    category: '',
    variants: '',
    weight: null,
    dimensions: '',
    attributes: '',
    updatedAt: new Date(2025, 3, 24, 22, 21, 13).toISOString(),
    vendorId: ''
  }))
];

// Fonction pour générer des produits spécifiques à un site web
export function getProductsForWebsite(websiteUrl: string) {
  // Extraire le nom de domaine de l'URL
  const domainMatch = /https?:\/\/(?:www\.)?([^\/]+)/.exec(websiteUrl);
  const domain = domainMatch ? domainMatch[1] : 'example.com';
  
  // Générer un identifiant unique basé sur le domaine
  const domainId = domain.replace(/\./g, '-').replace(/\//g, '-');
  
  // Créer des produits spécifiques au site web
  return [
    // Produits avec succès (10 produits)
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `${domainId}-success-${i + 1}`,
      name: domain.includes('moka-blanc') 
        ? `Vêtement ${i + 1}` 
        : domain.includes('carol') 
          ? `Accessoire ${i + 1}` 
          : `Produit ${domain.split('.')[0]} ${i + 1}`,
      price: 29.90 + (i * 2),
      sku: `${domainId}-${i + 1}-${Math.floor(Math.random() * 10000)}`,
      externalId: `${domainId}-ext-${i + 1}-${Math.floor(Math.random() * 10000)}`,
      stock: Math.floor(Math.random() * 100),
      imageUrl: `https://via.placeholder.com/400x400?text=${encodeURIComponent(domain.split('.')[0])}+${i + 1}`,
      description: `Description complète du produit ${i + 1} de ${domain}. Ce produit est de haute qualité et répond à tous les critères.`,
      productUrl: `https://${domain}/product-${i + 1}`,
      brand: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      category: `Catégorie ${i % 5 + 1}`,
      variants: JSON.stringify(['S', 'M', 'L', 'XL']),
      weight: 0.5 + (i * 0.1),
      dimensions: '20x30x10',
      attributes: JSON.stringify({ color: 'Bleu', material: 'Coton' }),
      updatedAt: new Date(2025, 3, 24, 22, 21, 13).toISOString(),
      vendorId: ''
    })),

    // Produits avec attention requise (8 produits)
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `${domainId}-warning-${i + 1}`,
      name: domain.includes('moka-blanc') 
        ? `Vêtement Incomplet ${i + 1}` 
        : domain.includes('carol') 
          ? `Accessoire Incomplet ${i + 1}` 
          : `Produit Incomplet ${domain.split('.')[0]} ${i + 1}`,
      price: 39.90 + (i * 1.5),
      sku: `${domainId}-warning-${i + 1}-${Math.floor(Math.random() * 10000)}`,
      externalId: `${domainId}-ext-warning-${i + 1}-${Math.floor(Math.random() * 10000)}`,
      stock: Math.floor(Math.random() * 50),
      imageUrl: i % 2 === 0 ? '' : `https://via.placeholder.com/400x400?text=${encodeURIComponent(domain.split('.')[0])}+Incomplet+${i + 1}`,
      description: i % 3 === 0 ? '' : `Description partielle du produit ${i + 1} de ${domain}.`,
      productUrl: i % 4 === 0 ? '' : `https://${domain}/product-incomplet-${i + 1}`,
      brand: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      category: i % 3 === 0 ? `Catégorie ${i % 5 + 1}` : '',
      variants: i % 2 === 0 ? JSON.stringify(['M', 'L']) : '',
      weight: i % 2 === 0 ? 0.5 + (i * 0.1) : null,
      dimensions: i % 3 === 0 ? '20x30x10' : '',
      attributes: i % 2 === 0 ? JSON.stringify({ color: 'Rouge' }) : '',
      updatedAt: new Date(2025, 3, 24, 22, 21, 13).toISOString(),
      vendorId: ''
    })),

    // Produits avec erreurs (5 produits)
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `${domainId}-error-${i + 1}`,
      name: i % 2 === 0 
        ? (domain.includes('moka-blanc') 
            ? `Vêtement Erreur ${i + 1}` 
            : domain.includes('carol') 
              ? `Accessoire Erreur ${i + 1}` 
              : `Produit Erreur ${domain.split('.')[0]} ${i + 1}`)
        : '',
      price: i % 2 === 0 ? 0 : 49.90 + (i * 2),
      sku: `${domainId}-error-${i + 1}-${Math.floor(Math.random() * 10000)}`,
      externalId: `${domainId}-ext-error-${i + 1}-${Math.floor(Math.random() * 10000)}`,
      stock: 0,
      imageUrl: '',
      description: '',
      productUrl: '',
      brand: '',
      category: '',
      variants: '',
      weight: null,
      dimensions: '',
      attributes: '',
      updatedAt: new Date(2025, 3, 24, 22, 21, 13).toISOString(),
      vendorId: ''
    }))
  ];
}
