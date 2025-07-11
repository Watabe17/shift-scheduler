import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { getDay, startOfDay, addDays } from 'date-fns';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get pending shift requests (requests that are awaiting admin approval)
    const pendingRequestCount = await prisma.shiftRequest.count({
      where: {
        status: 'pending',
      },
    });

    // 2. Get shifts for the next 7 days
    const today = startOfDay(new Date());
    const sevenDaysLater = addDays(today, 7);
    
    const shiftsThisWeek = await prisma.shift.findMany({
        where: {
            date: {
                gte: today,
                lt: sevenDaysLater,
            }
        },
        include: {
            position: true,
        }
    });

    const shiftsThisWeekCount = shiftsThisWeek.length;
    
    // 3. Calculate staffing shortages for the next 7 days
    const requiredStaffRules = await prisma.requiredStaff.findMany({
        include: {
            position: true
        }
    });

    let staffingShortagesCount = 0;
    const checkedPositions = new Set<string>(); // To avoid double counting on the same day

    for (let i = 0; i < 7; i++) {
        const currentDate = addDays(today, i);
        const dayOfWeek = getDay(currentDate);
        checkedPositions.clear();

        const shiftsOnDate = shiftsThisWeek.filter(s => s.date.toDateString() === currentDate.toDateString());
        const rulesForDay = requiredStaffRules.filter(r => r.dayOfWeek === dayOfWeek);

        for (const rule of rulesForDay) {
            const positionDateKey = `${rule.positionId}-${currentDate.toISOString()}`;
            if(checkedPositions.has(positionDateKey)) continue;

            const placedCount = shiftsOnDate.filter(s => s.positionId === rule.positionId).length;

            if (placedCount < rule.count) {
                staffingShortagesCount++;
            }
            checkedPositions.add(positionDateKey);
        }
    }
    
    return NextResponse.json({
      pendingRequestCount,
      shiftsThisWeekCount,
      staffingShortagesCount,
    });
    
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 