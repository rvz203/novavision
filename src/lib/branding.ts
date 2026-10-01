import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { BRANDING_SETTINGS_KEY, DEFAULT_BRANDING, isBrandingAsset, SiteBranding } from "./branding-types";

export const getSiteBranding = cache(async (): Promise<SiteBranding> => {
  // Resolve settings at request time, so uploads never require another build.
  await connection();
  try {
    const record = await prisma.dictionary.findUnique({ where: { language: BRANDING_SETTINGS_KEY } });
    const content = record?.content;
    if (!content || typeof content !== "object" || Array.isArray(content)) return DEFAULT_BRANDING;
    return {
      logoUrl: typeof content.logoUrl === "string" && isBrandingAsset(content.logoUrl, "logo") ? content.logoUrl : "",
      faviconUrl: typeof content.faviconUrl === "string" && isBrandingAsset(content.faviconUrl, "favicon") ? content.faviconUrl : "",
    };
  } catch (error) {
    console.error("Failed to load site branding:", error);
    return DEFAULT_BRANDING;
  }
});

export async function getBrandingIcons() {
  const { faviconUrl } = await getSiteBranding();
  const url = faviconUrl || "/default-favicon.ico";
  return { icon: url, shortcut: url };
}
