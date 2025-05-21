import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/vendors : liste tous les vendeurs
export async function GET(request: NextRequest) {
  try {
    const vendors = await prisma.vendor.findMany({
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
    return NextResponse.json({ vendors });
  } catch (error) {
    console.error('Erreur lors de la récupération des vendeurs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/vendors : ajoute un vendeur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, storeName, websiteUrl } = body;

    if (!userId || !storeName || !websiteUrl) {
      return NextResponse.json(
        { error: 'UserId, nom du magasin et URL du site web requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est déjà un vendeur
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId },
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: 'Cet utilisateur est déjà un vendeur' },
        { status: 400 }
      );
    }

    // Créer le vendeur
    const vendor = await prisma.vendor.create({
      data: {
        userId,
        storeName,
        websiteUrl,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du vendeur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du vendeur' },
      { status: 500 }
    );
  }
}
