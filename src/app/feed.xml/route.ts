import { prisma } from "@/lib/db";
import { getSeoSettings } from "@/lib/seo";
import { SITE_URL, isSeoLocale, postPath, absoluteUrl, summarize } from "@/lib/seo-config";

function xml(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!);
}

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang") || "en";
  if (!isSeoLocale(lang)) return new Response("Unsupported language", { status: 400 });
  const [settings, posts] = await Promise.all([
    getSeoSettings(),
    prisma.post.findMany({ where: { published: true, language: lang }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const details = settings.pages[lang].blog;
  const feedUrl = `${SITE_URL}/feed.xml?lang=${lang}`;
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${xml(details.title)}</title><link>${SITE_URL}/${lang}/blog</link><description>${xml(details.description)}</description><language>${lang}</language><atom:link href="${xml(feedUrl)}" rel="self" type="application/rss+xml"/>${posts.map((post) => `<item><title>${xml(post.title)}</title><link>${xml(absoluteUrl(postPath(lang, post.slug)))}</link><guid isPermaLink="false">${xml(`${SITE_URL}/posts/${post.id}`)}</guid><description>${xml(summarize(post.excerpt || post.content, 500))}</description><pubDate>${post.createdAt.toUTCString()}</pubDate>${post.category ? `<category>${xml(post.category)}</category>` : ""}</item>`).join("")}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "no-cache" } });
}
