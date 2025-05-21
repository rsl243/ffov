import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur connecté
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { organization: true },
    });

    if (!currentUser || !currentUser.organization) {
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est administrateur
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Droits insuffisants' },
        { status: 403 }
      );
    }

    // Récupérer tous les utilisateurs de l'organisation
    const users = await prisma.user.findMany({
      where: { organizationId: currentUser.organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    // Validation basique
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email et rôle requis' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur connecté
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { organization: true },
    });

    if (!currentUser || !currentUser.organization) {
      return NextResponse.json(
        { error: 'Organisation non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est administrateur
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Droits insuffisants' },
        { status: 403 }
      );
    }

    // Vérifier les limites de l'offre VILLE
    if (currentUser.organization.subscriptionType === 'VILLE') {
      const userCount = await prisma.user.count({
        where: { organizationId: currentUser.organizationId },
      });

      if (userCount >= 3) {
        return NextResponse.json(
          { error: 'Limite de 3 utilisateurs atteinte pour l\'offre VILLE' },
          { status: 400 }
        );
      }
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Créer l'utilisateur avec un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split('@')[0], // Nom temporaire basé sur l'email
        role,
        organizationId: currentUser.organizationId,
        active: false, // L'utilisateur doit activer son compte
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // TODO: Envoyer un email d'invitation avec le mot de passe temporaire

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}