import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  
  try {
    const shiftRequests = await prisma.shiftRequest.findMany({
      where: status ? { status } : {},
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
        shift: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(shiftRequests);
  } catch (error) {
    console.error("Failed to fetch shift requests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 