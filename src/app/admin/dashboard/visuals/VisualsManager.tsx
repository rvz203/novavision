"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, EyeOff, GripVertical, LoaderCircle, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import ImageUploader from "@/app/admin/dashboard/ImageUploader";
import { createSiteVisual, deleteSiteVisual, updateSiteVisual, VisualAdminItem } from "@/app/actions/visuals";
import { VISUAL_MOTIONS, VISUAL_SECTIONS, VisualMotion, VisualSection } from "@/lib/site-visual-types";

const sectionLabels: Record<VisualSection, string> = {
  "home.board": "تابلوی صفحه خانه",
  "about.feature": "تصویر درباره ما",
  "insights.hero": "سربرگ دیدگاه‌ها",
};

const motionLabels: Record<VisualMotion, string> = {
  reveal: "نمایش نرم",
  float: "شناور",
  drift: "حرکت آرام",
  zoom: "بزرگ‌نمایی سینمایی",
  static: "بدون حرکت",
};

type EditableKey = Exclude<keyof VisualAdminItem, "id">;

export default function VisualsManager({ initialItems }: { initialItems: VisualAdminItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [section, setSection] = useState<VisualSection>("home.board");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const visibleItems = useMemo(() => items.filter((item) => item.section === section).sort((a, b) => a.sortOrder - b.sortOrder), [items, section]);

  function setField<K extends EditableKey>(id: string, key: K, value: VisualAdminItem[K]) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
  }

  function run(action: () => Promise<void>) {
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        await action();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "انجام عملیات ممکن نشد.");
      }
    });
  }

  function addVisual() {
    run(async () => {
      const item = await createSiteVisual(section);
      setItems((current) => [...current, item]);
      setNotice("تصویر تازه ایجاد شد؛ تصویر را بارگذاری و سپس ذخیره کنید.");
    });
  }

  function saveVisual(item: VisualAdminItem) {
    run(async () => {
      const { id, ...input } = item;
      const saved = await updateSiteVisual(id, input);
      setItems((current) => current.map((candidate) => candidate.id === id ? saved : candidate));
      setNotice("تغییرات تصویر ذخیره شد.");
    });
  }

  function removeVisual(item: VisualAdminItem) {
    if (!window.confirm("این تصویر از بخش انتخاب‌شده حذف شود؟")) return;
    run(async () => {
      await deleteSiteVisual(item.id);
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      setNotice("تصویر حذف شد.");
    });
  }

  return (
    <div className="visuals-manager">
      <div className="visual-section-tabs" role="tablist" aria-label="بخش تصویری سایت">
        {VISUAL_SECTIONS.map((value) => (
          <button key={value} type="button" role="tab" aria-selected={section === value} className={section === value ? "active" : ""} onClick={() => setSection(value)}>
            {sectionLabels[value]}
            <span>{items.filter((item) => item.section === value).length.toLocaleString("fa-IR")}</span>
          </button>
        ))}
      </div>

      <div className="visuals-toolbar">
        <div><Sparkles size={19} /><span>{sectionLabels[section]}</span></div>
        <button type="button" className="admin-button compact" onClick={addVisual} disabled={isPending}><Plus size={17} /> افزودن تصویر</button>
      </div>

      {notice ? <p className="visual-notice" role="status">{notice}</p> : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}

      <div className="visual-card-list">
        {visibleItems.map((item, index) => (
          <article className={`visual-editor-card ${item.active ? "is-active" : ""}`} key={item.id}>
            <header>
              <div><GripVertical size={18} /><strong>تصویر {String(index + 1).padStart(2, "0")}</strong><span>{item.source}</span></div>
              <button type="button" className={`visual-status-toggle ${item.active ? "active" : ""}`} onClick={() => setField(item.id, "active", !item.active)}>
                {item.active ? <Eye size={16} /> : <EyeOff size={16} />}{item.active ? "نمایش در سایت" : "پنهان"}
              </button>
            </header>

            <div className="visual-editor-grid">
              <ImageUploader value={item.imageUrl} onChange={(value) => setField(item.id, "imageUrl", value)} label="تصویر اصلی" compact />
              <div className="visual-settings">
                <label><span>بخش نمایش</span><select className="admin-input" value={item.section} onChange={(event) => setField(item.id, "section", event.target.value as VisualSection)}>{VISUAL_SECTIONS.map((value) => <option key={value} value={value}>{sectionLabels[value]}</option>)}</select></label>
                <label><span>نوع حرکت</span><select className="admin-input" value={item.motion} onChange={(event) => setField(item.id, "motion", event.target.value as VisualMotion)}>{VISUAL_MOTIONS.map((value) => <option key={value} value={value}>{motionLabels[value]}</option>)}</select></label>
                <label><span>ترتیب نمایش</span><input className="admin-input" type="number" min="0" max="999" value={item.sortOrder} onChange={(event) => setField(item.id, "sortOrder", Number(event.target.value))} /></label>
              </div>
            </div>

            <div className="visual-language-grid">
              <fieldset dir="ltr"><legend>English</legend><label><span>Caption</span><input className="admin-input" value={item.captionEn} onChange={(event) => setField(item.id, "captionEn", event.target.value)} /></label><label><span>Image description (alt)</span><input className="admin-input" value={item.altEn} onChange={(event) => setField(item.id, "altEn", event.target.value)} /></label></fieldset>
              <fieldset dir="rtl"><legend>فارسی</legend><label><span>عنوان روی تصویر</span><input className="admin-input" value={item.captionFa} onChange={(event) => setField(item.id, "captionFa", event.target.value)} /></label><label><span>توضیح دسترس‌پذیری</span><input className="admin-input" value={item.altFa} onChange={(event) => setField(item.id, "altFa", event.target.value)} /></label></fieldset>
              <fieldset dir="rtl"><legend>العربية</legend><label><span>العنوان على الصورة</span><input className="admin-input" value={item.captionAr} onChange={(event) => setField(item.id, "captionAr", event.target.value)} /></label><label><span>وصف الصورة</span><input className="admin-input" value={item.altAr} onChange={(event) => setField(item.id, "altAr", event.target.value)} /></label></fieldset>
            </div>

            <footer>
              <button type="button" className="subtle-button danger-text" onClick={() => removeVisual(item)} disabled={isPending}><Trash2 size={16} /> حذف تصویر</button>
              <button type="button" className="admin-button compact" onClick={() => saveVisual(item)} disabled={isPending}>{isPending ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} ذخیره تغییرات</button>
            </footer>
          </article>
        ))}
        {!visibleItems.length ? <div className="visual-empty"><Sparkles size={30} /><strong>هنوز تصویری در این بخش نیست.</strong><span>با دکمه «افزودن تصویر» نخستین مورد را بسازید.</span></div> : null}
      </div>
    </div>
  );
}
