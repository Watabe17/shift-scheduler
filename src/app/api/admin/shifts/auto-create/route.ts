import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, Prisma, ShiftRequest } from '@prisma/client';

type RejectedRequest = {
  request: ShiftRequest & { user: { name: string | null } };
  reason: 'USER_OVERLAP' | 'NO_REQUIREMENT' | 'POSITION_FILLED';
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ message: '権限がありません' }, { status: 403 });
  }

  try {
    const pendingRequests = await prisma.shiftRequest.findMany({
      where: { status: 'pending' },
      include: { user: { select: { name: true } }, position: true },
      orderBy: { createdAt: 'asc' },
    });

    const requiredStaffing = await prisma.requiredStaff.findMany();
    const rejectedRequests: RejectedRequest[] = [];

    const transactionResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let count = 0;
      const createdShiftsInTransaction: { positionId: string; dayOfWeek: number; timeSlot: string; }[] = [];

      // Pre-check for existing shifts for all users in the request list to minimize DB calls in loop
      const userIds = [...new Set(pendingRequests.map(r => r.userId))];
      const existingShiftsForUsers = await tx.shift.findMany({
          where: { userId: { in: userIds } },
      });

      for (const request of pendingRequests) {
        const existingShifts = existingShiftsForUsers.filter(s => 
            s.userId === request.userId && 
            s.date.getTime() === request.date.getTime() &&
            s.startTime < request.endTime && 
            s.endTime > request.startTime
        );

        if (existingShifts.length > 0) {
          rejectedRequests.push({ request: request as any, reason: 'USER_OVERLAP' });
          continue;
        }

        const requestDayOfWeek = new Date(request.date).getDay();
        const timeSlotString = `${request.startTime}-${request.endTime}`;

        const required = requiredStaffing.find(
          (r) =>
            r.positionId === request.positionId &&
            r.dayOfWeek === requestDayOfWeek &&
            r.timeSlot === timeSlotString
        );

        if (!required) {
          rejectedRequests.push({ request: request as any, reason: 'NO_REQUIREMENT' });
          continue; 
        }

        const currentAssignments = createdShiftsInTransaction.filter(
          (s) =>
            s.positionId === request.positionId &&
            s.dayOfWeek === requestDayOfWeek &&
            s.timeSlot === timeSlotString
        ).length;

        if (currentAssignments >= required.count) {
          rejectedRequests.push({ request: request as any, reason: 'POSITION_FILLED' });
          continue;
        }

        // All checks passed, create the shift
        await tx.shift.create({
          data: {
            userId: request.userId,
            positionId: request.positionId,
            date: request.date,
            startTime: request.startTime,
            endTime: request.endTime,
            status: 'DRAFT',
            shiftRequestId: request.id,
          },
        });

        await tx.shiftRequest.update({
          where: { id: request.id },
          data: { status: 'approved' },
        });

        createdShiftsInTransaction.push({
          positionId: request.positionId,
          dayOfWeek: requestDayOfWeek,
          timeSlot: timeSlotString
        });
        count++;
      }
      return count;
    });

    return NextResponse.json({ 
        message: 'シフトの自動生成が完了しました。',
        createdShiftsCount: transactionResult,
        rejectedRequests: rejectedRequests,
    });

  } catch (error) {
    console.error('Failed to auto-create shifts:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
} 