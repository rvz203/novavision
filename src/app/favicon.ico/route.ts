import { getSiteBranding } from "@/lib/branding";

export async function GET() {
  const { faviconUrl } = await getSiteBranding();
  return new Response(null, {
    status: 307,
    headers: { Location: faviconUrl || "/default-favicon.ico", "Cache-Control": "no-store" },
  });
}
