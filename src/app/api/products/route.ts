import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products : liste tous les produits
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/products : ajoute un produit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, description } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nom et prix requis' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: { name, price, description },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
} 