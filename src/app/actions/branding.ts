"use server";

import { access } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { BRANDING_SETTINGS_KEY, isBrandingAsset, SiteBranding } from "@/lib/branding-types";

export async function updateSiteBranding(input: SiteBranding): Promise<SiteBranding> {
  const actor = await requirePermission("pages.write");
  const content = { logoUrl: String(input.logoUrl ?? "").trim(), faviconUrl: String(input.faviconUrl ?? "").trim() };
  for (const kind of ["logo", "favicon"] as const) {
    const url = content[`${kind}Url`];
    if (!url) continue;
    if (!isBrandingAsset(url, kind)) throw new Error("لطفاً تصویر را از همین صفحه بارگذاری کنید.");
    try {
      await access(path.join(process.cwd(), "public", url));
    } catch {
      throw new Error("فایل تصویر پیدا نشد؛ دوباره آن را بارگذاری کنید.");
    }
  }

  await prisma.$transaction([
    prisma.dictionary.upsert({
      where: { language: BRANDING_SETTINGS_KEY },
      create: { language: BRANDING_SETTINGS_KEY, content },
      update: { content },
    }),
    prisma.activityLog.create({ data: {
      userId: actor.id, actorName: actor.name, actorEmail: actor.email,
      action: "branding.update", entityType: "branding", entityId: BRANDING_SETTINGS_KEY,
      scope: "site.branding", description: "لوگو و آیکن مرورگر سایت را ویرایش کرد.", metadata: content,
    } }),
  ]);
  revalidatePath("/", "layout");
  return content;
}
