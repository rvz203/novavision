"use client";

import { useState, useTransition } from "react";
import { Globe2, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import ImageUploader from "../ImageUploader";
import { updateSiteBranding } from "@/app/actions/branding";
import type { SiteBranding } from "@/lib/branding-types";
import styles from "./branding.module.css";

export default function BrandingManager({ initialBranding }: { initialBranding: SiteBranding }) {
  const [branding, setBranding] = useState(initialBranding);
  const [saved, setSaved] = useState(initialBranding);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const dirty = branding.logoUrl !== saved.logoUrl || branding.faviconUrl !== saved.faviconUrl;

  function change(key: keyof SiteBranding, value: string) {
    setBranding((current) => ({ ...current, [key]: value }));
    setNotice("");
    setError("");
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        const result = await updateSiteBranding(branding);
        setBranding(result);
        setSaved(result);
        setNotice("لوگو و آیکن مرورگر ذخیره شد و در سایت نمایش داده می‌شود.");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "ذخیره تغییرات انجام نشد.");
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={save}>
      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="branding-logo-title">
          <h2 id="branding-logo-title">لوگوی سایت</h2>
          <p>در سربرگ، پایین صفحه و پنل مدیریت نمایش داده می‌شود. برای بهترین نتیجه از PNG شفاف استفاده کنید.</p>
          <ImageUploader value={branding.logoUrl} onChange={(value) => change("logoUrl", value)} label="تصویر لوگو"
            uploadUrl="/api/admin/branding/upload?kind=logo" hideUrl disabled={isPending}
            hint="PNG، JPG، WebP یا GIF تا ۸ مگابایت" onUploadingChange={setLogoUploading} />
          <div className={styles.logoPreview} aria-label="پیش‌نمایش لوگو در زمینه روشن و تیره">
            {[styles.light, styles.dark].map((theme) => <div key={theme} className={theme}>
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt="پیش‌نمایش لوگوی NovaVison" />
              ) : <strong>NovaVison</strong>}
            </div>)}
          </div>
        </section>
        <section className={`${styles.card} ${styles.favicon}`} aria-labelledby="branding-favicon-title">
          <h2 id="branding-favicon-title">آیکن تب مرورگر (Favicon)</h2>
          <p>فایل PNG مربع از ۱۶ تا ۵۱۲ پیکسل یا ICO بارگذاری کنید؛ اندازه پیشنهادی ۳۲ یا ۴۸ پیکسل است.</p>
          <ImageUploader value={branding.faviconUrl} onChange={(value) => change("faviconUrl", value)} label="آیکن مرورگر"
            uploadUrl="/api/admin/branding/upload?kind=favicon" accept="image/png,image/x-icon,image/vnd.microsoft.icon,.ico"
            hint="PNG مربع یا ICO تا ۱ مگابایت" hideUrl disabled={isPending} onUploadingChange={setFaviconUploading} />
          <div className={styles.browserPreview} dir="ltr" aria-label="پیش‌نمایش تب مرورگر">
            {branding.faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.faviconUrl} width="20" height="20" alt="آیکن مرورگر" />
            ) : <Globe2 size={20} aria-hidden="true" />}
            <span>NovaVison</span><span aria-hidden="true">×</span>
          </div>
        </section>
      </div>
      <p className={styles.help}>حذف تصویر و سپس ذخیره، نشان پیش‌فرض را برمی‌گرداند. بارگذاری تصویر تا پیش از ذخیره، ظاهر سایت را تغییر نمی‌دهد.</p>
      {notice && <p className="visual-notice" role="status">{notice}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className={styles.actions}>
        <span role="status">{dirty ? "تغییرات ذخیره‌نشده دارید." : ""}</span>
        <button type="submit" className="admin-button compact" disabled={isPending || logoUploading || faviconUploading || !dirty}>
          {isPending ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
          {isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}
