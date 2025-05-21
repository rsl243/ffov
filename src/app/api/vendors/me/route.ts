import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
// Import de la fonction pour récupérer l'URL du store depuis les cookies
import { cookies } from 'next/headers';

/**
 * GET /api/vendors/me
 * Récupère les informations du vendeur connecté ou en crée un nouveau si aucun n'existe
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Début de la récupération des informations du vendeur');
    
    // Vérifier la connexion à la base de données
    try {
      // Test simple pour vérifier que la connexion à la base de données fonctionne
      await prisma.$queryRaw`SELECT 1`;
      console.log('Connexion à la base de données réussie');
    } catch (dbError) {
      console.error('Erreur de connexion à la base de données:', dbError);
      return NextResponse.json(
        { error: 'Erreur de connexion à la base de données' },
        { status: 500 }
      );
    }
    
    // Récupérer l'URL du site web à partir des cookies
    const cookieStore = cookies();
    const websiteUrlCookie = cookieStore.get('faet_website_url')?.value;
    const websiteUrl = websiteUrlCookie || request.cookies.get('websiteUrl')?.value;
    console.log('URL du site web depuis les cookies:', websiteUrl);
    
    // Récupérer l'URL du site web à partir des en-têtes de la requête
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    console.log('Referer:', referer);
    console.log('Origin:', origin);
    
    let vendor;
    
    // Si nous avons une URL de site web dans les cookies, essayer de trouver le vendeur correspondant
    if (websiteUrl) {
      console.log('Recherche du vendeur par URL de site web:', websiteUrl);
      try {
        vendor = await prisma.vendor.findFirst({
          where: { websiteUrl },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        console.log('Résultat de la recherche par URL:', vendor ? 'Trouvé' : 'Non trouvé');
      } catch (error) {
        console.error('Erreur lors de la recherche du vendeur par URL:', error);
      }
    }
    
    // Si nous n'avons pas trouvé de vendeur avec cette URL, essayer avec le domaine du Referer ou Origin
    if (!vendor) {
      
      // Extraire le domaine du Referer ou de l'Origin
      const domainMatch = /https?:\/\/([^\/]+)/.exec(referer || origin);
      const domain = domainMatch ? domainMatch[1] : '';
      console.log('Domaine extrait:', domain);
      
      if (domain) {
        console.log('Recherche du vendeur par domaine:', domain);
        try {
          vendor = await prisma.vendor.findFirst({
            where: {
              websiteUrl: {
                contains: domain
              }
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
          console.log('Résultat de la recherche par domaine:', vendor ? 'Trouvé' : 'Non trouvé');
        } catch (error) {
          console.error('Erreur lors de la recherche du vendeur par domaine:', error);
        }
      }
    }
    
    // Si nous n'avons toujours pas trouvé de vendeur, chercher le vendeur avec l'URL "lolaonthemoon.com"
    if (!vendor) {
      console.log('Recherche du vendeur par défaut (lolaonthemoon.com)');
      try {
        vendor = await prisma.vendor.findFirst({
          where: {
            websiteUrl: {
              contains: 'lolaonthemoon.com'
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        console.log('Résultat de la recherche par défaut:', vendor ? 'Trouvé' : 'Non trouvé');
        
        // Si nous avons trouvé un vendeur par défaut mais que nous avons une URL dans les cookies,
        // remplacer l'URL du vendeur par celle des cookies
        if (vendor && websiteUrl) {
          console.log('Remplacement de l\'URL du vendeur par celle des cookies:', websiteUrl);
          vendor = {
            ...vendor,
            websiteUrl: websiteUrl
          };
        }
      } catch (error) {
        console.error('Erreur lors de la recherche du vendeur par défaut:', error);
      }
    }
    
    // Si nous n'avons toujours pas trouvé de vendeur, prendre le premier vendeur disponible
    if (!vendor) {
      console.log('Recherche du premier vendeur disponible');
      try {
        vendor = await prisma.vendor.findFirst({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        console.log('Résultat de la recherche du premier vendeur:', vendor ? 'Trouvé' : 'Non trouvé');
      } catch (error) {
        console.error('Erreur lors de la recherche du premier vendeur:', error);
      }
    }

    // Si aucun vendeur n'existe, créer un vendeur par défaut avec l'URL lolaonthemoon.com
    if (!vendor) {
      console.log('Création d\'un vendeur par défaut');
      try {
        // D'abord, créer un utilisateur par défaut si nécessaire
        let user = await prisma.user.findFirst();
        console.log('Utilisateur existant trouvé:', user ? 'Oui' : 'Non');
        
        if (!user) {
          console.log('Création d\'un utilisateur par défaut');
          try {
            user = await prisma.user.create({
              data: {
                email: 'vendeur@example.com',
                password: 'password123',
                name: 'Vendeur par défaut',
              },
            });
            console.log('Utilisateur par défaut créé avec succès:', user.id);
          } catch (userError) {
            console.error('Erreur lors de la création de l\'utilisateur par défaut:', userError);
            throw userError;
          }
        }
        
        // Créer un vendeur par défaut
        vendor = await prisma.vendor.create({
          data: {
            userId: user.id,
            storeName: 'Lola on the Moon',
            websiteUrl: 'https://www.lolaonthemoon.com/',
            syncEnabled: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        
        console.log('Vendeur par défaut créé avec succès:', vendor.id);
      } catch (createError) {
        console.error('Erreur lors de la création du vendeur par défaut:', createError);
        return NextResponse.json(
          { error: 'Erreur lors de la création du vendeur par défaut' },
          { status: 500 }
        );
      }
    }

    console.log('Vendeur récupéré avec succès:', vendor?.id);
    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Erreur lors de la récupération du vendeur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du vendeur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
