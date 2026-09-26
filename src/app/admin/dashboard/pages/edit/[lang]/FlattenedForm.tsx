"use client";

import { updateDictionary } from "@/app/actions/pages";
import { ArrowRight, Check, ExternalLink, LoaderCircle, Monitor, Save } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

function flattenObject(value: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    const path = `${prefix}${key}`;
    if (item && typeof item === "object" && !Array.isArray(item)) Object.assign(result, flattenObject(item as Record<string, unknown>, `${path}.`));
    else result[path] = String(item ?? "");
  }
  return result;
}

function words(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").trim();
}

const groupNames: Record<string, string> = {
  home: "صفحه خانه",
  about: "درباره ما",
  contact: "تماس با ما",
  header: "سربرگ سایت",
  nav: "منوی سایت",
  footer: "پابرگ سایت",
  common: "متن‌های مشترک",
};

const groupRoutes: Record<string, string> = { home: "", about: "/about", contact: "/contact" };

export default function FlattenedForm({ lang, languageName, content }: { lang: string; languageName: string; content: Record<string, unknown> }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const original = useMemo(() => flattenObject(content), [content]);
  const [values, setValues] = useState(original);
  const grouped = useMemo(() => {
    const result: Record<string, Record<string, string>> = {};
    for (const [key, value] of Object.entries(values)) {
      const group = key.split(".")[0];
      result[group] ||= {};
      result[group][key] = value;
    }
    return result;
  }, [values]);
  const groups = Object.keys(grouped);
  const [selectedGroup, setSelectedGroup] = useState(groups[0] || "home");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const previewGroup = groupRoutes[selectedGroup] !== undefined ? selectedGroup : "home";
  const previewUrl = `/${lang}${groupRoutes[previewGroup] || ""}`;

  const patchPreview = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    const elements = Array.from(doc.body.querySelectorAll("h1,h2,h3,h4,p,a,button,span,label,li"));
    for (const element of elements) {
      const current = element.textContent?.trim();
      if (!current) continue;
      const match = Object.entries(original).find(([, originalValue]) => originalValue.trim() === current);
      if (match && values[match[0]] !== undefined) element.textContent = values[match[0]];
    }
  }, [original, values]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(patchPreview);
    return () => window.cancelAnimationFrame(frame);
  }, [patchPreview]);

  function submit() {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value));
    startTransition(async () => {
      await updateDictionary(lang, formData);
      setSaved(true);
      iframeRef.current?.contentWindow?.location.reload();
      window.setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="page-editor-page">
      <header className="editor-topbar">
        <div className="editor-title-row">
          <Link href="/admin/dashboard/pages" className="back-button"><ArrowRight size={19} /></Link>
          <div><h1>ویرایش برگه‌ها · {languageName}</h1><span className="save-state"><Check size={14} /> پیش‌نمایش هنگام تایپ به‌روز می‌شود</span></div>
        </div>
        <div className="editor-actions">
          <a href={`/${lang}`} target="_blank" rel="noreferrer" className="admin-button secondary compact"><ExternalLink size={17} /> باز کردن سایت</a>
          <button type="button" className="admin-button compact" onClick={submit} disabled={isPending}>
            {isPending ? <LoaderCircle className="spin" size={17} /> : saved ? <Check size={17} /> : <Save size={17} />}
            {saved ? "ذخیره شد" : "ذخیره تغییرات"}
          </button>
        </div>
      </header>

      <div className="page-editor-workspace">
        <section className="dictionary-editor">
          <div className="dictionary-tabs">
            {groups.map((group) => (
              <button type="button" key={group} className={selectedGroup === group ? "active" : ""} onClick={() => setSelectedGroup(group)}>{groupNames[group] || words(group)}</button>
            ))}
          </div>
          <div className="dictionary-fields">
            <div className="dictionary-section-heading"><strong>{groupNames[selectedGroup] || words(selectedGroup)}</strong><span>{Object.keys(grouped[selectedGroup] || {}).length.toLocaleString("fa-IR")} فیلد متنی</span></div>
            {Object.entries(grouped[selectedGroup] || {}).map(([key, value]) => {
              const label = key.split(".").slice(1).map(words).join(" · ");
              const multiline = value.length > 70;
              return (
                <label className="form-field" key={key}>
                  <span>{label}</span>
                  {multiline ? (
                    <textarea className="admin-input" rows={3} value={value} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} />
                  ) : (
                    <input className="admin-input" value={value} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} />
                  )}
                </label>
              );
            })}
          </div>
        </section>

        <section className="site-preview-panel">
          <header className="live-preview-header">
            <div><span className="live-dot" /> <strong>پیش‌نمایش زنده سایت</strong></div>
            <div className="preview-route-tabs">
              {Object.entries(groupRoutes).map(([group]) => groups.includes(group) ? (
                <button type="button" key={group} className={previewGroup === group ? "active" : ""} onClick={() => setSelectedGroup(group)}>{groupNames[group]}</button>
              ) : null)}
              <Monitor size={17} />
            </div>
          </header>
          <iframe ref={iframeRef} key={previewUrl} src={previewUrl} title="پیش‌نمایش زنده سایت" onLoad={patchPreview} />
        </section>
      </div>
    </div>
  );
}
