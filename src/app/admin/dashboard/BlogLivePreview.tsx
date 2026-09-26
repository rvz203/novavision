"use client";

import { Monitor, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import { sanitizePostHtml } from "@/lib/blog-html";
import { EditorLanguage, EditorPost, LANGUAGE_META } from "./editor-data";

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] || character);
}

function previewDocument(post: EditorPost) {
  const dir = post.language === "en" ? "ltr" : "rtl";
  const locale = post.language === "fa" ? "fa-IR" : post.language === "ar" ? "ar-SA" : "en-US";
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date());
  const safeTitle = escapeHtml(post.title || "عنوان نوشته شما");
  const safeExcerpt = escapeHtml(post.excerpt || "خلاصه کوتاه نوشته در این قسمت نمایش داده می‌شود.");
  const safeAuthor = escapeHtml(post.author || "تیم NovaVison");
  const safeCategory = escapeHtml(post.category || "وبلاگ NovaVison");
  const cover = post.coverImage ? `<img class="cover" src="${escapeHtml(post.coverImage)}" alt="" />` : `<div class="cover placeholder"><span>N</span><small>تصویر شاخص نوشته</small></div>`;
  const content = post.content ? sanitizePostHtml(post.content) : `<h2>محتوای نوشته</h2><p>هنگام نوشتن، نتیجه نهایی مقاله به‌صورت زنده در این قسمت نمایش داده می‌شود.</p>`;
  const templateClass = `template-${post.template}`;

  return `<!doctype html><html lang="${post.language}" dir="${dir}"><head><meta charset="utf-8"><base href="/"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    .content .blog-table-scroll{max-width:100%;overflow-x:auto;margin:24px 0}.content .blog-table-scroll table{margin-top:0;margin-bottom:0;max-width:100%}.content th,.content td{overflow-wrap:anywhere;vertical-align:top}.content figure img{box-sizing:border-box}.content table img{margin:8px auto}
    *{box-sizing:border-box}body{margin:0;background:#fff;color:#0b2943;font-family:Vazirmatn,Tahoma,Arial,sans-serif;line-height:1.9}.site-header{height:70px;border-bottom:1px solid #e3eaf0;display:flex;align-items:center;justify-content:space-between;padding:0 6%;position:sticky;top:0;background:rgba(255,255,255,.94);z-index:2}.logo{font-weight:900;font-size:21px;color:#092d50}.logo b{display:inline-grid;place-items:center;background:#008b78;color:#fff;border-radius:10px;width:34px;height:34px;margin-inline-end:8px}.site-nav{display:flex;gap:24px;font-size:13px;color:#50677a}.article{max-width:800px;margin:0 auto;padding:42px 30px 80px}.crumbs{font-size:12px;color:#718697;margin-bottom:26px}.cover{display:block;width:100%;aspect-ratio:16/8.2;object-fit:cover;border-radius:20px;margin-bottom:30px}.cover.placeholder{background:linear-gradient(145deg,#eaf5f2,#edf2f6);display:grid;place-content:center;text-align:center;color:#008b78}.cover.placeholder span{font-size:54px;font-weight:900;line-height:1}.cover.placeholder small{color:#6b8192}.category{display:inline-block;color:#007e6d;font-size:12px;font-weight:700;margin-bottom:9px}.article h1{font-size:clamp(27px,4vw,44px);line-height:1.35;margin:0 0 15px;letter-spacing:-.025em}.meta{font-size:12px;color:#718697;display:flex;gap:15px;flex-wrap:wrap;padding-bottom:26px;border-bottom:1px solid #e3eaf0}.lead{background:#f4f8f7;border-inline-start:4px solid #008b78;padding:18px 20px;border-radius:12px;margin:26px 0;color:#344f61}.content{font-size:17px;color:#203d52}.content h2{font-size:26px;margin:42px 0 12px;color:#092d50}.content h3{font-size:21px;margin:32px 0 10px}.content p{margin:0 0 20px}.content ul,.content ol{padding-inline-start:26px;margin:0 0 22px}.content li{margin:7px 0}.content blockquote{margin:30px 0;padding:18px 24px;border-inline-start:4px solid #008b78;background:#f5f8fa;border-radius:10px;color:#476174}.content img{max-width:100%;height:auto;border-radius:16px;display:block;margin:24px auto}.content figure{margin:28px 0}.content figcaption{text-align:center;color:#7c8e9c;font-size:12px}.content table{width:100%;border-collapse:collapse;margin:24px 0;font-size:14px}.content th,.content td{padding:12px;border:1px solid #dfe7ed;text-align:start}.content th{background:#f2f7f6}.template-news .article h1{font-size:38px}.template-guide .content h2{counter-increment:step}.template-guide .content{counter-reset:step}.template-guide .content h2:before{content:counter(step);display:inline-grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#008b78;color:#fff;font-size:14px;margin-inline-end:8px}@media(max-width:600px){.site-nav{display:none}.article{padding:24px 18px 60px}.article h1{font-size:28px}.content{font-size:15px}.cover{border-radius:14px}}
  </style></head><body><header class="site-header"><div class="logo"><b>N</b>NovaVison</div><nav class="site-nav"><span>خانه</span><span>تحلیل بازار</span><span>آموزش</span><span>درباره ما</span></nav></header><main class="article ${templateClass}"><div class="crumbs">خانه &nbsp; / &nbsp; وبلاگ &nbsp; / &nbsp; ${safeCategory}</div>${cover}<span class="category">${safeCategory}</span><h1>${safeTitle}</h1><div class="meta"><span>${safeAuthor}</span><span>${date}</span><span>${Math.max(1, Math.ceil((post.content.replace(/<[^>]*>/g, "").length || 250) / 900)).toLocaleString(locale)} دقیقه مطالعه</span></div><p class="lead">${safeExcerpt}</p><article class="content">${content}</article></main></body></html>`;
}

export default function BlogLivePreview({ post, previewLanguage, onLanguageChange }: { post: EditorPost; previewLanguage?: EditorLanguage; onLanguageChange?: (language: EditorLanguage) => void }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const document = useMemo(() => previewDocument(post), [post]);

  return (
    <section className="live-preview-panel">
      <header className="live-preview-header">
        <div><span className="live-dot" /> <strong>پیش‌نمایش زنده</strong></div>
        {previewLanguage && onLanguageChange ? <div className="preview-language-tabs">{(["fa", "en", "ar"] as EditorLanguage[]).map((language) => <button type="button" key={language} className={previewLanguage === language ? "active" : ""} onClick={() => onLanguageChange(language)}>{LANGUAGE_META[language].label}</button>)}</div> : null}
        <div className="device-toggle" aria-label="اندازه پیش‌نمایش">
          <button type="button" className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} aria-label="پیش‌نمایش دسکتاپ"><Monitor size={17} /></button>
          <button type="button" className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} aria-label="پیش‌نمایش موبایل"><Smartphone size={17} /></button>
        </div>
      </header>
      <div className={`preview-stage ${device}`}>
        <iframe title="پیش‌نمایش زنده نوشته" srcDoc={document} sandbox="" />
      </div>
    </section>
  );
}
