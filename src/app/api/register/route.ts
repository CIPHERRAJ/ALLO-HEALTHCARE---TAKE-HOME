import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, isAdminRegistration } = body;

    console.log(`[AUTH] Registration attempt: ${email}`);

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Step 1: Check existing user
    console.log(`[AUTH] Step 1: Checking for existing user...`);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    }).catch(e => {
      console.error("[AUTH] Step 1 Failed:", e);
      throw new Error(`Database check failed: ${e.message}`);
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Step 2: Hash password
    console.log(`[AUTH] Step 2: Hashing password...`);
    const hashedPassword = await bcrypt.hash(password, 10).catch(e => {
      console.error("[AUTH] Step 2 Failed:", e);
      throw new Error("Encryption failed");
    });

    // Step 3: Determine Role
    console.log(`[AUTH] Step 3: Determining role...`);
    let role: 'USER' | 'ADMIN' = 'USER';
    
    if (isAdminRegistration === true) {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } }).catch(e => {
        console.error("[AUTH] Step 3 Failed (count):", e);
        throw new Error("Admin status check failed");
      });

      if (adminCount === 0) {
        role = 'ADMIN';
        console.log("[AUTH] Granting initial ADMIN role");
      } else {
        return NextResponse.json(
          { error: "An administrator already exists. This setup is locked." },
          { status: 403 }
        );
      }
    }

    // Step 4: Create user
    console.log(`[AUTH] Step 4: Creating user record in database...`);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role,
      },
    }).catch(e => {
      console.error("[AUTH] Step 4 Failed (create):", e);
      throw new Error(`User creation failed: ${e.message}`);
    });

    console.log(`[AUTH] Success: User created with ID ${user.id}`);
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
