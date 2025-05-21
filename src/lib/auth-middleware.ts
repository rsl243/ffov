import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

/**
 * Middleware pour authentifier les vendeurs via leur API key
 */
export async function authenticateVendor(request: NextRequest) {
  // Récupérer le token d'autorisation
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Token d\'authentification manquant ou invalide',
      status: 401
    };
  }
  
  const apiKey = authHeader.substring(7); // Enlever 'Bearer '
  
  try {
    // Rechercher le vendeur par API key
    const vendor = await prisma.vendor.findUnique({
      where: { apiKey },
    });
    
    if (!vendor) {
      return {
        authenticated: false,
        error: 'Clé API invalide',
        status: 401
      };
    }
    
    if (!vendor.syncEnabled) {
      return {
        authenticated: false,
        error: 'La synchronisation est désactivée pour ce vendeur',
        status: 403
      };
    }
    
    return {
      authenticated: true,
      vendor
    };
  } catch (error) {
    console.error('Erreur d\'authentification du vendeur:', error);
    return {
      authenticated: false,
      error: 'Erreur lors de l\'authentification',
      status: 500
    };
  }
}

/**
 * Middleware pour les routes qui nécessitent une authentification vendeur
 */
export function withVendorAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const authResult = await authenticateVendor(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Ajouter le vendeur à la requête pour que le handler puisse y accéder
    const enhancedContext = {
      ...context,
      vendor: authResult.vendor
    };
    
    return handler(request, enhancedContext);
  };
}
