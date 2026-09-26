import { getCurrentAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { canAccess } from "@/lib/permissions";
import { CheckCircle2, FileText, Globe2, PencilLine, Plus } from "lucide-react";
import Link from "next/link";
import DashboardPostsTable from "./DashboardPostsTable";

export default async function Dashboard() {
  const [posts, user] = await Promise.all([prisma.post.findMany({ orderBy: { updatedAt: "desc" } }), getCurrentAdmin()]);
  const groups = new Map<string, typeof posts>();
  for (const post of posts) {
    const groupId = post.translationGroupId || post.id;
    groups.set(groupId, [...(groups.get(groupId) || []), post]);
  }
  const groupedPosts = Array.from(groups, ([id, translations]) => {
    const primary = translations.find((post) => post.language === "fa") || translations[0];
    return {
      id,
      title: primary.title,
      published: translations.length === 3 && translations.every((post) => post.published),
      featured: primary.featured,
      coverImage: primary.coverImage,
      category: primary.category,
      updatedAt: new Date(Math.max(...translations.map((post) => post.updatedAt.getTime()))).toISOString(),
      translations: translations.map((post) => ({ language: post.language, title: post.title, slug: post.slug, published: post.published })),
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const published = groupedPosts.filter((post) => post.published).length;
  const complete = groupedPosts.filter((post) => post.translations.length === 3).length;
  const permissions = user?.permissions ?? [];
  const role = user?.role;
  const access = { write: canAccess(permissions, "blog.write", role), publish: canAccess(permissions, "blog.publish", role), delete: canAccess(permissions, "blog.delete", role) };

  return <div className="dashboard-page">
    <header className="admin-page-header"><div><p className="page-context">مرکز محتوای NovaVison</p><h1>مدیریت وبلاگ سه‌زبانه</h1><p>هر نوشته را یک‌بار بسازید و نسخه‌های فارسی، انگلیسی و عربی آن را در یک فضای هماهنگ مدیریت کنید.</p></div>{access.write ? <Link href="/admin/dashboard/new" className="admin-button compact"><Plus size={19} /> نوشته سه‌زبانه جدید</Link> : null}</header>
    <section className="stats-rail" aria-label="خلاصه نوشته‌ها">
      <div className="stat-item"><span className="stat-icon"><FileText size={21} /></span><div><span>کل نوشته‌ها</span><strong>{groupedPosts.length.toLocaleString("fa-IR")}</strong></div></div>
      <div className="stat-item"><span className="stat-icon success"><CheckCircle2 size={21} /></span><div><span>منتشرشده در سه زبان</span><strong>{published.toLocaleString("fa-IR")}</strong></div></div>
      <div className="stat-item"><span className="stat-icon warning"><PencilLine size={21} /></span><div><span>پیش‌نویس</span><strong>{(groupedPosts.length - published).toLocaleString("fa-IR")}</strong></div></div>
      <div className="stat-item"><span className="stat-icon info"><Globe2 size={21} /></span><div><span>سه ترجمه کامل</span><strong>{complete.toLocaleString("fa-IR")}</strong></div></div>
    </section>
    <DashboardPostsTable posts={groupedPosts} access={access} />
  </div>;
}
