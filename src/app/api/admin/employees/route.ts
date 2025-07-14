import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Get all employees
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const employees = await prisma.user.findMany({
            where: {
                role: "EMPLOYEE",
            },
            include: {
                positions: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Create a new employee
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { name, email, password, positionIds } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "EMPLOYEE",
                positions: {
                    connect: positionIds.map((id: string) => ({ id })),
                }
            },
            include: {
                positions: true
            }
        });
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        return NextResponse.json(userWithoutPassword, { status: 201 });

    } catch (error) {
        console.error("Error creating employee:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 