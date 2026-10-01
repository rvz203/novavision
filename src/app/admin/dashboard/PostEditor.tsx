"use client";

import { createPost, updatePost } from "@/app/actions/blog";
import { ArrowRight, Check, FileText, Globe2, LoaderCircle, Save, Send, Settings2, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { EDITOR_LANGUAGES, EditorLanguage, EditorPost, EditorTranslation, LANGUAGE_META, makeSlug, MultilingualEditorPost, POST_TEMPLATES } from "./editor-data";
import ImageUploader from "./ImageUploader";
import SeoPreviewPanel from "./SeoPreviewPanel";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false });
const BlogLivePreview = dynamic(() => import("./BlogLivePreview"), { ssr: false });

export default function PostEditor({ initialPost }: { initialPost: MultilingualEditorPost }) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [previewLanguage, setPreviewLanguage] = useState<EditorLanguage>("fa");
  const [slugTouched, setSlugTouched] = useState<Record<EditorLanguage, boolean>>({ fa: Boolean(initialPost.translations.fa.slug), en: Boolean(initialPost.translations.en.slug), ar: Boolean(initialPost.translations.ar.slug) });
  const [error, setError] = useState("");
  const [lastAction, setLastAction] = useState<"draft" | "publish" | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredPost = useDeferredValue(post);

  const completion = useMemo(() => Object.fromEntries(EDITOR_LANGUAGES.map((lang) => {
    const item = post.translations[lang];
    return [lang, Boolean(item.title.trim() && item.slug.trim() && item.content.trim())];
  })) as Record<EditorLanguage, boolean>, [post.translations]);

  function updateShared<K extends keyof MultilingualEditorPost>(key: K, value: MultilingualEditorPost[K]) { setPost((current) => ({ ...current, [key]: value })); }
  function updateTranslation<K extends keyof EditorTranslation>(language: EditorLanguage, key: K, value: EditorTranslation[K]) {
    setPost((current) => ({ ...current, translations: { ...current.translations, [language]: { ...current.translations[language], [key]: value } } }));
  }
  function applyTemplate(templateId: MultilingualEditorPost["template"]) {
    const template = POST_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    if (EDITOR_LANGUAGES.some((lang) => post.translations[lang].content) && !window.confirm("محتوای هر سه زبان با ساختار این الگو جایگزین شود؟")) return;
    setPost((current) => ({ ...current, template: template.id, translations: Object.fromEntries(EDITOR_LANGUAGES.map((lang) => [lang, { ...current.translations[lang], content: template.content[lang], category: current.translations[lang].category || template.categories[lang], contentFormat: "html" }])) as Record<EditorLanguage, EditorTranslation> }));
  }
  function save(published: boolean) {
    setError(""); setLastAction(published ? "publish" : "draft");
    const completed = EDITOR_LANGUAGES.filter((lang) => completion[lang]);
    if (!completed.length) { setError("حداقل عنوان، پیوند یکتا و محتوای یکی از زبان‌ها را کامل کنید."); return; }
    if (published && completed.length !== 3) { setError("برای انتشار هم‌زمان، هر سه زبان فارسی، انگلیسی و عربی را کامل کنید."); return; }
    startTransition(async () => {
      try {
        const payload = { template: post.template, coverImage: post.coverImage, featured: post.featured, published, translations: post.translations };
        if (post.id) await updatePost(post.id, payload); else await createPost(payload);
        router.push("/admin/dashboard"); router.refresh();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "ذخیره نوشته انجام نشد."); }
    });
  }

  const previewPost: EditorPost = { ...deferredPost.translations[previewLanguage], template: deferredPost.template, coverImage: deferredPost.coverImage, featured: deferredPost.featured, published: deferredPost.published, language: previewLanguage };

  return <div className="post-editor-page multilingual-editor-page">
    <header className="editor-topbar"><div className="editor-title-row"><Link href="/admin/dashboard" className="back-button" aria-label="بازگشت"><ArrowRight size={19} /></Link><div><h1>{post.id ? "ویرایش نوشته سه‌زبانه" : "نوشته سه‌زبانه جدید"}</h1><span className="save-state"><Globe2 size={14} /> یک نوشته، سه ترجمه، یک انتشار هماهنگ</span></div></div><div className="editor-actions"><button type="button" className="admin-button secondary compact" onClick={() => save(false)} disabled={isPending}>{isPending && lastAction === "draft" ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} ذخیره پیش‌نویس</button><button type="button" className="admin-button compact" onClick={() => save(true)} disabled={isPending}>{isPending && lastAction === "publish" ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} انتشار هر سه زبان</button></div></header>
    <div className="translation-progress">{EDITOR_LANGUAGES.map((lang) => <div key={lang} className={completion[lang] ? "complete" : ""}><span>{completion[lang] ? <Check size={14} /> : LANGUAGE_META[lang].short}</span><div><strong>{LANGUAGE_META[lang].label}</strong><small>{completion[lang] ? "آماده انتشار" : "در حال تکمیل"}</small></div></div>)}</div>
    {error ? <div className="editor-error" role="alert">{error}</div> : null}
    <div className="editor-workspace"><section className="post-editor-panel">
      <div className="template-section"><div className="section-heading-inline"><div><Sparkles size={18} /><strong>الگوی نوشته</strong></div><span>هر الگو ساختار مناسب را هم‌زمان در سه زبان می‌سازد.</span></div><div className="template-grid">{POST_TEMPLATES.map((template) => <button type="button" key={template.id} className={`template-option ${post.template === template.id ? "active" : ""}`} onClick={() => applyTemplate(template.id)}><FileText size={20} /><span><strong>{template.name}</strong><small>{template.description}</small></span>{post.template === template.id ? <Check size={16} className="template-check" /> : null}</button>)}</div></div>

      <div className="multilingual-fields">
        <TranslationSection title="عنوان نوشته" hint="عنوان واضح و متناسب با هر زبان">{(lang) => <input dir={LANGUAGE_META[lang].dir} value={post.translations[lang].title} maxLength={160} onChange={(e) => { const title = e.target.value; updateTranslation(lang, "title", title); if (!slugTouched[lang]) updateTranslation(lang, "slug", makeSlug(title)); }} className="admin-input title-input" placeholder={lang === "fa" ? "عنوان فارسی" : lang === "en" ? "English title" : "العنوان بالعربية"} />}</TranslationSection>
        <TranslationSection title="پیوند یکتا" hint="نشانی مستقل برای نسخه هر زبان">{(lang) => <div className="slug-field" dir="ltr"><span>/{lang}/blog/</span><input value={post.translations[lang].slug} onChange={(e) => { setSlugTouched((current) => ({ ...current, [lang]: true })); updateTranslation(lang, "slug", makeSlug(e.target.value)); }} placeholder={`${lang}-article-slug`} /></div>}</TranslationSection>
        <TranslationSection title="خلاصه" hint="معرفی کوتاه برای فهرست وبلاگ و پیش‌نمایش">{(lang) => <textarea dir={LANGUAGE_META[lang].dir} value={post.translations[lang].excerpt} maxLength={500} onChange={(e) => updateTranslation(lang, "excerpt", e.target.value)} className="admin-input" rows={4} />}</TranslationSection>

        <section className="translation-section content-translation-section"><div className="translation-section-heading"><div><strong>محتوای مقاله</strong><span>ویرایشگر دیداری و HTML برای هر ترجمه</span></div></div><div className="content-language-stack">{EDITOR_LANGUAGES.map((lang) => <div className={`translation-content-card lang-card-${lang}`} key={lang}><LanguageCardHeader language={lang} complete={completion[lang]} /><RichTextEditor value={post.translations[lang].content} onChange={(value) => updateTranslation(lang, "content", value)} language={lang} /></div>)}</div></section>

        <TranslationSection title="دسته‌بندی" hint="نام دسته در هر زبان">{(lang) => <input dir={LANGUAGE_META[lang].dir} value={post.translations[lang].category} onChange={(e) => updateTranslation(lang, "category", e.target.value)} className="admin-input" />}</TranslationSection>
        <TranslationSection title="برچسب‌ها" hint="برچسب‌ها را با ویرگول جدا کنید">{(lang) => <input dir={LANGUAGE_META[lang].dir} value={post.translations[lang].tags.join(", ")} onChange={(e) => updateTranslation(lang, "tags", e.target.value.split(/[,،]/).map((tag) => tag.trim()).filter(Boolean))} className="admin-input" />}</TranslationSection>
        <TranslationSection title="نویسنده" hint="نام نمایشی نویسنده در هر زبان">{(lang) => <input dir={LANGUAGE_META[lang].dir} value={post.translations[lang].author} onChange={(e) => updateTranslation(lang, "author", e.target.value)} className="admin-input" />}</TranslationSection>
        <TranslationSection title="عنوان سئو" hint="حداکثر ۷۰ نویسه">{(lang) => <input dir={LANGUAGE_META[lang].dir} value={post.translations[lang].seoTitle} maxLength={70} onChange={(e) => updateTranslation(lang, "seoTitle", e.target.value)} className="admin-input" />}</TranslationSection>
        <TranslationSection title="توضیحات سئو" hint="حداکثر ۱۸۰ نویسه">{(lang) => <textarea dir={LANGUAGE_META[lang].dir} value={post.translations[lang].seoDescription} maxLength={180} onChange={(e) => updateTranslation(lang, "seoDescription", e.target.value)} className="admin-input" rows={3} />}</TranslationSection>
      </div>
      <SeoPreviewPanel translations={post.translations} coverImage={post.coverImage} />
      <aside className="shared-post-settings"><div className="settings-heading"><Settings2 size={18} /> تنظیمات مشترک هر سه زبان</div><ImageUploader value={post.coverImage} onChange={(value) => updateShared("coverImage", value)} compact /><label className="toggle-field"><input type="checkbox" checked={post.featured} onChange={(e) => updateShared("featured", e.target.checked)} /><span className="toggle-control" /><span><strong>نوشته ویژه</strong><small>در فهرست هر سه زبان برجسته می‌شود</small></span></label></aside>
    </section><BlogLivePreview post={previewPost} previewLanguage={previewLanguage} onLanguageChange={setPreviewLanguage} /></div>
  </div>;
}

function LanguageCardHeader({ language, complete }: { language: EditorLanguage; complete?: boolean }) { return <div className="translation-card-label"><span>{LANGUAGE_META[language].short}</span><strong>{LANGUAGE_META[language].label}</strong>{complete ? <Check size={14} /> : null}</div>; }

function TranslationSection({ title, hint, children }: { title: string; hint: string; children: (language: EditorLanguage) => React.ReactNode }) {
  return <section className="translation-section"><div className="translation-section-heading"><div><strong>{title}</strong><span>{hint}</span></div></div><div className="translation-box-grid">{EDITOR_LANGUAGES.map((lang) => <label className={`translation-box lang-card-${lang}`} key={lang}><LanguageCardHeader language={lang} />{children(lang)}</label>)}</div></section>;
}
