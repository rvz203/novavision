import { getCurrentAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin");

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={{ name: user.name, email: user.email, role: user.role, permissions: user.permissions }} />
      <main className="admin-content">{children}</main>
    </div>
  );
}
