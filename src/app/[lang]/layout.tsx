import type { Metadata } from "next";
import { Cairo, Manrope, Space_Grotesk, Vazirmatn } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";

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

export const metadata: Metadata = {
  title: "NovaVison | International Sourcing & Logistics",
  description:
    "NovaVison provides integrated solutions for international sourcing, import, export, logistics, and supply-chain management.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const dir = lang === "fa" || lang === "ar" ? "rtl" : "ltr";

  let fontClass = manrope.variable;
  if (lang === "fa") fontClass = vazirmatn.variable;
  if (lang === "ar") fontClass = cairo.variable;

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${fontClass} ${spaceGrotesk.variable}`}>
        <Script id="theme-initializer" strategy="beforeInteractive">
          {themeInitializer}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
