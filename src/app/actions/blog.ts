"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  BLOG_LANGUAGES,
  BlogLanguage,
  MultilingualPostPayload,
  translationIsBlank,
  validatePostPayload,
} from "@/lib/blog";
import { requirePermission } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { postRedirectKey } from "@/lib/post-routing";

function revalidateBlog(language: string, slug?: string) {
  revalidatePath(`/${language}/blog`);
  if (slug) revalidatePath(`/${language}/blog/${slug}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
}

function validatedTranslations(payload: MultilingualPostPayload) {
  const filled = BLOG_LANGUAGES.filter((language) => !translationIsBlank(payload.translations[language]));
  if (!filled.length) throw new Error("حداقل یکی از ترجمه‌ها را کامل کنید.");
  if (payload.published && filled.length !== BLOG_LANGUAGES.length) {
    throw new Error("برای انتشار، عنوان، پیوند و محتوای هر سه زبان را کامل کنید.");
  }

  return filled.map((language) => ({
    language,
    data: validatePostPayload({
      ...payload.translations[language],
      template: payload.template,
      coverImage: payload.coverImage,
      featured: payload.featured,
      published: payload.published,
      language,
    }),
  }));
}

export async function createPost(payload: MultilingualPostPayload) {
  const actor = await requirePermission("blog.write");
  if (payload.published) await requirePermission("blog.publish");
  const translations = validatedTranslations(payload);
  const groupId = randomUUID();

  await prisma.$transaction(
    translations.map(({ data }) => prisma.post.create({ data: { ...data, translationGroupId: groupId } })),
  );

  translations.forEach(({ data }) => revalidateBlog(data.language, data.slug));
  await recordActivity({
    actor,
    action: payload.published ? "blog.publish" : "blog.create",
    entityType: "post-group",
    entityId: groupId,
    scope: `blog.${translations.map(({ language }) => language).join(",")}`,
    description: `نوشته چندزبانه «${translations[0].data.title}» را ${payload.published ? "منتشر" : "ایجاد"} کرد.`,
    metadata: { languages: translations.map(({ language }) => language) },
  });

  return { id: groupId };
}

async function findGroup(id: string) {
  const anchor = await prisma.post.findFirst({
    where: { OR: [{ id }, { translationGroupId: id }] },
  });
  if (!anchor) throw new Error("نوشته پیدا نشد.");
  const groupId = anchor.translationGroupId || anchor.id;
  if (!anchor.translationGroupId) {
    await prisma.post.update({ where: { id: anchor.id }, data: { translationGroupId: groupId } });
  }
  const posts = await prisma.post.findMany({ where: { translationGroupId: groupId } });
  return { groupId, posts };
}

export async function updatePost(id: string, payload: MultilingualPostPayload) {
  const actor = await requirePermission("blog.write");
  if (payload.published) await requirePermission("blog.publish");
  if (!id) throw new Error("شناسه نوشته نامعتبر است.");

  const { groupId, posts } = await findGroup(id);
  const translations = validatedTranslations(payload);
  const incoming = new Set<BlogLanguage>(translations.map(({ language }) => language));

  await prisma.$transaction(async (tx) => {
    for (const { language, data } of translations) {
      const existing = posts.find((post) => post.language === language);
      if (existing) {
        if (existing.slug !== data.slug) {
          const language = postRedirectKey(existing.language, existing.slug);
          await tx.dictionary.upsert({ where: { language }, create: { language, content: { postId: existing.id } }, update: { content: { postId: existing.id } } });
        }
        await tx.post.update({ where: { id: existing.id }, data: { ...data, translationGroupId: groupId } });
      }
      else await tx.post.create({ data: { ...data, translationGroupId: groupId } });
    }
    if (!payload.published) {
      const removed = posts.filter((post) => !incoming.has(post.language as BlogLanguage));
      if (removed.length) await tx.post.deleteMany({ where: { id: { in: removed.map((post) => post.id) } } });
    }
  });

  posts.forEach((post) => revalidateBlog(post.language, post.slug));
  translations.forEach(({ data }) => revalidateBlog(data.language, data.slug));
  await recordActivity({
    actor,
    action: payload.published ? "blog.publish" : "blog.update",
    entityType: "post-group",
    entityId: groupId,
    scope: `blog.${translations.map(({ language }) => language).join(",")}`,
    description: `نوشته چندزبانه «${translations[0].data.title}» را به‌روزرسانی کرد.`,
    metadata: { languages: translations.map(({ language }) => language), published: payload.published },
  });
  return { id: groupId };
}

export async function deletePost(id: string) {
  const actor = await requirePermission("blog.delete");
  const { groupId, posts } = await findGroup(id);
  await prisma.post.deleteMany({ where: { translationGroupId: groupId } });
  posts.forEach((post) => revalidateBlog(post.language, post.slug));
  await recordActivity({
    actor,
    action: "blog.delete",
    entityType: "post-group",
    entityId: groupId,
    scope: `blog.${posts.map((post) => post.language).join(",")}`,
    description: `نوشته چندزبانه «${posts[0]?.title ?? "بدون عنوان"}» را حذف کرد.`,
  });
}

export async function togglePostPublished(id: string) {
  const actor = await requirePermission("blog.publish");
  const { groupId, posts } = await findGroup(id);
  const willPublish = !posts.every((post) => post.published);
  if (willPublish && BLOG_LANGUAGES.some((language) => !posts.some((post) => post.language === language))) {
    throw new Error("برای انتشار، هر سه ترجمه را کامل کنید.");
  }
  await prisma.post.updateMany({ where: { translationGroupId: groupId }, data: { published: willPublish } });
  posts.forEach((post) => revalidateBlog(post.language, post.slug));
  await recordActivity({
    actor,
    action: willPublish ? "blog.publish" : "blog.unpublish",
    entityType: "post-group",
    entityId: groupId,
    scope: "blog.fa,en,ar",
    description: `وضعیت انتشار «${posts[0]?.title ?? "نوشته"}» را به ${willPublish ? "منتشرشده" : "پیش‌نویس"} تغییر داد.`,
  });
  return { published: willPublish };
}

export async function duplicatePost(id: string) {
  const actor = await requirePermission("blog.write");
  const { posts } = await findGroup(id);
  const groupId = randomUUID();
  const suffix = Date.now().toString().slice(-6);
  await prisma.$transaction(posts.map((source) => prisma.post.create({
    data: {
      translationGroupId: groupId,
      title: `${source.title} (کپی)`,
      slug: `${source.slug}-copy-${suffix}`,
      content: source.content,
      contentFormat: source.contentFormat,
      template: source.template,
      excerpt: source.excerpt,
      coverImage: source.coverImage,
      category: source.category,
      tags: source.tags,
      author: source.author,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      featured: false,
      published: false,
      language: source.language,
    },
  })));
  await recordActivity({
    actor,
    action: "blog.duplicate",
    entityType: "post-group",
    entityId: groupId,
    scope: `blog.${posts.map((post) => post.language).join(",")}`,
    description: `از نوشته «${posts[0]?.title ?? "نوشته"}» یک کپی ساخت.`,
  });
  revalidatePath("/admin/dashboard");
  return { id: groupId };
}
