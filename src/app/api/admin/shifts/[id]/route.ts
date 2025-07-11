import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET a single shift
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        position: true,
      },
    });
    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }
    return NextResponse.json(shift);
  } catch (error) {
    console.error("Error fetching shift:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// UPDATE a shift
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { date, startTime, endTime, positionId, userId } = body;

    // Optional: Add validation for the incoming data

    const updatedShift = await prisma.shift.update({
      where: { id: params.id },
      data: {
        date: new Date(date),
        startTime,
        endTime,
        positionId,
        userId,
      },
    });
    return NextResponse.json(updatedShift);
  } catch (error) {
    console.error("Error updating shift:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE a shift
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await prisma.shift.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Shift deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting shift:", error);
    // Handle cases where the shift might not exist (e.g., Prisma's P2025 error)
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 