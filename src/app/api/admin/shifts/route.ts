import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfMonth, endOfMonth } from 'date-fns';
import { ShiftStatus } from "@prisma/client";

export const dynamic = 'force-dynamic'; // キャッシュを無効化

// Get all shifts, optionally filtered by status and/or month
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const status = searchParams.get('status') as ShiftStatus | null;
  
  let whereClause: any = {};

  if (year && month) {
    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // JavaScriptの月は0から始まる
    const startDate = new Date(Date.UTC(yearNum, monthNum, 1));
    const endDate = new Date(Date.UTC(yearNum, monthNum + 1, 0, 23, 59, 59, 999));
    
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  if (status) {
      if (Object.values(ShiftStatus).includes(status as ShiftStatus)) {
          whereClause.status = status;
      } else {
          return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
  }

  try {
    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
          },
      },
      },
      orderBy: {
        date: 'asc',
      }
    });
    return NextResponse.json(shifts);
  } catch (error) {
    console.error("Failed to fetch shifts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Create a new shift from an approved request
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, positionId, date, startTime, endTime, shiftRequestId } = body;

    if (!userId || !positionId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // トランザクションを開始
    const result = await prisma.$transaction(async (tx) => {
      // 既にこのリクエストからシフトが作られていないか確認
      if (shiftRequestId) {
        const existingShift = await tx.shift.findUnique({
          where: { shiftRequestId },
        });
        if (existingShift) {
          // 409 Conflict エラーを返す
          throw new Error("Shift for this request already exists");
        }
      }

      // 1. 新しいシフトを作成
      const newShift = await tx.shift.create({
        data: {
          userId,
          positionId,
          date,
          startTime,
          endTime,
          shiftRequestId,
        },
      });

      // 2. もしシフト希望IDがあれば、関連付ける
      // (この処理はPrismaのrelationで自動的に行われるが、
      // 明示的にstatusを更新するなどの場合に備える)
      // 今回は`shiftRequestId`をuniqueにしているので、重複作成防止が主目的。

      return newShift;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("Failed to create shift:", error);
    if (error.message === "Shift for this request already exists") {
        return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 