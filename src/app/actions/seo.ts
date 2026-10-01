"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { DEFAULT_SEO, SEO_LOCALES, SEO_PAGES, SEO_SETTINGS_KEY, SeoSettings } from "@/lib/seo-config";

export async function updateSeoSettings(input: SeoSettings): Promise<SeoSettings> {
  const actor = await requirePermission("pages.write");
  const settings = structuredClone(DEFAULT_SEO);
  for (const lang of SEO_LOCALES) {
    for (const page of SEO_PAGES) {
      const item = input.pages?.[lang]?.[page];
      const title = String(item?.title ?? "").trim();
      const description = String(item?.description ?? "").trim();
      const socialImage = String(item?.socialImage ?? "").trim();
      if (title.length > 100 || description.length > 300) throw new Error("عنوان باید حداکثر ۱۰۰ و توضیحات حداکثر ۳۰۰ نویسه باشد.");
      if (socialImage && (!/^\/(?!\/)[a-zA-Z0-9/_\-.]+\.(png|jpe?g|webp|gif)$/i.test(socialImage) || socialImage.includes(".."))) throw new Error("تصویر اشتراک‌گذاری باید یک مسیر داخلی تصویر در سایت باشد.");
      settings.pages[lang][page] = { title: title || DEFAULT_SEO.pages[lang][page].title, description: description || DEFAULT_SEO.pages[lang][page].description, socialImage };
    }
  }
  for (const field of ["googleVerification", "bingVerification"] as const) {
    const value = String(input[field] ?? "").trim();
    if (value && !/^[a-zA-Z0-9_-]{1,256}$/.test(value)) throw new Error("فقط کد تأیید را وارد کنید، نه تگ HTML کامل.");
    settings[field] = value;
  }
  if (!Array.isArray(input.sameAs) || input.sameAs.length > 20) throw new Error("حداکثر ۲۰ نشانی رسمی شبکه‌های اجتماعی وارد کنید.");
  settings.sameAs = Array.from(new Set(input.sameAs.map((value) => String(value).trim()).filter(Boolean).map((value) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.username || url.password) throw new Error();
      return url.href;
    } catch { throw new Error("نشانی پروفایل‌های رسمی باید با https:// شروع شود."); }
  })));
  const content = JSON.parse(JSON.stringify(settings));
  await prisma.$transaction([
    prisma.dictionary.upsert({ where: { language: SEO_SETTINGS_KEY }, create: { language: SEO_SETTINGS_KEY, content }, update: { content } }),
    prisma.activityLog.create({ data: { userId: actor.id, actorName: actor.name, actorEmail: actor.email, action: "seo.update", entityType: "seo", entityId: SEO_SETTINGS_KEY, scope: "site.seo", description: "عنوان‌ها، توضیحات و تنظیمات سئوی سایت را ویرایش کرد.", metadata: { googleVerification: Boolean(settings.googleVerification), bingVerification: Boolean(settings.bingVerification) } } }),
  ]);
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  return settings;
}
