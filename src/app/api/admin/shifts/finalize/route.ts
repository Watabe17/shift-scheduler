import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, ShiftStatus } from '@prisma/client';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ message: '権限がありません' }, { status: 403 });
  }

  try {
    const result = await prisma.shift.updateMany({
      where: {
        status: ShiftStatus.DRAFT,
      },
      data: {
        status: ShiftStatus.CONFIRMED,
      },
    });

    return NextResponse.json({
      message: 'シフトが確定されました。',
      count: result.count,
    });
  } catch (error) {
    console.error('Failed to finalize shifts:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
} 