import { requirePermission } from "@/lib/admin-auth";
import { getSiteBranding } from "@/lib/branding";
import BrandingManager from "./BrandingManager";

export default async function BrandingPage() {
  await requirePermission("pages.write");
  const branding = await getSiteBranding();
  return (
    <div className="dashboard-page">
      <header className="admin-page-header">
        <div>
          <p className="page-context">هویت بصری سایت</p>
          <h1>لوگو و آیکن مرورگر</h1>
          <p>لوگوی سایت و آیکن تب مرورگر را بارگذاری کنید. پس از ذخیره، تغییرات در تمام زبان‌ها نمایش داده می‌شود.</p>
        </div>
      </header>
      <BrandingManager initialBranding={branding} />
    </div>
  );
}
