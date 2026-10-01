import { requirePermission } from "@/lib/admin-auth";
import { getSeoSettings } from "@/lib/seo";
import SeoManager from "./SeoManager";

export default async function SeoPage() {
  await requirePermission("pages.write");
  return <div className="dashboard-page">
    <header className="admin-page-header"><div><p className="page-context">جست‌وجو و اشتراک‌گذاری</p><h1>تنظیمات سئو</h1><p>عنوان و توضیحات صفحات را برای هر زبان تنظیم کنید و پیش‌نمایش نتیجه جست‌وجو را ببینید.</p></div></header>
    <SeoManager initialSettings={await getSeoSettings()} />
  </div>;
}
