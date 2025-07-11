import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ShiftStatus } from "@prisma/client";

// Get confirmed shifts for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shifts = await prisma.shift.findMany({
      where: {
        userId: session.user.id,
        status: ShiftStatus.CONFIRMED,
      },
      include: {
        position: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });
    return NextResponse.json(shifts);
  } catch (error) {
    console.error("Error fetching shifts for user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 