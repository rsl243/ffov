import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET : récupérer les messages entre deux utilisateurs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user1 = searchParams.get('user1');
  const user2 = searchParams.get('user2');
  if (!user1 || !user2) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });
  return NextResponse.json({ messages });
}

// POST : envoyer un message
export async function POST(request: NextRequest) {
  const { content, senderId, receiverId } = await request.json();
  if (!content || !senderId || !receiverId) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }
  const message = await prisma.message.create({
    data: { content, senderId, receiverId }
  });
  return NextResponse.json(message, { status: 201 });
} 