import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Get all required staff rules (for any authenticated user)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requiredStaff = await prisma.requiredStaff.findMany({
      include: {
        position: true,
      },
    });
    return NextResponse.json(requiredStaff);
  } catch (error) {
    console.error("Failed to fetch required staff:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 