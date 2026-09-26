"use server";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Reconstructs a deeply nested JSON object from a flat FormData object
 * where keys are dot-separated (e.g. "home.heroTitle" = "My Title").
 */
type MutableJsonObject = { [key: string]: string | MutableJsonObject };

function expandDotNotation(flatObj: Record<string, string>): Prisma.InputJsonObject {
  const result: MutableJsonObject = {};
  for (const [key, value] of Object.entries(flatObj)) {
    const keys = key.split('.');
    keys.reduce<MutableJsonObject>((acc, currentKey, index) => {
      if (index === keys.length - 1) {
        acc[currentKey] = value;
      } else {
        const child = acc[currentKey];
        acc[currentKey] = child && typeof child === "object" && !Array.isArray(child) ? child : {};
      }
      return acc[currentKey] as MutableJsonObject;
    }, result);
  }
  return result as Prisma.InputJsonObject;
}

export async function updateDictionary(lang: string, formData: FormData) {
  const actor = await requirePermission("pages.write");
  if (!['en', 'fa', 'ar'].includes(lang)) {
    throw new Error("زبان نامعتبر است.");
  }
  // Extract all data from the form
  const flatData: Record<string, string> = {};
  formData.forEach((value, key) => {
    // Only capture string inputs, skip internal Next.js form state
    if (typeof value === "string" && !key.startsWith("$ACTION")) {
      flatData[key] = value;
    }
  });

  // Reconstruct the JSON object
  const content = expandDotNotation(flatData);

  // Upsert to database
  await prisma.dictionary.upsert({
    where: { language: lang },
    update: { content },
    create: { language: lang, content }
  });

  await recordActivity({
    actor,
    action: "pages.update",
    entityType: "dictionary",
    entityId: lang,
    scope: `pages.${lang}`,
    description: `محتوای صفحات زبان ${lang.toUpperCase()} را تغییر داد.`,
    metadata: { fields: Object.keys(flatData) },
  });

  // Revalidate the entire application layout to instantly update translations globally
  revalidatePath("/", "layout");
}
