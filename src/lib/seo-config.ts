export const SITE_URL = "https://novavisiontrade.com";
export const SEO_SETTINGS_KEY = "_site_seo";
export const SEO_LOCALES = ["en", "fa", "ar"] as const;
export const SEO_PAGES = ["home", "about", "contact", "blog"] as const;
export type SeoLocale = (typeof SEO_LOCALES)[number];
export type SeoPage = (typeof SEO_PAGES)[number];
export type PageSeo = { title: string; description: string; socialImage: string };
export type SeoSettings = {
  pages: Record<SeoLocale, Record<SeoPage, PageSeo>>;
  googleVerification: string;
  bingVerification: string;
  sameAs: string[];
};

export function isSeoLocale(value: string): value is SeoLocale {
  return SEO_LOCALES.includes(value as SeoLocale);
}

export function pagePath(lang: SeoLocale, page: SeoPage) {
  return `/${lang}${page === "home" ? "" : `/${page}`}`;
}

export function postPath(lang: string, slug: string) {
  return `/${lang}/blog/${encodeURIComponent(slug)}`;
}

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).href;
}

export function publicImageUrl(value: string | null | undefined) {
  if (!value || /[\\\r\n]/.test(value)) return "";
  try {
    const url = new URL(value, SITE_URL);
    if (url.protocol !== "https:" || url.username || url.password || value.startsWith("//")) return "";
    return url.href;
  } catch {
    return "";
  }
}

const entry = (title: string, description: string): PageSeo => ({ title, description, socialImage: "" });

export const DEFAULT_SEO: SeoSettings = {
  pages: {
    en: {
      home: entry("International Trade & Product Sourcing | NovaVison", "NovaVison connects businesses with product sourcing, import and export management, logistics, and supply-chain support for international trade."),
      about: entry("About NovaVison | International Trade & Sourcing", "Meet NovaVison: an international trading company focused on reliable product sourcing, transparent partnerships, and coordinated supply-chain operations."),
      contact: entry("Contact NovaVison | Trade & Product Sourcing Inquiries", "Discuss your product sourcing, import, export, or logistics requirements with NovaVison and start a conversation about your international trade needs."),
      blog: entry("Trade Insights & Product Sourcing Guides | NovaVison", "Explore NovaVison market insights, international trade news, product sourcing guides, and practical perspectives on logistics and supply chains."),
    },
    fa: {
      home: entry("تجارت بین‌المللی و تأمین محصولات | NovaVison", "NovaVison در تأمین محصولات، مدیریت واردات و صادرات، هماهنگی لجستیک و زنجیره تأمین، همراه کسب‌وکارها در تجارت بین‌المللی است."),
      about: entry("درباره NovaVison | تجارت و تأمین محصولات", "با NovaVison آشنا شوید؛ شرکت بازرگانی بین‌المللی با تمرکز بر تأمین مطمئن محصولات، همکاری شفاف و مدیریت هماهنگ زنجیره تأمین."),
      contact: entry("تماس با NovaVison | درخواست بازرگانی و تأمین کالا", "برای بررسی نیازهای تأمین محصولات، واردات، صادرات و حمل‌ونقل با NovaVison تماس بگیرید و درباره همکاری بازرگانی گفت‌وگو کنید."),
      blog: entry("دیدگاه‌های تجارت و راهنمای تأمین کالا | NovaVison", "تحلیل‌های بازار، اخبار تجارت بین‌المللی و راهنماهای تأمین محصولات، لجستیک و زنجیره تأمین را در وبلاگ NovaVison دنبال کنید."),
    },
    ar: {
      home: entry("التجارة الدولية وتوريد المنتجات | NovaVison", "تساعد NovaVison الشركات في توريد المنتجات وإدارة الاستيراد والتصدير وتنسيق الخدمات اللوجستية وسلاسل الإمداد للتجارة الدولية."),
      about: entry("عن NovaVison | التجارة وتوريد المنتجات", "تعرّف على NovaVison، شركة تجارة دولية تركز على توريد المنتجات الموثوق والشراكات الشفافة وإدارة عمليات سلاسل الإمداد."),
      contact: entry("تواصل مع NovaVison | استفسارات التجارة والتوريد", "ناقش احتياجات توريد المنتجات والاستيراد والتصدير والخدمات اللوجستية مع NovaVison وابدأ محادثة حول التعاون التجاري."),
      blog: entry("رؤى التجارة وأدلة توريد المنتجات | NovaVison", "اكتشف تحليلات السوق وأخبار التجارة الدولية وأدلة توريد المنتجات ورؤى الخدمات اللوجستية وسلاسل الإمداد من NovaVison."),
    },
  },
  googleVerification: "",
  bingVerification: "",
  sameAs: [],
};

export function plainText(value: string) {
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`#*_~]/g, "")
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt);/g, (entity) => ({ "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" })[entity] || entity)
    .replace(/\s+/g, " ").trim();
}

export function summarize(value: string, maximum = 160) {
  const text = plainText(value);
  if (text.length <= maximum) return text;
  return `${text.slice(0, maximum - 1).replace(/\s+\S*$/, "").trim()}…`;
}

export function pageAlternates(lang: SeoLocale, page: SeoPage) {
  return {
    canonical: absoluteUrl(pagePath(lang, page)),
    languages: { ...Object.fromEntries(SEO_LOCALES.map((locale) => [locale, absoluteUrl(pagePath(locale, page))])), "x-default": absoluteUrl(pagePath("en", page)) },
    types: { "application/rss+xml": absoluteUrl(`/feed.xml?lang=${lang}`) },
  };
}
