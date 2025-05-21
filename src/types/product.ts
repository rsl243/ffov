/**
 * Type pour les produits extraits des sites web
 */
export interface ExtractedProduct {
  externalId: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  imageUrl?: string;
  productUrl?: string;
  sku?: string;
  brand?: string;
  category?: string;
  variants?: string[];
  weight?: number;
  dimensions?: string;
  attributes?: Record<string, any>;
}
