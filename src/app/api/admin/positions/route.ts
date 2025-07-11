import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Position } from '@prisma/client';

// Get all positions with their required staff counts
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const positions = await prisma.position.findMany({
      include: {
        requiredStaffs: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    return NextResponse.json(positions);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Create a new position
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  
    try {
      const { name } = await req.json() as { name: string };
  
      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
  
      const newPosition = await prisma.position.create({
        data: { name },
      });
  
      return NextResponse.json(newPosition, { status: 201 });
    } catch (error) {
      console.error("Failed to create position:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  } 