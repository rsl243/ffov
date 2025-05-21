import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vendors/me/shipping
 * Récupère les réglages d'expédition du vendeur connecté
 */
export async function GET(request: NextRequest) {
  try {
    // À adapter selon ton auth réelle
    const vendor = await prisma.vendor.findFirst();
    if (!vendor) return NextResponse.json({ error: 'Vendeur non trouvé' }, { status: 404 });
    const settings = await prisma.shippingSettings.findFirst({ where: { vendorId: vendor.id.toString() } });
    const options = await prisma.shippingOption.findMany({ where: { vendorId: vendor.id.toString() } });
    return NextResponse.json({ settings, options });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

/**
 * POST /api/vendors/me/shipping
 * Met à jour les réglages d'expédition du vendeur connecté
 * Body: { freeShippingMin: number, options: Array<{ name: string, price: number, delay: string }> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // À adapter selon ton auth réelle
    const vendor = await prisma.vendor.findFirst();
    if (!vendor) return NextResponse.json({ error: 'Vendeur non trouvé' }, { status: 404 });
    // Upsert des settings généraux
    await prisma.shippingSettings.upsert({
      where: { vendorId: vendor.id.toString() },
      update: { freeShippingMin: body.freeShippingMin },
      create: { vendorId: vendor.id.toString(), freeShippingMin: body.freeShippingMin },
    });
    // Suppression des anciennes options puis insertion des nouvelles
    await prisma.shippingOption.deleteMany({ where: { vendorId: vendor.id.toString() } });
    await prisma.shippingOption.createMany({
      data: body.options.map((opt: any) => ({ ...opt, vendorId: vendor.id.toString() })),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
