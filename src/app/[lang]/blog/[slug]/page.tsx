import { prisma } from "@/lib/db";
import { sanitizePostHtml } from "@/lib/blog";
import { Locale } from "@/dictionaries";
import { ArrowRight, CalendarDays, Clock3, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import "./blog.css";

type Props = { params: Promise<{ lang: Locale; slug: string }> };

function normalizedSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function findPost(slug: string, lang: Locale) {
  // 1. Direct match with slug and language
  const direct = await prisma.post.findFirst({ where: { slug, language: lang, published: true } });
  if (direct) return direct;

  // 2. Find post with matching slug in any language
  const anyPost = await prisma.post.findFirst({ where: { slug, published: true } });
  if (anyPost) {
    if (anyPost.translationGroupId) {
      const sibling = await prisma.post.findFirst({
        where: { translationGroupId: anyPost.translationGroupId, language: lang, published: true },
      });
      if (sibling) return sibling;
    }
    return anyPost;
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug: routeSlug } = await params;
  const slug = normalizedSlug(routeSlug);
  const post = await findPost(slug, lang);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { lang, slug: routeSlug } = await params;
  const slug = normalizedSlug(routeSlug);
  const post = await findPost(slug, lang);
  if (!post) notFound();

  const locale = lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-SA" : "en-US";
  const minutes = Math.max(1, Math.ceil(post.content.replace(/<[^>]*>/g, "").length / 900));
  const back = lang === "fa" ? "بازگشت به وبلاگ" : lang === "ar" ? "العودة إلى المدونة" : "Back to blog";
  const minuteLabel = lang === "en" ? "min read" : lang === "fa" ? "دقیقه مطالعه" : "دقائق للقراءة";

  return (
    <main className={`blog-post-container template-${post.template}`}>
      <Link href={`/${lang}/blog`} className="back-link"><ArrowRight size={18} />{back}</Link>
      <header className="blog-header">
        {post.category ? <span className="blog-category">{post.category}</span> : null}
        <h1 className="blog-title">{post.title}</h1>
        <div className="blog-meta">
          <span><UserRound size={16} />{post.author || "NovaVison"}</span>
          <span><CalendarDays size={16} />{new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(post.createdAt)}</span>
          <span><Clock3 size={16} />{minutes.toLocaleString(locale)} {minuteLabel}</span>
        </div>
      </header>
      {post.coverImage ? (
        <div className="blog-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt="" />
        </div>
      ) : null}
      {post.excerpt ? <p className="blog-lead">{post.excerpt}</p> : null}
      <article className="blog-content">
        {post.contentFormat === "markdown" ? <ReactMarkdown>{post.content}</ReactMarkdown> : <div dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.content) }} />}
      </article>
      {post.tags.length ? <footer className="blog-tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</footer> : null}
    </main>
  );
}
