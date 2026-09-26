"use client";

import { ImagePlus, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useId, useState } from "react";

type ImageUploaderProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  compact?: boolean;
};

export default function ImageUploader({ value, onChange, label = "تصویر شاخص", compact = false }: ImageUploaderProps) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "بارگذاری تصویر انجام نشد.");
      onChange(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "بارگذاری تصویر انجام نشد.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className={`image-uploader ${compact ? "compact" : ""}`}>
      <div className="settings-label"><ImagePlus size={16} /> {label}</div>
      {value ? (
        <div className="uploaded-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="پیش‌نمایش تصویر بارگذاری‌شده" />
          <div className="uploaded-image-actions">
            <label htmlFor={inputId} className="subtle-button"><UploadCloud size={16} /> جایگزینی</label>
            <button type="button" className="subtle-button danger-text" onClick={() => onChange("")}><Trash2 size={16} /> حذف</button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="upload-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) void upload(file);
          }}
        >
          {isUploading ? <LoaderCircle className="spin" size={24} /> : <UploadCloud size={24} />}
          <strong>{isUploading ? "در حال بارگذاری…" : "بارگذاری تصویر"}</strong>
          <span>JPG، PNG یا WebP تا ۸ مگابایت</span>
        </label>
      )}
      <input
        className="admin-input image-url-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="یا نشانی تصویر را وارد کنید"
        dir="ltr"
        aria-label="نشانی تصویر"
      />
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.currentTarget.value = "";
        }}
      />
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </div>
  );
}
