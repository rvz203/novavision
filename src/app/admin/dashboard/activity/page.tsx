import { requirePermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import ActivityTable from "./ActivityTable";

export default async function ActivityPage() {
  await requirePermission("activity.read");
  const activities = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return <ActivityTable activities={activities.map((item) => ({ ...item, metadata: null, createdAt: item.createdAt.toISOString() }))} />;
}
