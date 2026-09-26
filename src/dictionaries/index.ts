import "server-only";
import { prisma } from "@/lib/db";

const localDictionaries = {
  en: () => import("./en.json").then((module) => module.default),
  fa: () => import("./fa.json").then((module) => module.default),
  ar: () => import("./ar.json").then((module) => module.default),
};

export type Locale = keyof typeof localDictionaries;

export type DictionaryContent = typeof import("./en.json");

const DICTIONARY_QUERY_TIMEOUT_MS = 1500;

async function loadDatabaseDictionary(locale: Locale) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      prisma.dictionary.findUnique({ where: { language: locale } }),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), DICTIONARY_QUERY_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  if (!source || typeof source !== "object") return target;
  if (!target || typeof target !== "object") return source;

  const output: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      output[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
    } else if (sourceVal !== undefined && sourceVal !== null && sourceVal !== "") {
      output[key] = sourceVal;
    }
  }
  return output;
}

function applyNovaVisonBranding(content: DictionaryContent): DictionaryContent {
  if (!content) return content;
  const configuredBrand = (content as any)?.common?.novanTrade;

  const replace = (value: unknown): unknown => {
    if (typeof value === "string") {
      let res = value;
      if (configuredBrand) {
        res = res.split(configuredBrand).join("NovaVison");
      }
      return res
        .replaceAll("Novan Trade", "NovaVison")
        .replaceAll("novantrade.com", "novavisiontrade.com")
        .replaceAll("جيفان", "نوفافيزون")
        .replaceAll("ژیوان", "نواویژن");
    }

    if (Array.isArray(value)) return value.map(replace);

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [key, replace(nestedValue)]),
      );
    }

    return value;
  };

  return replace(content) as DictionaryContent;
}

export const getDictionary = async (locale: Locale): Promise<DictionaryContent> => {
  // Load base local JSON dictionary first as complete baseline
  const baseGetter = localDictionaries[locale] || localDictionaries.en;
  let baseDict: DictionaryContent;
  try {
    baseDict = await baseGetter();
  } catch {
    baseDict = (await localDictionaries.en()) as DictionaryContent;
  }

  try {
    const dbDict = await loadDatabaseDictionary(locale);
    if (dbDict && dbDict.content && typeof dbDict.content === "object") {
      // Deep-merge DB overrides on top of base JSON dictionary
      const merged = deepMerge(
        baseDict as unknown as Record<string, unknown>,
        dbDict.content as Record<string, unknown>,
      );
      return applyNovaVisonBranding(merged as unknown as DictionaryContent);
    }
  } catch (error) {
    console.error("Failed to load dictionary from DB:", error);
  }

  return applyNovaVisonBranding(baseDict);
};
