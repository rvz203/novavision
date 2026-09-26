"use server";

import { hashPassword, requirePermission } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { AdminRole, normalizePermissions, ROLE_PRESETS } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export type UserInput = {
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
  permissions: string[];
  active: boolean;
};

function validateInput(input: UserInput, creating = false) {
  const name = input.name.trim().slice(0, 100);
  const email = input.email.trim().toLowerCase().slice(0, 180);
  const role = input.role in ROLE_PRESETS ? input.role : "viewer";
  const password = input.password?.trim() ?? "";
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("نام و ایمیل معتبر را وارد کنید.");
  if ((creating || password) && password.length < 8) throw new Error("رمز عبور باید حداقل ۸ نویسه باشد.");
  return { name, email, role, password, permissions: normalizePermissions(input.permissions), active: Boolean(input.active) };
}

export async function createAdminUser(input: UserInput) {
  const actor = await requirePermission("users.manage");
  const data = validateInput(input, true);
  if (data.role === "owner" && actor.role !== "owner") throw new Error("فقط مالک می‌تواند مالک دیگری ایجاد کند.");
  if (await prisma.adminUser.findUnique({ where: { email: data.email } })) throw new Error("قبلاً کاربری با این ایمیل ساخته شده است.");

  const user = await prisma.adminUser.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash: hashPassword(data.password),
      permissions: data.permissions,
      active: data.active,
    },
  });
  await recordActivity({
    actor,
    action: "users.create",
    entityType: "admin-user",
    entityId: user.id,
    scope: `users.${user.role}`,
    description: `حساب «${user.name}» را با نقش ${ROLE_PRESETS[data.role].label} ایجاد کرد.`,
    metadata: { permissions: data.permissions, email: data.email },
  });
  revalidatePath("/admin/dashboard/users");
  return { id: user.id };
}

export async function updateAdminUser(id: string, input: UserInput) {
  const actor = await requirePermission("users.manage");
  const current = await prisma.adminUser.findUnique({ where: { id } });
  if (!current) throw new Error("کاربر پیدا نشد.");
  if (current.role === "owner" && actor.role !== "owner") throw new Error("فقط مالک می‌تواند حساب مالک را تغییر دهد.");
  if (id === actor.id && !input.active) throw new Error("نمی‌توانید حساب خودتان را غیرفعال کنید.");

  const data = validateInput(input);
  const user = await prisma.adminUser.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      permissions: data.permissions,
      active: data.active,
      ...(data.password ? { passwordHash: hashPassword(data.password) } : {}),
    },
  });
  await recordActivity({
    actor,
    action: "users.update",
    entityType: "admin-user",
    entityId: user.id,
    scope: `users.${user.role}`,
    description: `دسترسی‌های حساب «${user.name}» را به‌روزرسانی کرد.`,
    metadata: { permissions: data.permissions, active: data.active, passwordChanged: Boolean(data.password) },
  });
  revalidatePath("/admin/dashboard/users");
}
