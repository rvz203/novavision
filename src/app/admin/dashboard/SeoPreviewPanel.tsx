"use client";

import { EDITOR_LANGUAGES, EditorTranslation, LANGUAGE_META } from "./editor-data";
import { SITE_URL, postPath, plainText, summarize } from "@/lib/seo-config";
import styles from "./seo/seo.module.css";

export default function SeoPreviewPanel({ translations, coverImage }: { translations: Record<(typeof EDITOR_LANGUAGES)[number], EditorTranslation>; coverImage: string }) {
  return <section className="translation-section">
    <div className="translation-section-heading"><div><strong>پیش‌نمایش و بررسی سئو</strong><span>راهنمای ویرایش؛ این بررسی امتیاز رتبه‌بندی موتور جست‌وجو نیست.</span></div></div>
    <div className="translation-box-grid">{EDITOR_LANGUAGES.map((lang) => {
      const post = translations[lang];
      const title = post.seoTitle || (post.title ? `${post.title} | NovaVison` : "NovaVison");
      const description = post.seoDescription || summarize(post.excerpt || post.content);
      const words = plainText(post.content).split(/\s+/u).filter(Boolean).length;
      const images = post.content.match(/<img\b[^>]*>/gi) || [];
      const missingAlt = images.filter((tag) => !/\balt\s*=\s*(["'])\s*\S[\s\S]*?\1/i.test(tag)).length;
      return <div key={lang} className="translation-box" dir={LANGUAGE_META[lang].dir}>
        <strong>{LANGUAGE_META[lang].label}</strong>
        <div className={styles.snippet}><small dir="ltr">{SITE_URL}{postPath(lang, post.slug || "article-slug")}</small><h3>{title}</h3><p>{description || "توضیحات مقاله را تکمیل کنید."}</p></div>
        <p className={styles.hint}>{title.length} نویسه عنوان · {description.length} نویسه توضیحات · {words} واژه</p>
        <ul className={styles.hint}>
          <li>{title.length >= 30 && title.length <= 60 ? "عنوان در محدوده پیشنهادی است." : "طول و خوانایی عنوان را بررسی کنید؛ ۳۰ تا ۶۰ نویسه معمولاً مناسب است."}</li>
          <li>{description.length >= 120 && description.length <= 160 ? "توضیحات در محدوده پیشنهادی است." : "یک توضیح روشن و اختصاصی بنویسید؛ ۱۲۰ تا ۱۶۰ نویسه معمولاً مناسب است."}</li>
          <li>{/<h[23]\b|^#{2,3}\s/m.test(post.content) ? "محتوا دارای زیرعنوان است." : "برای خوانایی مقاله از زیرعنوان‌های مرتبط استفاده کنید."}</li>
          <li>{missingAlt ? `${missingAlt} تصویر بدون توضیح alt است؛ تصاویر محتوایی را توضیح دهید.` : "تصاویر HTML بدون توضیح alt شناسایی نشد."}</li>
          <li>{coverImage ? "تصویر شاخص برای اشتراک‌گذاری تنظیم شده است." : "برای پیش‌نمایش مقاله، تصویر شاخص اضافه کنید."}</li>
        </ul>
      </div>;
    })}</div>
  </section>;
}
