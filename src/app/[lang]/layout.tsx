import type { Metadata } from "next";
import { Cairo, Manrope, Space_Grotesk, Vazirmatn } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";
import { BrandingProvider } from "@/components/BrandLogo";
import { getBrandingIcons, getSiteBranding } from "@/lib/branding";
import { notFound } from "next/navigation";
import { getSeoSettings } from "@/lib/seo";
import { isSeoLocale, SITE_URL } from "@/lib/seo-config";
import { getSiteSchema } from "@/lib/seo-schema";
import JsonLd from "@/components/JsonLd";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const vazirmatn = Vazirmatn({ subsets: ["arabic"], variable: "--font-vazirmatn" });
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

const themeInitializer = `
  (() => {
    try {
      const stored = localStorage.getItem("theme");
      const selected = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
      const resolved = selected === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : selected;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    } catch {}
  })();
`;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSeoLocale(lang)) notFound();
  const settings = await getSeoSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: settings.pages[lang].home.title,
    description: settings.pages[lang].home.description,
    applicationName: "NovaVison",
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    verification: {
      ...(settings.googleVerification ? { google: settings.googleVerification } : {}),
      ...(settings.bingVerification ? { other: { "msvalidate.01": settings.bingVerification } } : {}),
    },
    icons: await getBrandingIcons(),
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isSeoLocale(lang)) notFound();
  const branding = await getSiteBranding();
  const schema = await getSiteSchema(lang);
  const dir = lang === "fa" || lang === "ar" ? "rtl" : "ltr";

  let fontClass = manrope.variable;
  if (lang === "fa") fontClass = vazirmatn.variable;
  if (lang === "ar") fontClass = cairo.variable;

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${fontClass} ${spaceGrotesk.variable}`}>
        <JsonLd data={schema} />
        <Script id="theme-initializer" strategy="beforeInteractive">
          {themeInitializer}
        </Script>
        <BrandingProvider logoUrl={branding.logoUrl}>
          <ThemeProvider>{children}</ThemeProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
