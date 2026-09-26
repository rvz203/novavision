"use client";

import {
  Activity,
  ExternalLink,
  FileText,
  Files,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import { canAccess } from "@/lib/permissions";

type SidebarUser = { name: string; email: string; role: string; permissions: string[] };

export default function AdminSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/admin/dashboard", label: "نوشته‌ها", icon: FileText, show: true, exact: true },
    { href: "/admin/dashboard/emails", label: "ایمیل و پیام‌ها", icon: Mail, show: canAccess(user.permissions, "emails.manage", user.role) },
    { href: "/admin/dashboard/pages", label: "برگه‌ها", icon: Files, show: canAccess(user.permissions, "pages.write", user.role) },
    { href: "/admin/dashboard/visuals", label: "استودیوی تصویری", icon: Sparkles, show: canAccess(user.permissions, "pages.write", user.role) },
    { href: "/admin/dashboard/media", label: "رسانه‌ها", icon: ImageIcon, show: canAccess(user.permissions, "media.write", user.role) },
    { href: "/admin/dashboard/users", label: "کاربران و دسترسی‌ها", icon: Users, show: canAccess(user.permissions, "users.manage", user.role) },
    { href: "/admin/dashboard/activity", label: "تاریخچه فعالیت", icon: Activity, show: canAccess(user.permissions, "activity.read", user.role) },
  ];

  return (
    <>
      <button type="button" className="mobile-menu-button" onClick={() => setOpen(true)} aria-label="باز کردن منوی مدیریت"><Menu size={22} /></button>
      <div className={`sidebar-backdrop ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">N</span>
          <div><strong>NovaVison</strong><span>مدیریت محتوا</span></div>
          <button className="sidebar-close" type="button" onClick={() => setOpen(false)} aria-label="بستن منو"><X size={20} /></button>
        </div>

        <div className="sidebar-user-card">
          <span className="sidebar-user-avatar">{user.name.slice(0, 1)}</span>
          <div><strong>{user.name}</strong><small>{user.email}</small></div>
          <ShieldCheck size={17} />
        </div>

        <nav className="admin-nav" aria-label="منوی مدیریت">
          <div className="nav-caption">فضای کاری</div>
          <Link href="/admin/dashboard" className="admin-nav-link dashboard-link" onClick={() => setOpen(false)}>
            <LayoutDashboard size={20} /><span>پیشخوان</span>
          </Link>
          {links.filter((item) => item.show).map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return <Link href={item.href} key={item.href} className={`admin-nav-link ${active ? "active" : ""}`} onClick={() => setOpen(false)}><Icon size={20} /><span>{item.label}</span></Link>;
          })}
          <div className="nav-divider" />
          <a href="/fa" target="_blank" rel="noreferrer" className="admin-nav-link"><ExternalLink size={20} /><span>مشاهده سایت</span></a>
        </nav>
        <form action={logout} className="sidebar-logout"><button type="submit" className="admin-nav-link"><LogOut size={20} /><span>خروج</span></button></form>
      </aside>
    </>
  );
}
