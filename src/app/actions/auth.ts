"use server";

import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signupSchema, loginSchema, type SignupInput, type LoginInput } from "@/lib/validations/auth";
import { cookies } from "next/headers";

// TODO: Implement actual session storage when database is connected
const SESSIONS: Map<string, { userId: string; expiresAt: number }> = new Map();

/**
 * Generate a simple session token
 */
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Sign up a new user
 */
export async function signup(input: SignupInput) {
  try {
    // Validate input
    const validatedData = signupSchema.parse(input);

    // Check if email or phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email.toLowerCase() },
          { phone: validatedData.phone }
        ]
      }
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email or phone number already registered"
      };
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        phone: validatedData.phone,
        fullName: validatedData.fullName,
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
        profile: {
          create: {
            whatsappNumber: validatedData.whatsappNumber,
            companyName: validatedData.companyName || null,
            deliveryArea: validatedData.deliveryArea || null,
            officeAddress: validatedData.officeAddress || null
          }
        }
      },
      include: { profile: true }
    });

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    // Store session (TODO: persist to database when ready)
    SESSIONS.set(sessionToken, { userId: user.id, expiresAt });

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    // Log signup
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_SIGNUP",
        entity: "User",
        entityId: user.id
      }
    });

    return {
      success: true,
      userId: user.id,
      message: "Account created successfully"
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again."
    };
  }
}

/**
 * Log in a user
 */
export async function login(input: LoginInput) {
  try {
    // Validate input
    const validatedData = loginSchema.parse(input);

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.emailOrPhone.toLowerCase() },
          { phone: validatedData.emailOrPhone }
        ]
      }
    });

    if (!user || !user.passwordHash) {
      // Generic error message to prevent email enumeration
      return {
        success: false,
        error: "Invalid email/phone or password"
      };
    }

    // Check if account is active
    if (user.status !== "ACTIVE") {
      return {
        success: false,
        error: "Your account is not active. Please contact support."
      };
    }

    // Verify password
    const passwordValid = await verifyPassword(validatedData.password, user.passwordHash);
    if (!passwordValid) {
      return {
        success: false,
        error: "Invalid email/phone or password"
      };
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = Date.now() + (validatedData.rememberMe ? 60 : 30) * 24 * 60 * 60 * 1000; // 60 or 30 days

    // Store session (TODO: persist to database when ready)
    SESSIONS.set(sessionToken, { userId: user.id, expiresAt });

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: (validatedData.rememberMe ? 60 : 30) * 24 * 60 * 60
    });

    // Log login
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_LOGIN",
        entity: "User",
        entityId: user.id
      }
    });

    return {
      success: true,
      userId: user.id,
      role: user.role,
      message: "Logged in successfully"
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Failed to log in. Please try again."
    };
  }
}

/**
 * Log out a user
 */
export async function logout() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (sessionToken) {
      SESSIONS.delete(sessionToken);
    }

    // Clear session cookie
    cookieStore.delete("session");

    return {
      success: true,
      message: "Logged out successfully"
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "Failed to log out"
    };
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return null;
    }

    // Check session validity
    const session = SESSIONS.get(sessionToken);
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}
