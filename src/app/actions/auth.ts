"use server";

import {
  ADMIN_COOKIE,
  createSessionToken,
  ensureOwnerUser,
  getCurrentAdmin,
  OWNER_EMAIL,
  verifyPassword,
} from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("adminEmail") ?? formData.get("email") ?? OWNER_EMAIL).trim().toLowerCase() || OWNER_EMAIL;
  const password = String(formData.get("adminPassword") ?? formData.get("password") ?? "");

  await ensureOwnerUser();
  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (user?.active && verifyPassword(password, user.passwordHash)) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await recordActivity({
      actor: user,
      action: "auth.login",
      entityType: "session",
      scope: "admin",
      description: "وارد پنل مدیریت شد.",
    });
    redirect("/admin/dashboard");
  }

  throw new Error("ایمیل یا رمز عبور صحیح نیست، یا حساب غیرفعال شده است.");
}

export async function logout() {
  const user = await getCurrentAdmin();
  if (user) {
    await recordActivity({
      actor: user,
      action: "auth.logout",
      entityType: "session",
      scope: "admin",
      description: "از پنل مدیریت خارج شد.",
    });
  }
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin");
}
