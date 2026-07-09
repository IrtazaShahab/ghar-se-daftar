"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser as getAuthenticatedUser } from "@/lib/auth/get-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signupSchema, loginSchema, type SignupInput, type LoginInput } from "@/lib/validations/auth";

function getAuthErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email/phone or password";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before logging in.";
  }

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Email already registered";
  }

  return message || "Authentication failed. Please try again.";
}

async function writeAuditLog(actorId: string, action: string, entityId = actorId) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity: "User",
        entityId
      }
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

/**
 * Sign up a new user in Supabase Auth and create the app profile in Prisma.
 */
export async function signup(input: SignupInput) {
  try {
    const validatedData = signupSchema.parse(input);
    const email = validatedData.email.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
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

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.fullName,
          phone: validatedData.phone
        }
      }
    });

    if (error || !data.user) {
      return {
        success: false,
        error: getAuthErrorMessage(error?.message)
      };
    }

    await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        phone: validatedData.phone,
        fullName: validatedData.fullName,
        role: "CUSTOMER",
        status: "ACTIVE",
        emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
        profile: {
          create: {
            whatsappNumber: validatedData.whatsappNumber,
            companyName: validatedData.companyName || null,
            deliveryArea: validatedData.deliveryArea || null,
            officeAddress: validatedData.officeAddress || null
          }
        }
      }
    });

    await writeAuditLog(data.user.id, "USER_SIGNUP");

    return {
      success: true,
      userId: data.user.id,
      requiresEmailConfirmation: !data.session,
      message: data.session ? "Account created successfully" : "Account created. Please confirm your email before logging in."
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
 * Log in using Supabase Auth. Phone login resolves to the stored email first.
 */
export async function login(input: LoginInput) {
  try {
    const validatedData = loginSchema.parse(input);
    const identifier = validatedData.emailOrPhone.trim();
    const email = identifier.includes("@")
      ? identifier.toLowerCase()
      : (await prisma.user.findUnique({ where: { phone: identifier }, select: { email: true } }))?.email;

    if (!email) {
      return {
        success: false,
        error: "Invalid email/phone or password"
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: validatedData.password
    });

    if (error || !data.user) {
      return {
        success: false,
        error: getAuthErrorMessage(error?.message)
      };
    }

    let user = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { id: true, role: true, status: true }
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, status: true }
      });
    }

    if (!user) {
      const fullName =
        typeof data.user.user_metadata.full_name === "string" && data.user.user_metadata.full_name.trim()
          ? data.user.user_metadata.full_name
          : email.split("@")[0];

      user = await prisma.user.create({
        data: {
          id: data.user.id,
          email,
          fullName,
          role: "CUSTOMER",
          status: "ACTIVE",
          profile: { create: {} }
        },
        select: { id: true, role: true, status: true }
      });
    }

    if (user.status !== "ACTIVE") {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Your account is not active. Please contact support."
      };
    }

    await writeAuditLog(user.id, "USER_LOGIN");

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
 * Log out the current Supabase Auth session.
 */
export async function logout() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: "Failed to log out"
      };
    }

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

export async function getCurrentUser() {
  return getAuthenticatedUser();
}
