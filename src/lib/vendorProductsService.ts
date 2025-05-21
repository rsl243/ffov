import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Interface pour les produits du vendeur
export interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  externalId: string;
  stock: number;
  imageUrl: string;
  description: string;
  productUrl: string;
  brand: string;
  category: string;
  variants: string;
  weight: number | null;
  dimensions: string;
  attributes: string;
  updatedAt: string;
  vendorId: string;
}

// Interface pour le statut de la synchronisation
export interface SyncStatus {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  errorCount: number;
  startedAt: string;
  completedAt?: string;
  vendorId: string;
  message?: string;
}

// Classe de service pour les produits des vendeurs
export class VendorProductsService {
  
  // Récupérer tous les produits d'un vendeur avec filtrage et pagination
  async getProductsByVendor(
    vendorId: string, 
    page = 1, 
    limit = 10, 
    status?: 'success' | 'warning' | 'error' | 'all',
    searchTerm?: string
  ): Promise<{ products: Product[], total: number }> {
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('vendor_id', vendorId);
      
      // Filtrer par statut si spécifié
      if (status && status !== 'all') {
        if (status === 'error') {
          // Produits avec erreurs : nom manquant ou prix à zéro
          query = query.or('name.eq.,price.eq.0');
        } else if (status === 'warning') {
          // Produits avec avertissements : image ou description manquante
          query = query.or('image_url.eq.,description.eq.').not('name', 'is', null).not('price', 'eq', 0);
        } else if (status === 'success') {
          // Produits complets
          query = query.not('name', 'is', null).not('price', 'eq', 0).not('image_url', 'is', null).not('description', 'is', null);
        }
      }
      
      // Recherche par terme si spécifié
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,external_id.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`);
      }
      
      // Ajouter la pagination
      const startIndex = (page - 1) * limit;
      query = query.range(startIndex, startIndex + limit - 1).order('updated_at', { ascending: false });
      
      // Exécuter la requête
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        throw error;
      }
      
      // Transformer les données en format attendu
      const products = (data || []).map(item => ({
        id: item.id,
        name: item.name || '',
        price: item.price || 0,
        sku: item.sku || '',
        externalId: item.external_id || '',
        stock: item.stock || 0,
        imageUrl: item.image_url || '',
        description: item.description || '',
        productUrl: item.product_url || '',
        brand: item.brand || '',
        category: item.category || '',
        variants: item.variants || '',
        weight: item.weight,
        dimensions: item.dimensions || '',
        attributes: item.attributes || '',
        updatedAt: item.updated_at,
        vendorId: item.vendor_id
      }));
      
      return {
        products,
        total: count || 0
      };
      
    } catch (error) {
      console.error('Erreur dans le service de produits:', error);
      return {
        products: [],
        total: 0
      };
    }
  }
  
  // Créer un nouveau produit
  async createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      const newProduct = {
        id: uuidv4(),
        name: product.name,
        price: product.price,
        sku: product.sku,
        external_id: product.externalId,
        stock: product.stock,
        image_url: product.imageUrl,
        description: product.description,
        product_url: product.productUrl,
        brand: product.brand,
        category: product.category,
        variants: product.variants,
        weight: product.weight,
        dimensions: product.dimensions,
        attributes: product.attributes,
        updated_at: new Date().toISOString(),
        vendor_id: product.vendorId
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la création du produit:', error);
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name || '',
        price: data.price || 0,
        sku: data.sku || '',
        externalId: data.external_id || '',
        stock: data.stock || 0,
        imageUrl: data.image_url || '',
        description: data.description || '',
        productUrl: data.product_url || '',
        brand: data.brand || '',
        category: data.category || '',
        variants: data.variants || '',
        weight: data.weight,
        dimensions: data.dimensions || '',
        attributes: data.attributes || '',
        updatedAt: data.updated_at,
        vendorId: data.vendor_id
      };
      
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      return null;
    }
  }
  
  // Mettre à jour un produit existant
  async updateProduct(productId: string, product: Partial<Product>): Promise<Product | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (product.name !== undefined) updateData.name = product.name;
      if (product.price !== undefined) updateData.price = product.price;
      if (product.sku !== undefined) updateData.sku = product.sku;
      if (product.externalId !== undefined) updateData.external_id = product.externalId;
      if (product.stock !== undefined) updateData.stock = product.stock;
      if (product.imageUrl !== undefined) updateData.image_url = product.imageUrl;
      if (product.description !== undefined) updateData.description = product.description;
      if (product.productUrl !== undefined) updateData.product_url = product.productUrl;
      if (product.brand !== undefined) updateData.brand = product.brand;
      if (product.category !== undefined) updateData.category = product.category;
      if (product.variants !== undefined) updateData.variants = product.variants;
      if (product.weight !== undefined) updateData.weight = product.weight;
      if (product.dimensions !== undefined) updateData.dimensions = product.dimensions;
      if (product.attributes !== undefined) updateData.attributes = product.attributes;
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de la mise à jour du produit:', error);
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name || '',
        price: data.price || 0,
        sku: data.sku || '',
        externalId: data.external_id || '',
        stock: data.stock || 0,
        imageUrl: data.image_url || '',
        description: data.description || '',
        productUrl: data.product_url || '',
        brand: data.brand || '',
        category: data.category || '',
        variants: data.variants || '',
        weight: data.weight,
        dimensions: data.dimensions || '',
        attributes: data.attributes || '',
        updatedAt: data.updated_at,
        vendorId: data.vendor_id
      };
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      return null;
    }
  }
  
  // Récupérer le statut de synchronisation actuel
  async getSyncStatus(vendorId: string): Promise<SyncStatus | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      const { data, error } = await supabase
        .from('sync_jobs')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Aucun résultat trouvé
          return null;
        }
        
        console.error('Erreur lors de la récupération du statut de synchronisation:', error);
        throw error;
      }
      
      return {
        id: data.id,
        status: data.status,
        progress: data.progress,
        totalItems: data.total_items,
        processedItems: data.processed_items,
        errorCount: data.error_count,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        vendorId: data.vendor_id,
        message: data.message
      };
      
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de synchronisation:', error);
      return null;
    }
  }
  
  // Démarrer une nouvelle synchronisation
  async startSync(vendorId: string): Promise<SyncStatus | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      // Créer un nouvel enregistrement de synchronisation
      const { data, error } = await supabase
        .from('sync_jobs')
        .insert([{
          id: uuidv4(),
          status: 'in_progress',
          progress: 0,
          total_items: 0,
          processed_items: 0,
          error_count: 0,
          started_at: new Date().toISOString(),
          vendor_id: vendorId,
          message: 'Synchronisation démarrée'
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors du démarrage de la synchronisation:', error);
        throw error;
      }
      
      // Mettre à jour la date de dernière synchronisation du vendeur
      await supabase
        .from('vendors')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', vendorId);
      
      return {
        id: data.id,
        status: data.status,
        progress: data.progress,
        totalItems: data.total_items,
        processedItems: data.processed_items,
        errorCount: data.error_count,
        startedAt: data.started_at,
        vendorId: data.vendor_id,
        message: data.message
      };
      
    } catch (error) {
      console.error('Erreur lors du démarrage de la synchronisation:', error);
      return null;
    }
  }
}

// Exporter une instance du service
export const vendorProductsService = new VendorProductsService();
