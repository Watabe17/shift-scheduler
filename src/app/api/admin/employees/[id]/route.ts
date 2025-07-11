import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    
    try {
        const { positionIds } = await req.json();
        if (!Array.isArray(positionIds)) {
            return NextResponse.json({ error: "positionIds must be an array" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                positions: {
                    set: positionIds.map((pid: string) => ({ id: pid })),
                },
            },
            include: {
                positions: true,
            },
        });
        
        const { password: _, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);

    } catch (error: any) {
        console.error(`Error updating positions for user ${id}:`, error);
        // Handle cases where the user might not be found
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 