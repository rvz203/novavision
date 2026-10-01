import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requirePermission } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity";

export const runtime = "nodejs";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function imageExtension(buffer: Buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(PNG_SIGNATURE) && buffer.toString("ascii", 12, 16) === "IHDR") return "png";
  if (buffer.length >= 4 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return "jpg";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buffer.length >= 10 && /^GIF8[79]a$/.test(buffer.toString("ascii", 0, 6))) return "gif";
  if (buffer.length >= 22 && buffer.readUInt16LE(0) === 0 && buffer.readUInt16LE(2) === 1) {
    const count = buffer.readUInt16LE(4);
    if (!count || count > 64 || buffer.length < 6 + count * 16) return null;
    for (let index = 0; index < count; index++) {
      const offset = 6 + index * 16;
      const width = buffer[offset] || 256;
      const height = buffer[offset + 1] || 256;
      const size = buffer.readUInt32LE(offset + 8);
      const start = buffer.readUInt32LE(offset + 12);
      if (width !== height || width < 16 || !size || start < 6 + count * 16 || start + size > buffer.length) return null;
    }
    return "ico";
  }
  return null;
}

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requirePermission("pages.write");
  } catch {
    return Response.json({ error: "برای تغییر هویت سایت باید دسترسی ویرایش صفحات داشته باشید." }, { status: 403 });
  }

  try {
    const kind = new URL(request.url).searchParams.get("kind");
    if (kind !== "logo" && kind !== "favicon") return Response.json({ error: "نوع تصویر معتبر نیست." }, { status: 400 });
    const file = (await request.formData()).get("file");
    if (!(file instanceof File) || !file.size) return Response.json({ error: "یک فایل تصویر انتخاب کنید." }, { status: 400 });
    const limit = kind === "favicon" ? 1024 * 1024 : 8 * 1024 * 1024;
    if (file.size > limit) return Response.json({ error: kind === "favicon" ? "حجم آیکن باید کمتر از ۱ مگابایت باشد." : "حجم لوگو باید کمتر از ۸ مگابایت باشد." }, { status: 413 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = imageExtension(buffer);
    const allowed = kind === "favicon" ? ["png", "ico"] : ["png", "jpg", "webp", "gif"];
    if (!extension || !allowed.includes(extension)) return Response.json({ error: kind === "favicon" ? "آیکن باید یک فایل PNG یا ICO معتبر باشد." : "لوگو باید یک تصویر PNG، JPG، WebP یا GIF معتبر باشد." }, { status: 415 });
    if (kind === "favicon" && extension === "png") {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width !== height || width < 16 || width > 512) return Response.json({ error: "آیکن PNG باید مربع و اندازه آن بین ۱۶ تا ۵۱۲ پیکسل باشد." }, { status: 400 });
    }
    const directory = path.join(process.cwd(), "public", "uploads", "branding");
    await mkdir(directory, { recursive: true });
    const filename = `${kind}-${randomUUID()}.${extension}`;
    await writeFile(path.join(directory, filename), buffer, { flag: "wx" });
    await recordActivity({ actor, action: "branding.upload", entityType: "media", entityId: filename,
      scope: "site.branding", description: kind === "logo" ? "یک لوگو بارگذاری کرد." : "یک آیکن مرورگر بارگذاری کرد.",
      metadata: { name: file.name, size: file.size, kind },
    });
    return Response.json({ url: `/uploads/branding/${filename}` });
  } catch (error) {
    console.error("Branding upload failed:", error);
    return Response.json({ error: "بارگذاری تصویر انجام نشد؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
