import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { SEO_LOCALES, SEO_PAGES, SeoLocale, absoluteUrl, pageAlternates, pagePath, postPath, publicImageUrl } from "@/lib/seo-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [posts, dictionaries, activity] = await Promise.all([
    prisma.post.findMany({ where: { published: true, language: { in: [...SEO_LOCALES] } }, select: { language: true, slug: true, translationGroupId: true, updatedAt: true, coverImage: true }, orderBy: { id: "asc" } }),
    prisma.dictionary.findMany({ where: { language: { in: [...SEO_LOCALES, "_site_seo", "_site_branding"] } }, select: { language: true, updatedAt: true } }),
    prisma.activityLog.findFirst({ where: { action: { in: ["blog.publish", "blog.unpublish", "blog.delete", "blog.update"] } }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  const entries: MetadataRoute.Sitemap = [];
  for (const lang of SEO_LOCALES) {
    for (const page of SEO_PAGES) {
      const dates = dictionaries.filter((item) => item.language === lang || item.language.startsWith("_site_")).map((item) => item.updatedAt);
      if (page === "blog") {
        dates.push(...posts.filter((post) => post.language === lang).map((post) => post.updatedAt));
        if (activity) dates.push(activity.createdAt);
      }
      entries.push({
        url: absoluteUrl(pagePath(lang, page)),
        ...(dates.length ? { lastModified: new Date(Math.max(...dates.map((date) => date.getTime()))) } : {}),
        alternates: { languages: pageAlternates(lang, page).languages },
      });
    }
  }
  const groups = new Map<string, typeof posts>();
  for (const post of posts) {
    if (!post.translationGroupId) continue;
    const group = groups.get(post.translationGroupId) || [];
    group.push(post);
    groups.set(post.translationGroupId, group);
  }
  for (const post of posts) {
    const siblings = (post.translationGroupId && groups.get(post.translationGroupId)) || [post];
    const languages = Object.fromEntries(siblings.map((item) => [item.language, absoluteUrl(postPath(item.language, item.slug))]));
    const fallback = languages.en || languages.fa || languages.ar;
    const image = publicImageUrl(post.coverImage);
    entries.push({ url: absoluteUrl(postPath(post.language as SeoLocale, post.slug)), lastModified: post.updatedAt,
      alternates: { languages: { ...languages, "x-default": fallback } }, ...(image ? { images: [image] } : {}),
    });
  }
  return entries;
}
