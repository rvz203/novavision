"use client";

import { Activity, FilePenLine, Filter, LogIn, Search, ShieldCheck, Upload, UserCog } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

type ActivityRow = { id: string; actorName: string; actorEmail: string; action: string; entityType: string; entityId: string | null; scope: string | null; description: string; metadata: null; createdAt: string; userId: string | null };

const actionLabels: Record<string, string> = {
  "auth.login": "ورود", "auth.logout": "خروج", "blog.create": "ایجاد نوشته", "blog.update": "ویرایش نوشته", "blog.publish": "انتشار", "blog.unpublish": "لغو انتشار", "blog.delete": "حذف نوشته", "blog.duplicate": "کپی نوشته", "pages.update": "ویرایش صفحات", "media.upload": "بارگذاری رسانه", "users.create": "ساخت کاربر", "users.update": "تغییر دسترسی",
};

function iconFor(action: string) {
  if (action.startsWith("users.")) return <UserCog size={17} />;
  if (action.startsWith("auth.")) return <LogIn size={17} />;
  if (action.startsWith("media.")) return <Upload size={17} />;
  if (action.startsWith("blog.") || action.startsWith("pages.")) return <FilePenLine size={17} />;
  return <Activity size={17} />;
}

export default function ActivityTable({ activities }: { activities: ActivityRow[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const deferredQuery = useDeferredValue(query).trim().toLocaleLowerCase("fa");
  const filtered = useMemo(() => activities.filter((item) => (!deferredQuery || `${item.actorName} ${item.actorEmail} ${item.description} ${item.scope}`.toLocaleLowerCase("fa").includes(deferredQuery)) && (type === "all" || item.action.startsWith(`${type}.`))), [activities, deferredQuery, type]);
  const today = activities.filter((item) => new Date(item.createdAt).toDateString() === new Date().toDateString()).length;
  const actors = new Set(activities.map((item) => item.actorEmail)).size;

  return <div className="activity-page">
    <header className="admin-page-header"><div><p className="page-context">شفافیت و کنترل</p><h1>تاریخچه فعالیت‌ها</h1><p>ببینید چه کسی، چه کاری را، در کدام بخش محتوا و چه زمانی انجام داده است.</p></div></header>
    <section className="activity-stats"><div><Activity size={20} /><span>کل رویدادها<strong>{activities.length.toLocaleString("fa-IR")}</strong></span></div><div><FilePenLine size={20} /><span>فعالیت امروز<strong>{today.toLocaleString("fa-IR")}</strong></span></div><div><ShieldCheck size={20} /><span>کاربران فعال در گزارش<strong>{actors.toLocaleString("fa-IR")}</strong></span></div></section>
    <section className="activity-card">
      <div className="posts-toolbar"><label className="search-field"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجو در کاربر، توضیح یا محدوده…" /></label><div className="filter-group"><span className="filter-label"><Filter size={16} /> نوع فعالیت</span><select value={type} onChange={(e) => setType(e.target.value)}><option value="all">همه فعالیت‌ها</option><option value="blog">وبلاگ</option><option value="pages">صفحات</option><option value="media">رسانه</option><option value="users">کاربران</option><option value="auth">ورود و خروج</option></select></div></div>
      <div className="activity-timeline">{filtered.map((item) => <article className="activity-item" key={item.id}><span className={`activity-icon action-${item.action.split(".")[0]}`}>{iconFor(item.action)}</span><div className="activity-copy"><div><strong>{item.actorName}</strong><span>{actionLabels[item.action] ?? item.action}</span>{item.scope ? <code>{item.scope}</code> : null}</div><p>{item.description}</p><small>{item.actorEmail}</small></div><time dateTime={item.createdAt}>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time></article>)}</div>
      {!filtered.length ? <div className="empty-state"><h3>فعالیتی با این فیلتر پیدا نشد</h3><p>عبارت یا نوع فعالیت را تغییر دهید.</p></div> : null}
    </section>
  </div>;
}
