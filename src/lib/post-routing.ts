import "server-only";

import { createHash } from "node:crypto";
import { cache } from "react";
import { prisma } from "./db";
import { SeoLocale } from "./seo-config";

export function postRedirectKey(lang: string, slug: string) {
  return `_post_redirect:${lang}:${createHash("sha256").update(slug).digest("hex")}`;
}

export const findPublishedPost = cache(async (slug: string, lang: SeoLocale) => {
  let post = await prisma.post.findFirst({ where: { slug, language: lang, published: true } });
  if (!post) {
    const source = await prisma.post.findUnique({ where: { slug } });
    if (source?.published && source.translationGroupId) {
      post = await prisma.post.findFirst({ where: { translationGroupId: source.translationGroupId, language: lang, published: true } });
    }
  }
  if (!post) {
    const alias = await prisma.dictionary.findUnique({ where: { language: postRedirectKey(lang, slug) } });
    const content = alias?.content;
    if (content && typeof content === "object" && !Array.isArray(content) && typeof content.postId === "string") {
      post = await prisma.post.findFirst({ where: { id: content.postId, language: lang, published: true } });
    }
  }
  if (!post) return null;
  const translations = post.translationGroupId
    ? await prisma.post.findMany({ where: { translationGroupId: post.translationGroupId, published: true, language: { in: ["en", "fa", "ar"] } }, select: { language: true, slug: true } })
    : [{ language: post.language, slug: post.slug }];
  return { post, translations };
});
