import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { VISUAL_MOTIONS, VISUAL_SECTIONS, VisualMotion, VisualSection } from "@/lib/site-visual-types";
import type { VisualAdminItem } from "@/app/actions/visuals";
import VisualsManager from "./VisualsManager";

export default async function VisualsPage() {
  await requirePermission("pages.write");
  const visuals = await prisma.siteVisual.findMany({ orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] });

  const items: VisualAdminItem[] = visuals.map((visual) => ({
    id: visual.id,
    section: VISUAL_SECTIONS.includes(visual.section as VisualSection) ? visual.section as VisualSection : "home.board",
    imageUrl: visual.imageUrl,
    altEn: visual.altEn,
    altFa: visual.altFa,
    altAr: visual.altAr,
    captionEn: visual.captionEn,
    captionFa: visual.captionFa,
    captionAr: visual.captionAr,
    motion: VISUAL_MOTIONS.includes(visual.motion as VisualMotion) ? visual.motion as VisualMotion : "reveal",
    sortOrder: visual.sortOrder,
    active: visual.active,
    source: visual.source || "Admin",
  }));

  return (
    <div className="dashboard-page visuals-page">
      <header className="admin-page-header">
        <div>
          <p className="page-context">تصاویر و حرکت‌های سایت</p>
          <h1>استودیوی تصویری</h1>
          <p>تصاویر صفحه خانه، درباره ما و دیدگاه‌ها را جایگزین کنید؛ عنوان، ترتیب نمایش و نوع حرکت هر تصویر نیز از همین‌جا قابل ویرایش است.</p>
        </div>
      </header>
      <VisualsManager initialItems={items} />
    </div>
  );
}
