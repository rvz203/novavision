"use client";

import { Check, Copy, ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

type MediaItem = { name: string; url: string; size: string; modified: string };

export default function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function uploadFiles(files: FileList | File[]) {
    setIsUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.append("file", file);
        const response = await fetch("/api/admin/upload", { method: "POST", body: data });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error || "بارگذاری تصویر انجام نشد.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "بارگذاری تصویر انجام نشد.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <label
        htmlFor={inputId}
        className="media-upload-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files.length) void uploadFiles(event.dataTransfer.files);
        }}
      >
        {isUploading ? <LoaderCircle className="spin" size={28} /> : <UploadCloud size={28} />}
        <div><strong>{isUploading ? "در حال بارگذاری…" : "تصویرها را اینجا رها کنید"}</strong><span>یا برای انتخاب چند تصویر کلیک کنید · حداکثر ۸ مگابایت</span></div>
        <span className="admin-button compact"><ImagePlus size={17} /> انتخاب تصویر</span>
      </label>
      <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(event) => event.target.files && void uploadFiles(event.target.files)} />
      {error ? <div className="editor-error" role="alert">{error}</div> : null}

      {items.length ? (
        <div className="media-grid">
          {items.map((item) => (
            <article className="media-card" key={item.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" />
              <div className="media-card-info">
                <strong title={item.name}>{item.name}</strong>
                <span>{item.size} · {item.modified}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(item.url);
                    setCopied(item.url);
                    window.setTimeout(() => setCopied(null), 1800);
                  }}
                >
                  {copied === item.url ? <Check size={15} /> : <Copy size={15} />}
                  {copied === item.url ? "کپی شد" : "کپی نشانی"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state media-empty"><div className="empty-state-mark"><ImagePlus size={27} /></div><h3>هنوز تصویری بارگذاری نشده است</h3><p>تصویرهای شاخص و داخل نوشته پس از بارگذاری اینجا نمایش داده می‌شوند.</p></div>
      )}
    </>
  );
}
