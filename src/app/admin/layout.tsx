import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./admin.css";
import { BrandingProvider } from "@/components/BrandLogo";
import { getBrandingIcons, getSiteBranding } from "@/lib/branding";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-admin",
  display: "swap",
  fallback: ["Tahoma", "Segoe UI", "Arial", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "مدیریت NovaVison",
    description: "پنل مدیریت محتوای وب‌سایت NovaVison",
    robots: { index: false, follow: false, noarchive: true },
    icons: await getBrandingIcons(),
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const branding = await getSiteBranding();
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={vazirmatn.variable}>
        <BrandingProvider logoUrl={branding.logoUrl}>
          <div className="admin-container">{children}</div>
        </BrandingProvider>
      </body>
    </html>
  );
}
