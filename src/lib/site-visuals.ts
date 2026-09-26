import "server-only";

import { Locale } from "@/dictionaries";
import { prisma } from "@/lib/db";
import { PublicVisual, VISUAL_MOTIONS, VisualMotion, VisualSection } from "@/lib/site-visual-types";

export type { PublicVisual, VisualMotion, VisualSection } from "@/lib/site-visual-types";
export { VISUAL_MOTIONS, VISUAL_SECTIONS } from "@/lib/site-visual-types";

const DEFAULT_VISUALS: Partial<
  Record<
    VisualSection,
    Array<{
      imageUrl: string;
      altEn: string;
      altFa: string;
      altAr: string;
      captionEn: string;
      captionFa: string;
      captionAr: string;
      motion: VisualMotion;
    }>
  >
> = {
  "about.feature": [
    {
      imageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop",
      altEn: "Global logistics hub and modern container terminal",
      altFa: "پایانه پیشرفته کانتینری و مدیریت زنجیره تامین جهانی",
      altAr: "مركز لوجستي عالمي ومحطة حاويات متطورة",
      captionEn: "NovaVison international trade infrastructure",
      captionFa: "زیرساخت‌های تجارت و ترانزیت بین‌المللی NovaVison",
      captionAr: "البنية التحتية للتجارة الدولية",
      motion: "reveal",
    },
  ],
  "insights.hero": [
    {
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
      altEn: "Modern cargo vessel and maritime logistics",
      altFa: "کشتی باری پیشرفته و تحلیل روندهای حمل‌ونقل دریایی",
      altAr: "سفينة شحن حديثة وتحليلات النقل البحري",
      captionEn: "Maritime trade routes & supply-chain analytics",
      captionFa: "مسیرهای کشتیرانی تجاری و پایش بازارهای هدف",
      captionAr: "طرق التجارة البحرية وتحليلات سلاسل الإمداد",
      motion: "drift",
    },
  ],
};

export async function getSiteVisuals(section: VisualSection, lang: Locale): Promise<PublicVisual[]> {
  try {
    const visuals = await prisma.siteVisual.findMany({
      where: { section, active: true, imageUrl: { not: "" } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (visuals && visuals.length > 0) {
      return visuals.map((visual) => ({
        id: visual.id,
        imageUrl: visual.imageUrl,
        alt: lang === "fa" ? visual.altFa || visual.altEn : lang === "ar" ? visual.altAr || visual.altEn : visual.altEn,
        caption: lang === "fa" ? visual.captionFa || visual.captionEn : lang === "ar" ? visual.captionAr || visual.captionEn : visual.captionEn,
        motion: VISUAL_MOTIONS.includes(visual.motion as VisualMotion) ? (visual.motion as VisualMotion) : "reveal",
      }));
    }
  } catch (err) {
    console.error(`Failed to fetch visuals for section ${section}:`, err);
  }

  // Fallback defaults
  const defaults = DEFAULT_VISUALS[section] || [];
  return defaults.map((d, idx) => ({
    id: `default-${section}-${idx}`,
    imageUrl: d.imageUrl,
    alt: lang === "fa" ? d.altFa : lang === "ar" ? d.altAr : d.altEn,
    caption: lang === "fa" ? d.captionFa : lang === "ar" ? d.captionAr : d.captionEn,
    motion: d.motion,
  }));
}
