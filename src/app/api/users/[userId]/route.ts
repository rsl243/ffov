
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { UserRole } from '@/types/user';

// Type étendu pour l'utilisateur Prisma
type UserWithRole = {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  active: boolean;
  [key: string]: any;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role } = body;

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a les droits pour modifier le rôle
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
    }) as unknown as UserWithRole;

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Droits insuffisants' },
        { status: 403 }
      );
    }

    // Mettre à jour le rôle de l'utilisateur
    const updatedUser = await prisma.$executeRaw`UPDATE "User" SET role = ${role} WHERE id = ${params.userId}`;
    
    // Récupérer l'utilisateur mis à jour
    const updatedUserData = await prisma.user.findUnique({
      where: { id: params.userId },
    }) as unknown as UserWithRole;

    return NextResponse.json(updatedUserData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a les droits pour supprimer
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
    }) as unknown as UserWithRole;

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Droits insuffisants' },
        { status: 403 }
      );
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: params.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
