import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name, isAdminRegistration } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let role: 'USER' | 'ADMIN' = 'USER';
    
    // One-time Admin Registration Logic
    if (isAdminRegistration) {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount === 0) {
        role = 'ADMIN';
      } else {
        return NextResponse.json(
          { error: "An administrator already exists. This option is no longer available." },
          { status: 403 }
        );
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTRATION_ERROR", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
