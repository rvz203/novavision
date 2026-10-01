import { ImageResponse } from "next/og";
import { SEO_PAGES, SeoPage } from "@/lib/seo-config";

export const runtime = "nodejs";

const headlines: Record<SeoPage, string> = {
  home: "Trade. Products. Global opportunities.",
  about: "A clear vision for international trade.",
  contact: "Let's discuss your next trade opportunity.",
  blog: "Trade insights. Sourcing perspectives.",
};

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("page") || "home";
  if (!SEO_PAGES.includes(value as SeoPage)) return new Response("Unknown page", { status: 400 });
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "64px 76px", background: "#080d23", color: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 38, fontWeight: 700 }}><span style={{ color: "#d7ff3f", marginRight: 18 }}>N</span>NovaVison</div>
      <div style={{ display: "flex", maxWidth: 960, fontSize: 76, lineHeight: 1.12, fontWeight: 700 }}>{headlines[value as SeoPage]}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 23, color: "#c6d2e2" }}><span>International trade &amp; product sourcing</span><span style={{ color: "#d7ff3f" }}>novavisiontrade.com</span></div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
