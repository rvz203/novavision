import "server-only";

import { sanitizePostHtml } from "@/lib/blog-html";
export { sanitizePostHtml } from "@/lib/blog-html";

export const BLOG_TEMPLATES = ["standard", "analysis", "guide", "news"] as const;
export const BLOG_LANGUAGES = ["fa", "en", "ar"] as const;
export const CONTENT_FORMATS = ["html", "markdown"] as const;

export type BlogTemplate = (typeof BLOG_TEMPLATES)[number];
export type BlogLanguage = (typeof BLOG_LANGUAGES)[number];
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export type PostPayload = {
  title: string;
  slug: string;
  content: string;
  contentFormat: ContentFormat;
  template: BlogTemplate;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  published: boolean;
  language: BlogLanguage;
};

export type MultilingualPostPayload = {
  template: BlogTemplate;
  coverImage: string;
  featured: boolean;
  published: boolean;
  translations: Record<BlogLanguage, Omit<PostPayload, "template" | "coverImage" | "featured" | "published" | "language">>;
};

export function translationIsBlank(
  translation: MultilingualPostPayload["translations"][BlogLanguage],
) {
  return !translation.title.trim() && !translation.slug.trim() && !translation.content.trim();
}

const MAX = {
  title: 160,
  slug: 140,
  excerpt: 500,
  author: 80,
  category: 80,
  seoTitle: 70,
  seoDescription: 180,
  content: 250_000,
};

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export function validatePostPayload(input: PostPayload) {
  const title = clean(input.title, MAX.title);
  const slug = clean(input.slug, MAX.slug)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const contentFormat = CONTENT_FORMATS.includes(input.contentFormat)
    ? input.contentFormat
    : "html";
  const contentSource = String(input.content ?? "").slice(0, MAX.content);
  const content = contentFormat === "html" ? sanitizePostHtml(contentSource) : contentSource;

  if (!title || !content) throw new Error("عنوان و محتوای نوشته الزامی است.");
  if (!slug || !/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug)) {
    throw new Error("پیوند یکتا فقط می‌تواند شامل حرف، عدد و خط تیره باشد.");
  }

  return {
    title,
    slug,
    content,
    contentFormat,
    template: BLOG_TEMPLATES.includes(input.template) ? input.template : "standard",
    excerpt: clean(input.excerpt, MAX.excerpt) || null,
    coverImage: clean(input.coverImage, 500) || null,
    category: clean(input.category, MAX.category) || null,
    tags: Array.from(new Set((input.tags ?? []).map((tag) => clean(tag, 40)).filter(Boolean))).slice(0, 12),
    author: clean(input.author, MAX.author) || null,
    seoTitle: clean(input.seoTitle, MAX.seoTitle) || null,
    seoDescription: clean(input.seoDescription, MAX.seoDescription) || null,
    featured: Boolean(input.featured),
    published: Boolean(input.published),
    language: BLOG_LANGUAGES.includes(input.language) ? input.language : "fa",
  };
}
