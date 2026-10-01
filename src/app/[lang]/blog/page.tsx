import { prisma } from "@/lib/db";
import { Locale } from "@/dictionaries";
import { ArrowUpLeft, CalendarDays, Clock3 } from "lucide-react";
import Link from "next/link";
import { FeatureVisual } from "@/components/EditorialVisuals";
import { getSiteVisuals } from "@/lib/site-visuals";
import "./blog-list.css";
import { getPageMetadata } from "@/lib/seo";
import { getPageSchema } from "@/lib/seo-schema";
import JsonLd from "@/components/JsonLd";
import { postPath } from "@/lib/seo-config";

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return getPageMetadata(lang, "blog");
}

const copy = {
  fa: { title: "دیدگاه‌ها و تحلیل‌ها", subtitle: "تازه‌ترین تحلیل‌های بازار، راهنماهای بازرگانی و خبرهای NovaVison", read: "مطالعه نوشته", empty: "هنوز نوشته‌ای منتشر نشده است.", minute: "دقیقه" },
  ar: { title: "الرؤى والتحليلات", subtitle: "أحدث تحليلات السوق وأدلة التجارة وأخبار NovaVison", read: "قراءة المقال", empty: "لا توجد مقالات منشورة بعد.", minute: "دقائق" },
  en: { title: "Insights from the moving world.", subtitle: "Market analysis, practical trade guides, and news from NovaVison.", read: "Read article", empty: "No articles have been published yet.", minute: "min" },
};

export default async function BlogPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const text = copy[lang] || copy.en;
  const [posts, heroVisuals] = await Promise.all([
    prisma.post.findMany({
      where: { language: lang, published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    getSiteVisuals("insights.hero", lang),
  ]);
  const featured = posts[0];
  const rest = posts.slice(1);
  const locale = lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-SA" : "en-US";

  return (
    <main className="blog-index">
      <JsonLd data={await getPageSchema(lang, "blog")} />
      <header className="blog-index-header">
        <div className="blog-index-copy">
          <h1>{text.title}</h1><p>{text.subtitle}</p>
          <span className="blog-count">{posts.length.toLocaleString(locale)} {lang === "en" ? "articles" : lang === "fa" ? "نوشته" : "مقالة"}</span>
        </div>
        <FeatureVisual visual={heroVisuals[0]} className="blog-hero-visual" priority />
      </header>

      {featured ? (
        <Link href={postPath(lang, featured.slug)} className="featured-post">
          <div className="featured-post-media">
            {featured.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.coverImage} alt={featured.title} decoding="async" />
            ) : <div className="post-image-placeholder">N</div>}
          </div>
          <div className="featured-post-content">
            <span className="post-category">{featured.category || text.title}</span>
            <h2>{featured.title}</h2>
            <p>{featured.excerpt || ""}</p>
            <div className="post-card-meta">
              <span><CalendarDays size={16} /> {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(featured.createdAt)}</span>
              <span><Clock3 size={16} /> {Math.max(1, Math.ceil(featured.content.replace(/<[^>]*>/g, "").length / 900)).toLocaleString(locale)} {text.minute}</span>
            </div>
            <span className="read-link">{text.read}<ArrowUpLeft size={18} /></span>
          </div>
        </Link>
      ) : null}

      {rest.length ? (
        <section className="post-grid">
          {rest.map((post) => (
            <Link href={postPath(lang, post.slug)} className="post-card" key={post.id}>
              <div className="post-card-media">
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" />
                ) : <div className="post-image-placeholder">N</div>}
              </div>
              <div className="post-card-body">
                <span className="post-category">{post.category || text.title}</span>
                <h2>{post.title}</h2>
                <p>{post.excerpt || ""}</p>
                <div className="post-card-meta"><span><CalendarDays size={15} /> {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(post.createdAt)}</span></div>
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      {!posts.length ? <div className="blog-empty"><span>N</span><p>{text.empty}</p></div> : null}
    </main>
  );
}
