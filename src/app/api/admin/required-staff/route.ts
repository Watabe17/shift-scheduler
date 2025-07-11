import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { positionId, dayOfWeek, timeSlot, count } = body;

    if (!positionId || dayOfWeek === undefined || !timeSlot || count === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    if(typeof count !== 'number' || count < 0){
        return NextResponse.json({ error: "Invalid count" }, { status: 400 });
    }

    const newRequiredStaff = await prisma.requiredStaff.create({
      data: {
        positionId,
        dayOfWeek,
        timeSlot,
        count,
      },
    });

    return NextResponse.json(newRequiredStaff, { status: 201 });
  } catch (error) {
    console.error("Failed to create required staff:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
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