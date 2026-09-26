import { requirePermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import UsersManager from "./UsersManager";

export default async function UsersPage() {
  const actor = await requirePermission("users.manage");
  const users = await prisma.adminUser.findMany({ orderBy: [{ active: "desc" }, { createdAt: "asc" }] });

  return (
    <UsersManager
      currentUserId={actor.id}
      currentUserRole={actor.role}
      users={users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        active: user.active,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      }))}
    />
  );
}
