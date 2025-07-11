import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Mark a notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const updatedNotification = await prisma.notification.updateMany({
      where: {
        id: id,
        userId: session.user.id, // Ensure users can only update their own notifications
      },
      data: {
        read: true,
      },
    });

    if (updatedNotification.count === 0) {
        return NextResponse.json({ error: "Notification not found or user not authorized." }, { status: 404 });
    }

    return NextResponse.json({ message: "Notification marked as read." });
  } catch (error) {
    console.error(`Failed to update notification ${id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 