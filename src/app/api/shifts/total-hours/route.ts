import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { differenceInMinutes } from "date-fns";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // e.g., '6' for June
  const year = searchParams.get("year"); // e.g., '2025'

  if (!month || !year) {
    return NextResponse.json(
      { error: "Month and year parameters are required" },
      { status: 400 }
    );
  }

  const monthIndex = parseInt(month, 10) - 1; // JS months are 0-indexed
  const yearInt = parseInt(year, 10);

  const startDate = new Date(yearInt, monthIndex, 1);
  const endDate = new Date(yearInt, monthIndex + 1, 0); // Last day of the month

  try {
    const shifts = await prisma.shift.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalMinutes = 0;
    for (const shift of shifts) {
      const startTime = new Date(`${formatDate(shift.date, 'yyyy-MM-dd')}T${shift.startTime}`);
      const endTime = new Date(`${formatDate(shift.date, 'yyyy-MM-dd')}T${shift.endTime}`);
      totalMinutes += differenceInMinutes(endTime, startTime);
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return NextResponse.json({
      totalHours: hours,
      totalMinutes: minutes,
    });
  } catch (error) {
    console.error("Failed to calculate total hours:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper to format date since it's used above
function formatDate(date: Date, formatString: string): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
} 