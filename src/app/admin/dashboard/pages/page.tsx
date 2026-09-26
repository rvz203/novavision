import { ArrowLeft, FilePenLine, Languages } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import Link from "next/link";

const languages = [
  { code: "fa", name: "فارسی", note: "نسخه اصلی راست‌چین", dir: "RTL" },
  { code: "en", name: "انگلیسی", note: "نسخه بین‌المللی", dir: "LTR" },
  { code: "ar", name: "عربی", note: "نسخه عربی راست‌چین", dir: "RTL" },
];

export default async function PagesDashboard() {
  await requirePermission("pages.write");
  return (
    <div className="dashboard-page pages-dashboard">
      <header className="admin-page-header">
        <div>
          <p className="page-context">محتوای ثابت وب‌سایت</p>
          <h1>مدیریت برگه‌ها</h1>
          <p>متن صفحه‌های خانه، درباره ما و تماس را ویرایش کنید و تغییرات را هم‌زمان در پیش‌نمایش سایت ببینید.</p>
        </div>
      </header>

      <section className="language-list">
        <div className="language-list-heading"><Languages size={20} /><span>زبان موردنظر را انتخاب کنید</span></div>
        {languages.map((language) => (
          <Link href={`/admin/dashboard/pages/edit/${language.code}`} className="language-row" key={language.code}>
            <span className={`language-avatar lang-${language.code}`}>{language.code.toUpperCase()}</span>
            <span className="language-info"><strong>{language.name}</strong><small>{language.note}</small></span>
            <span className="direction-label">{language.dir}</span>
            <span className="edit-language"><FilePenLine size={17} /> ویرایش محتوا <ArrowLeft size={16} /></span>
          </Link>
        ))}
      </section>
    </div>
  );
}
