import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { DEFAULT_SEO, SEO_LOCALES, SEO_PAGES, SEO_SETTINGS_KEY, SeoLocale, SeoPage, SeoSettings, absoluteUrl, pageAlternates } from "./seo-config";

export const getSeoSettings = cache(async (): Promise<SeoSettings> => {
  await connection();
  const settings = structuredClone(DEFAULT_SEO);
  try {
    const record = await prisma.dictionary.findUnique({ where: { language: SEO_SETTINGS_KEY } });
    const content = record?.content;
    if (!content || typeof content !== "object" || Array.isArray(content)) return settings;
    const source = content as unknown as Partial<SeoSettings>;
    for (const lang of SEO_LOCALES) {
      for (const page of SEO_PAGES) {
        const item = source.pages?.[lang]?.[page];
        if (!item) continue;
        for (const field of ["title", "description", "socialImage"] as const) {
          if (typeof item[field] === "string" && item[field].trim()) settings.pages[lang][page][field] = item[field];
        }
      }
    }
    settings.googleVerification = typeof source.googleVerification === "string" ? source.googleVerification : "";
    settings.bingVerification = typeof source.bingVerification === "string" ? source.bingVerification : "";
    settings.sameAs = Array.isArray(source.sameAs) ? source.sameAs.filter((url): url is string => typeof url === "string" && url.startsWith("https://")) : [];
  } catch (error) {
    console.error("Failed to load SEO settings:", error);
  }
  return settings;
});

const ogLocales: Record<SeoLocale, string> = { en: "en_US", fa: "fa_IR", ar: "ar_SA" };

export function socialMetadata(lang: SeoLocale, title: string, description: string, url: string, image: string): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website", title, description, url, siteName: "NovaVison", locale: ogLocales[lang],
      alternateLocale: SEO_LOCALES.filter((locale) => locale !== lang).map((locale) => ogLocales[locale]),
      images: [{ url: absoluteUrl(image), alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: absoluteUrl(image), alt: title }] },
  };
}

export async function getPageMetadata(lang: SeoLocale, page: SeoPage): Promise<Metadata> {
  const settings = await getSeoSettings();
  const { title, description, socialImage } = settings.pages[lang][page];
  const alternates = pageAlternates(lang, page);
  return {
    title: { absolute: title }, description, alternates,
    ...socialMetadata(lang, title, description, alternates.canonical, socialImage || `/api/og?page=${page}`),
  };
}
