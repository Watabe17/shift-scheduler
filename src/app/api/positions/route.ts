import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  // Allow any authenticated user to fetch positions
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const positions = await prisma.position.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(positions);
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 