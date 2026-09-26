import { requirePermission } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("media.write");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "فایلی انتخاب نشده است." }, { status: 400 });
    }

    const extension = ACCEPTED_TYPES.get(file.type);
    if (!extension) {
      return Response.json(
        { error: "فقط تصویرهای JPG، PNG، WebP و GIF پذیرفته می‌شوند." },
        { status: 415 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "حجم تصویر باید کمتر از ۸ مگابایت باشد." }, { status: 413 });
    }

    const directory = path.join(process.cwd(), "public", "uploads", "blog");
    await mkdir(directory, { recursive: true });

    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(directory, filename), buffer, { flag: "wx" });

    await recordActivity({
      actor,
      action: "media.upload",
      entityType: "media",
      entityId: filename,
      scope: "media.blog",
      description: `تصویر «${file.name}» را بارگذاری کرد.`,
      metadata: { name: file.name, size: file.size, type: file.type },
    });

    return Response.json({
      url: `/uploads/blog/${filename}`,
      name: file.name,
      size: file.size,
    });
  } catch {
    return Response.json({ error: "برای بارگذاری تصویر وارد پنل شوید." }, { status: 401 });
  }
}
