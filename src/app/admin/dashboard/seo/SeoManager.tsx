"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { updateSeoSettings } from "@/app/actions/seo";
import { SITE_URL, SEO_LOCALES, SEO_PAGES, SeoLocale, SeoPage, SeoSettings, pagePath } from "@/lib/seo-config";
import ImageUploader from "../ImageUploader";
import styles from "./seo.module.css";

const languages = { en: "English", fa: "فارسی", ar: "العربية" };
const pageLabels = { home: "خانه", about: "درباره ما", contact: "تماس", blog: "وبلاگ" };

export default function SeoManager({ initialSettings }: { initialSettings: SeoSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(initialSettings);
  const [lang, setLang] = useState<SeoLocale>("fa");
  const [page, setPage] = useState<SeoPage>("home");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const item = settings.pages[lang][page];
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);

  function change(field: "title" | "description" | "socialImage", value: string) {
    setSettings((current) => ({ ...current, pages: { ...current.pages, [lang]: { ...current.pages[lang], [page]: { ...current.pages[lang][page], [field]: value } } } }));
    setNotice("");
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setNotice("");
    startTransition(async () => {
      try {
        const result = await updateSeoSettings(settings);setSettings(result);setSaved(result);
        setNotice("تنظیمات سئو ذخیره شد.");router.refresh();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "ذخیره انجام نشد."); }
    });
  }

  return <form onSubmit={save} className={styles.form}>
    <div className={styles.statuses}>
      <a href="/sitemap.xml" target="_blank" rel="noreferrer"><CheckCircle2 size={18} /> نقشه سایت XML</a>
      <a href="/robots.txt" target="_blank" rel="noreferrer"><CheckCircle2 size={18} /> راهنمای ربات‌ها</a>
      <a href={`/feed.xml?lang=${lang}`} target="_blank" rel="noreferrer"><CheckCircle2 size={18} /> خوراک RSS</a>
      <span><CheckCircle2 size={18} /> نشانی اصلی و زبان‌ها خودکار</span>
    </div>
    <fieldset disabled={pending} className={styles.panel}>
      <legend>سئوی صفحات اصلی</legend>
      <div className={styles.tabs} aria-label="زبان صفحه">{SEO_LOCALES.map((value) => <button key={value} type="button" disabled={uploading} aria-pressed={lang === value} className={lang === value ? styles.active : ""} onClick={() => setLang(value)}>{languages[value]}</button>)}</div>
      <div className={styles.tabs} aria-label="انتخاب صفحه">{SEO_PAGES.map((value) => <button key={value} type="button" disabled={uploading} aria-pressed={page === value} className={page === value ? styles.active : ""} onClick={() => setPage(value)}>{pageLabels[value]}</button>)}</div>
      <div className={styles.grid}>
        <div className={styles.fields}>
          <label>عنوان نتیجه جست‌وجو<input className="admin-input" dir={lang === "en" ? "ltr" : "rtl"} value={item.title} maxLength={100} onChange={(event) => change("title", event.target.value)} /><small>{item.title.length} نویسه؛ معمولاً ۳۰ تا ۶۰ نویسه خواناتر است.</small></label>
          <label>توضیحات نتیجه جست‌وجو<textarea className="admin-input" dir={lang === "en" ? "ltr" : "rtl"} rows={4} value={item.description} maxLength={300} onChange={(event) => change("description", event.target.value)} /><small>{item.description.length} نویسه؛ معمولاً ۱۲۰ تا ۱۶۰ نویسه مناسب است.</small></label>
          <label>نشانی اصلی (Canonical)<input className="admin-input" dir="ltr" value={`${SITE_URL}${pagePath(lang, page)}`} readOnly /></label>
        </div>
        <div className={styles.previews}>
          <h2>پیش‌نمایش جست‌وجو</h2>
          <div className={styles.snippet} dir={lang === "en" ? "ltr" : "rtl"}><small dir="ltr">{SITE_URL}{pagePath(lang, page)}</small><h3>{item.title}</h3><p>{item.description}</p></div>
          <p className={styles.hint}>این پیش‌نمایش تقریبی است؛ موتور جست‌وجو می‌تواند عنوان یا توضیحات دیگری نمایش دهد.</p>
          <ImageUploader key={`${lang}-${page}`} value={item.socialImage} onChange={(value) => change("socialImage", value)} label="تصویر اشتراک‌گذاری" compact onUploadingChange={setUploading} disabled={pending} />
          <p className={styles.hint}>اندازه پیشنهادی ۱۲۰۰ × ۶۳۰ پیکسل است. بدون تصویر اختصاصی، تصویر پیش‌فرض NovaVison نمایش داده می‌شود.</p>
        </div>
      </div>
    </fieldset>
    <fieldset disabled={pending} className={styles.panel}>
      <legend>تأیید مالکیت و پروفایل‌های رسمی</legend>
      <div className={styles.grid}>
        <label>کد تأیید Google Search Console<input className="admin-input" dir="ltr" value={settings.googleVerification} onChange={(event) => setSettings((current) => ({ ...current, googleVerification: event.target.value }))} placeholder="google-site-verification content" /><small>فقط مقدار content را از تگ تأیید HTML وارد کنید.</small></label>
        <label>کد تأیید Bing Webmaster Tools<input className="admin-input" dir="ltr" value={settings.bingVerification} onChange={(event) => setSettings((current) => ({ ...current, bingVerification: event.target.value }))} placeholder="msvalidate.01 content" /><small>ذخیره کد، آن را در صفحات عمومی قرار می‌دهد؛ تأیید نهایی در حساب شما انجام می‌شود.</small></label>
      </div>
      <label>پروفایل‌های رسمی کسب‌وکار<textarea className="admin-input" dir="ltr" rows={3} value={settings.sameAs.join("\n")} onChange={(event) => setSettings((current) => ({ ...current, sameAs: event.target.value.split("\n") }))} placeholder="https://www.linkedin.com/company/..." /><small>هر نشانی در یک خط؛ فقط پروفایل‌های واقعی و رسمی NovaVison را وارد کنید.</small></label>
    </fieldset>
    {notice && <p className="visual-notice" role="status">{notice}</p>}{error && <p className="admin-error" role="alert">{error}</p>}
    <div className={styles.actions}><span>{dirty ? "تغییرات ذخیره‌نشده دارید." : ""}</span><button className="admin-button compact" type="submit" disabled={pending || uploading || !dirty}>{pending ? <LoaderCircle size={18} className="spin" /> : <Save size={18} />} ذخیره تنظیمات سئو</button></div>
  </form>;
}
