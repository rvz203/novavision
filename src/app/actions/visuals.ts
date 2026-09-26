"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity";
import { VISUAL_MOTIONS, VISUAL_SECTIONS, VisualMotion, VisualSection } from "@/lib/site-visual-types";

export type VisualAdminItem = {
  id: string;
  section: VisualSection;
  imageUrl: string;
  altEn: string;
  altFa: string;
  altAr: string;
  captionEn: string;
  captionFa: string;
  captionAr: string;
  motion: VisualMotion;
  sortOrder: number;
  active: boolean;
  source: string;
};

export type VisualInput = Omit<VisualAdminItem, "id">;

function isSection(value: string): value is VisualSection {
  return VISUAL_SECTIONS.includes(value as VisualSection);
}

function isMotion(value: string): value is VisualMotion {
  return VISUAL_MOTIONS.includes(value as VisualMotion);
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function validateImageUrl(value: unknown) {
  const imageUrl = cleanText(value, 500);
  if (imageUrl && (!imageUrl.startsWith("/") || imageUrl.includes("..") || /[\r\n]/.test(imageUrl))) {
    throw new Error("نشانی تصویر باید یک مسیر داخلی امن باشد.");
  }
  return imageUrl;
}

function normalizeInput(input: VisualInput) {
  if (!isSection(input.section)) throw new Error("بخش انتخاب‌شده معتبر نیست.");
  if (!isMotion(input.motion)) throw new Error("حرکت انتخاب‌شده معتبر نیست.");

  return {
    section: input.section,
    imageUrl: validateImageUrl(input.imageUrl),
    altEn: cleanText(input.altEn, 240),
    altFa: cleanText(input.altFa, 240),
    altAr: cleanText(input.altAr, 240),
    captionEn: cleanText(input.captionEn, 160),
    captionFa: cleanText(input.captionFa, 160),
    captionAr: cleanText(input.captionAr, 160),
    motion: input.motion,
    sortOrder: Math.max(0, Math.min(999, Number.isFinite(input.sortOrder) ? Math.round(input.sortOrder) : 0)),
    active: Boolean(input.active),
    source: cleanText(input.source, 80) || "Admin",
  };
}

function serializeVisual(visual: Awaited<ReturnType<typeof prisma.siteVisual.create>>): VisualAdminItem {
  return {
    id: visual.id,
    section: isSection(visual.section) ? visual.section : "home.board",
    imageUrl: visual.imageUrl,
    altEn: visual.altEn,
    altFa: visual.altFa,
    altAr: visual.altAr,
    captionEn: visual.captionEn,
    captionFa: visual.captionFa,
    captionAr: visual.captionAr,
    motion: isMotion(visual.motion) ? visual.motion : "reveal",
    sortOrder: visual.sortOrder,
    active: visual.active,
    source: visual.source || "Admin",
  };
}

function refreshVisualPages() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/dashboard/visuals");
}

export async function createSiteVisual(section: VisualSection) {
  const actor = await requirePermission("pages.write");
  if (!isSection(section)) throw new Error("بخش انتخاب‌شده معتبر نیست.");

  const maximum = await prisma.siteVisual.aggregate({ where: { section }, _max: { sortOrder: true } });
  const visual = await prisma.siteVisual.create({
    data: { section, sortOrder: (maximum._max.sortOrder ?? -1) + 1, active: false, source: "Admin" },
  });

  await recordActivity({
    actor,
    action: "visual.create",
    entityType: "siteVisual",
    entityId: visual.id,
    scope: section,
    description: "یک تصویر تازه به کتابخانه تصویری سایت اضافه کرد.",
  });
  refreshVisualPages();
  return serializeVisual(visual);
}

export async function updateSiteVisual(id: string, input: VisualInput) {
  const actor = await requirePermission("pages.write");
  const data = normalizeInput(input);
  const visual = await prisma.siteVisual.update({ where: { id }, data });

  await recordActivity({
    actor,
    action: "visual.update",
    entityType: "siteVisual",
    entityId: visual.id,
    scope: visual.section,
    description: "تصویر، متن یا حرکت یک بخش تصویری سایت را ویرایش کرد.",
    metadata: { motion: visual.motion, active: visual.active, sortOrder: visual.sortOrder },
  });
  refreshVisualPages();
  return serializeVisual(visual);
}

export async function deleteSiteVisual(id: string) {
  const actor = await requirePermission("pages.write");
  const visual = await prisma.siteVisual.delete({ where: { id } });

  await recordActivity({
    actor,
    action: "visual.delete",
    entityType: "siteVisual",
    entityId: visual.id,
    scope: visual.section,
    description: "یک تصویر را از کتابخانه تصویری سایت حذف کرد.",
  });
  refreshVisualPages();
  return { id };
}
