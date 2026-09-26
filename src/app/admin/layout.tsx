import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./admin.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-admin",
  display: "swap",
  fallback: ["Tahoma", "Segoe UI", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "مدیریت NovaVison",
  description: "پنل مدیریت محتوای وب‌سایت NovaVison",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={vazirmatn.variable}>
        <div className="admin-container">{children}</div>
      </body>
    </html>
  );
}
