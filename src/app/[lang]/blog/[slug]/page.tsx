import { prisma } from "@/lib/db";
import { sanitizePostHtml } from "@/lib/blog";
import { Locale } from "@/dictionaries";
import { ArrowRight, CalendarDays, Clock3, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import "./blog.css";
import { findPublishedPost } from "@/lib/post-routing";
import { getSeoSettings, socialMetadata } from "@/lib/seo";
import { SITE_URL, absoluteUrl, isSeoLocale, postPath, publicImageUrl, plainText, summarize } from "@/lib/seo-config";
import { HOME_LABELS, BLOG_LABELS, breadcrumbSchema } from "@/lib/seo-schema";
import JsonLd from "@/components/JsonLd";

type Props = { params: Promise<{ lang: Locale; slug: string }> };

function normalizedSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function resolvePost(slug: string, lang: Locale) {
  if (!isSeoLocale(lang)) notFound();
  const result = await findPublishedPost(slug, lang);
  if (!result) notFound();
  if (result.post.slug !== slug) permanentRedirect(postPath(lang, result.post.slug));
  return result;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug: routeSlug } = await params;
  const slug = normalizedSlug(routeSlug);
  const { post, translations } = await resolvePost(slug, lang);
  const settings = await getSeoSettings();
  const title = post.seoTitle || `${post.title} | NovaVison`;
  const description = post.seoDescription || summarize(post.excerpt || post.content);
  const url = absoluteUrl(postPath(lang, post.slug));
  const languages = Object.fromEntries(translations.map((item) => [item.language, absoluteUrl(postPath(item.language, item.slug))]));
  const social = socialMetadata(lang, title, description, url, publicImageUrl(post.coverImage) || settings.pages[lang].blog.socialImage || "/api/og?page=blog");
  return {
    title: { absolute: title }, description,
    alternates: { canonical: url, languages: { ...languages, "x-default": languages.en || languages.fa || languages.ar }, types: { "application/rss+xml": absoluteUrl(`/feed.xml?lang=${lang}`) } },
    authors: [{ name: post.author || "NovaVison" }],
    ...social,
    openGraph: { ...social.openGraph, type: "article", publishedTime: post.createdAt.toISOString(), modifiedTime: post.updatedAt.toISOString(), ...(post.category ? { section: post.category } : {}), tags: post.tags },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { lang, slug: routeSlug } = await params;
  const slug = normalizedSlug(routeSlug);
  const { post, translations } = await resolvePost(slug, lang);
  const related = await prisma.post.findMany({ where: { published: true, language: lang, id: { not: post.id } }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, title: true, slug: true, excerpt: true } });
  const url = absoluteUrl(postPath(lang, post.slug));
  const description = post.seoDescription || summarize(post.excerpt || post.content);
  const breadcrumbs = [
    { name: HOME_LABELS[lang], url: absoluteUrl(`/${lang}`) },
    { name: BLOG_LABELS[lang], url: absoluteUrl(`/${lang}/blog`) },
    { name: post.title, url },
  ];
  const image = publicImageUrl(post.coverImage);
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "BlogPosting", "@id": `${url}#article`, headline: post.title, description, url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url }, inLanguage: lang,
      datePublished: post.createdAt.toISOString(), dateModified: post.updatedAt.toISOString(),
      author: { "@type": /novavision|novavison|تیم|فريق/i.test(post.author || "NovaVison") ? "Organization" : "Person", name: post.author || "NovaVison" },
      publisher: { "@id": `${SITE_URL}/#organization` }, ...(image ? { image: [image] } : {}),
      ...(post.category ? { articleSection: post.category } : {}), keywords: post.tags.join(", "), wordCount: plainText(post.content).split(/\s+/u).filter(Boolean).length,
      workTranslation: translations.filter((item) => item.language !== lang).map((item) => ({ "@type": "CreativeWork", url: absoluteUrl(postPath(item.language, item.slug)), inLanguage: item.language })),
    },
    breadcrumbSchema(breadcrumbs),
  ] };

  const locale = lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-SA" : "en-US";
  const minutes = Math.max(1, Math.ceil(post.content.replace(/<[^>]*>/g, "").length / 900));
  const back = lang === "fa" ? "بازگشت به وبلاگ" : lang === "ar" ? "العودة إلى المدونة" : "Back to blog";
  const minuteLabel = lang === "en" ? "min read" : lang === "fa" ? "دقیقه مطالعه" : "دقائق للقراءة";

  return (
    <main className={`blog-post-container template-${post.template}`}>
      <JsonLd data={schema} />
      <nav className="blog-breadcrumbs" aria-label={lang === "en" ? "Breadcrumbs" : lang === "fa" ? "مسیر صفحه" : "مسار التنقل"}>
        <Link href={`/${lang}`}>{HOME_LABELS[lang]}</Link><span aria-hidden="true">/</span>
        <Link href={`/${lang}/blog`}>{BLOG_LABELS[lang]}</Link><span aria-hidden="true">/</span><span aria-current="page">{post.title}</span>
      </nav>
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
          <img src={post.coverImage} alt={post.title} decoding="async" fetchPriority="high" />
        </div>
      ) : null}
      {post.excerpt ? <p className="blog-lead">{post.excerpt}</p> : null}
      <article className="blog-content">
        {post.contentFormat === "markdown" ? <ReactMarkdown>{post.content}</ReactMarkdown> : <div dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.content) }} />}
      </article>
      {post.tags.length ? <footer className="blog-tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</footer> : null}
      <nav className="blog-translations" aria-label={lang === "en" ? "Article translations" : lang === "fa" ? "ترجمه‌های مقاله" : "ترجمات المقال"}>
        {translations.map((item) => <Link key={item.language} href={postPath(item.language, item.slug)} hrefLang={item.language} lang={item.language} aria-current={item.language === lang ? "page" : undefined}>{({ en: "English", fa: "فارسی", ar: "العربية" } as Record<string, string>)[item.language]}</Link>)}
      </nav>
      {related.length > 0 && <section className="blog-related">
        <h2>{lang === "en" ? "More trade insights" : lang === "fa" ? "دیدگاه‌های بیشتر" : "المزيد من الرؤى"}</h2>
        {related.map((item) => <Link href={postPath(lang, item.slug)} key={item.id}><h3>{item.title}</h3>{item.excerpt && <p>{item.excerpt}</p>}</Link>)}
      </section>}
    </main>
  );
}
