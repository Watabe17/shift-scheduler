import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const getAll = searchParams.get("all") === 'true';

  let whereClause: any = { userId: session.user.id };

  // 従業員ページ改善のため、全件取得を許可
  if (getAll) {
      whereClause = {};
  }

  try {
    const shiftRequests = await prisma.shiftRequest.findMany({
      where: whereClause,
      include: {
        user: true,
        position: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(shiftRequests);
  } catch (error) {
    console.error("Failed to fetch shift requests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { date, startTime, endTime, positionId } = body;

        if (!date || !startTime || !endTime || !positionId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newShiftRequest = await prisma.shiftRequest.create({
            data: {
                userId: session.user.id,
                positionId,
                date: new Date(date),
                startTime,
                endTime,
            },
        });

        return NextResponse.json(newShiftRequest, { status: 201 });
    } catch (error) {
        console.error("Failed to create shift request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  // Implementation for PUT request
}

export async function DELETE(req: Request) {
  // Implementation for DELETE request
} 