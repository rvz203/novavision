import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { canAccess, Permission } from "@/lib/permissions";

export const ADMIN_COOKIE = "novan_admin_session";
export const OWNER_EMAIL = "admin@novan.local";

function sessionSecret() {
  return process.env.ADMIN_PASSWORD ?? "Password123";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function signature(userId: string) {
  return createHmac("sha256", sessionSecret()).update(userId).digest("hex");
}

export function createSessionToken(userId: string) {
  return `${userId}.${signature(userId)}`;
}

function parseSessionToken(value?: string) {
  if (!value) return null;
  const [userId, supplied] = value.split(".");
  if (!userId || !supplied) return null;
  const expected = signature(userId);
  if (supplied.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)) ? userId : null;
}

export async function ensureOwnerUser() {
  const existing = await prisma.adminUser.findUnique({ where: { email: OWNER_EMAIL } });
  if (existing) return existing;

  return prisma.adminUser.create({
    data: {
      name: "مدیر اصلی Novan",
      email: OWNER_EMAIL,
      passwordHash: hashPassword(sessionSecret()),
      role: "owner",
      permissions: [],
    },
  });
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const userId = parseSessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!userId) return null;
  return prisma.adminUser.findFirst({ where: { id: userId, active: true } });
}

export async function isAdminAuthenticated() {
  return Boolean(await getCurrentAdmin());
}

export async function requireAdmin() {
  const user = await getCurrentAdmin();
  if (!user) throw new Error("برای ادامه دوباره وارد پنل مدیریت شوید.");
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireAdmin();
  if (!canAccess(user.permissions, permission, user.role)) {
    throw new Error("شما اجازه انجام این عملیات را ندارید.");
  }
  return user;
}
