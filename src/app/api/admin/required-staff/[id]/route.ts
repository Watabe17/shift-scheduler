import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Update a required staff rule
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  try {
    const body = await req.json();
    const { count, timeSlot, dayOfWeek } = body;

    const dataToUpdate: { count?: number; timeSlot?: string; dayOfWeek?: number } = {};

    if (count !== undefined) {
      if (typeof count !== 'number' || count < 0) {
        return NextResponse.json({ error: "Invalid count" }, { status: 400 });
      }
      dataToUpdate.count = count;
    }
    if(timeSlot !== undefined) dataToUpdate.timeSlot = timeSlot;
    if(dayOfWeek !== undefined) dataToUpdate.dayOfWeek = dayOfWeek;


    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updatedRequiredStaff = await prisma.requiredStaff.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedRequiredStaff);
  } catch (error) {
    console.error(`Failed to update required staff ${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Delete a required staff rule
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = params;
  try {
    await prisma.requiredStaff.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete required staff ${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 