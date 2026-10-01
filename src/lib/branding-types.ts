export type SiteBranding = {
  logoUrl: string;
  faviconUrl: string;
};

export const DEFAULT_BRANDING: SiteBranding = { logoUrl: "", faviconUrl: "" };
// A reserved JSON settings record, separate from the en/fa/ar dictionaries.
export const BRANDING_SETTINGS_KEY = "_site_branding";

export function isBrandingAsset(value: string, kind: "logo" | "favicon") {
  const extensions = kind === "favicon" ? "png|ico" : "png|jpg|webp|gif";
  return new RegExp(`^/uploads/branding/${kind}-[a-f0-9-]{36}\\.(${extensions})$`).test(value);
}
