import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vendors/[id]
 * Récupère les informations d'un vendeur spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id;
    
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
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

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Erreur lors de la récupération du vendeur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendors/[id]
 * Met à jour les informations d'un vendeur spécifique
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id;
    const body = await request.json();
    
    // Vérifier si le vendeur existe
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendeur non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour les informations du vendeur
    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        storeName: body.storeName !== undefined ? body.storeName : undefined,
        websiteUrl: body.websiteUrl !== undefined ? body.websiteUrl : undefined,
        syncEnabled: body.syncEnabled !== undefined ? body.syncEnabled : undefined,
      },
    });

    return NextResponse.json({ vendor: updatedVendor });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du vendeur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
