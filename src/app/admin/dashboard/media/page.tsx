import { readdir, stat } from "node:fs/promises";
import { requirePermission } from "@/lib/admin-auth";
import path from "node:path";
import MediaLibrary from "./MediaLibrary";

async function getMedia() {
  const directory = path.join(process.cwd(), "public", "uploads", "blog");
  try {
    const files = await readdir(directory);
    const items = await Promise.all(files.filter((file) => /\.(jpe?g|png|webp|gif)$/i.test(file)).map(async (file) => {
      const info = await stat(path.join(directory, file));
      return {
        name: file,
        url: `/uploads/blog/${file}`,
        bytes: info.size,
        size: info.size > 1024 * 1024 ? `${(info.size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(info.size / 1024)} KB`,
        modified: new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(info.mtime),
      };
    }));
    return items.sort((a, b) => b.bytes - a.bytes).map((item) => ({
      name: item.name,
      url: item.url,
      size: item.size,
      modified: item.modified,
    }));
  } catch {
    return [];
  }
}

export default async function MediaPage() {
  await requirePermission("media.write");
  const items = await getMedia();
  return (
    <div className="dashboard-page media-page">
      <header className="admin-page-header"><div><p className="page-context">کتابخانه فایل‌ها</p><h1>رسانه‌ها</h1><p>تصویرهای وبلاگ را یک‌جا بارگذاری کنید و نشانی آن‌ها را برای استفاده در محتوا بردارید.</p></div></header>
      <MediaLibrary items={items} />
    </div>
  );
}
