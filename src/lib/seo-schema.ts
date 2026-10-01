import "server-only";

import { getSiteBranding } from "./branding";
import { getSeoSettings } from "./seo";
import { SITE_URL, SeoLocale, SeoPage, absoluteUrl, pagePath } from "./seo-config";

export const HOME_LABELS = { en: "Home", fa: "خانه", ar: "الرئيسية" };
export const BLOG_LABELS = { en: "Insights", fa: "دیدگاه‌ها", ar: "الرؤى" };

export async function getSiteSchema(lang: SeoLocale) {
  const [settings, branding] = await Promise.all([getSeoSettings(), getSiteBranding()]);
  return {
    "@context": "https://schema.org", "@graph": [
      {
        "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "NovaVison", url: SITE_URL,
        description: settings.pages[lang].home.description,
        ...(branding.logoUrl ? { logo: { "@type": "ImageObject", url: absoluteUrl(branding.logoUrl) } } : {}),
        ...(settings.sameAs.length ? { sameAs: settings.sameAs } : {}),
      },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "NovaVison", inLanguage: ["en", "fa", "ar"], publisher: { "@id": `${SITE_URL}/#organization` } },
    ],
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return { "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })) };
}

export async function getPageSchema(lang: SeoLocale, page: SeoPage) {
  const settings = await getSeoSettings();
  const details = settings.pages[lang][page];
  const url = absoluteUrl(pagePath(lang, page));
  const breadcrumb = breadcrumbSchema([
    { name: HOME_LABELS[lang], url: absoluteUrl(`/${lang}`) },
    ...(page === "home" ? [] : [{ name: details.title.split("|")[0].trim(), url }]),
  ]);
  return { "@context": "https://schema.org", "@graph": [
    { "@type": { home: "WebPage", about: "AboutPage", contact: "ContactPage", blog: "CollectionPage" }[page],
      "@id": `${url}#webpage`, url, name: details.title, description: details.description, inLanguage: lang,
      isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${SITE_URL}/#organization` },
      breadcrumb: { "@id": `${url}#breadcrumbs` },
    },
    { ...breadcrumb, "@id": `${url}#breadcrumbs` },
  ] };
}

export function getServicesSchema(lang: SeoLocale, services: Record<string, { title: string; desc: string }>) {
  return { "@context": "https://schema.org", "@graph": Object.entries(services).map(([key, service]) => ({
    "@type": "Service", "@id": `${SITE_URL}/${lang}/#service-${key}`, name: service.title,
    description: service.desc, serviceType: service.title, url: `${SITE_URL}/${lang}#services`,
    provider: { "@id": `${SITE_URL}/#organization` },
  })) };
}
