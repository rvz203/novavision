"use client";

import { AlignCenter, AlignJustify, AlignRight, Bold, Code2, ImagePlus, Italic, Link2, List, ListOrdered, LoaderCircle, Quote, Redo2, Table2, Underline, Undo2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createEditorTable, editTable, insertEditorBlock, resizeTableColumn, serializeEditor, setElementWidth, simpleTable, tableColumns, type ResizableElement } from "@/lib/rich-editor-dom";

type RichTextEditorProps = { value: string; onChange: (value: string) => void; language: string };

export default function RichTextEditor({ value, onChange, language }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const selectedRef = useRef<ResizableElement | null>(null);
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const historyRef = useRef({ entries: [value], index: 0 });
  const lastValueRef = useRef(value);
  const editorId = useId();
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [isUploading, setIsUploading] = useState(false);
  const [selected, setSelected] = useState<"image" | "table" | null>(null);
  const [width, setWidth] = useState(100);
  const [unit, setUnit] = useState<"%" | "px">("%");
  const [alt, setAlt] = useState("");
  const [column, setColumn] = useState(0);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [rowHeight, setRowHeight] = useState(0);
  const [editableColumns, setEditableColumns] = useState(true);
  const [alignment, setAlignment] = useState("center");
  const [showTableForm, setShowTableForm] = useState(false);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [headerRow, setHeaderRow] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const editor = editorRef.current;
    if (mode === "visual" && editor && serializeEditor(editor) !== value) {
      editor.innerHTML = value;
      selectedRef.current = null;
      cellRef.current = null;
      selectionRef.current = null;
    }
    if (lastValueRef.current !== value) {
      historyRef.current = { entries: [value], index: 0 };
      lastValueRef.current = value;
    }
  }, [mode, value]);

  function publish(html?: string) {
    const next = html ?? (editorRef.current ? serializeEditor(editorRef.current) : lastValueRef.current);
    const history = historyRef.current;
    if (history.entries[history.index] !== next) {
      history.entries = [...history.entries.slice(0, history.index + 1), next].slice(-100);
      history.index = history.entries.length - 1;
    }
    lastValueRef.current = next;
    onChange(next);
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode) && editorRef.current.contains(selection.focusNode)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    const range = selectionRef.current;
    if (range && editor.contains(range.commonAncestorContainer)) {
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      const end = document.createRange();
      end.selectNodeContents(editor);
      end.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(end);
    }
  }

  function clearSelected() {
    selectedRef.current?.removeAttribute("data-editor-selected");
    selectedRef.current = null;
    cellRef.current = null;
    setSelected(null);
  }

  function selectElement(element: ResizableElement, cell?: HTMLTableCellElement | null) {
    const changed = selectedRef.current !== element;
    selectedRef.current?.removeAttribute("data-editor-selected");
    selectedRef.current = element;
    element.setAttribute("data-editor-selected", "true");
    cellRef.current = cell ?? null;
    setSelected(element.tagName === "IMG" ? "image" : "table");
    if (changed) {
      const size = element.style.width || element.getAttribute("width") || "100%";
      setUnit(size.endsWith("%") ? "%" : "px");
      setWidth(Number.parseFloat(size) || 100);
      setAlignment(element.style.marginLeft === "0px" ? "left" : element.style.marginRight === "0px" ? "right" : "center");
      setAlt(element.tagName === "IMG" ? (element as HTMLImageElement).alt : "");
    }
    if (element.tagName === "TABLE") {
      setColumnWidths(tableColumns(element as HTMLTableElement));
      setEditableColumns(simpleTable(element as HTMLTableElement));
      setColumn(cell?.cellIndex ?? 0);
      setRowHeight(Number.parseInt(cell?.style.height || "0", 10));
    }
  }

  function inspectSelection() {
    rememberSelection();
    const node = window.getSelection()?.anchorNode;
    const element = node instanceof Element ? node : node?.parentElement;
    const cell = element?.closest<HTMLTableCellElement>("td, th");
    const table = cell?.closest("table");
    if (table && editorRef.current?.contains(table)) selectElement(table, cell);
  }

  function command(name: string, commandValue?: string) {
    restoreSelection();
    document.execCommand(name, false, commandValue);
    rememberSelection();
    publish();
  }

  function undoRedo(direction: -1 | 1) {
    const history = historyRef.current;
    const nextIndex = history.index + direction;
    if (nextIndex < 0 || nextIndex >= history.entries.length) return;
    clearSelected();
    history.index = nextIndex;
    const html = history.entries[nextIndex];
    lastValueRef.current = html;
    if (editorRef.current) editorRef.current.innerHTML = html;
    selectionRef.current = null;
    onChange(html);
    restoreSelection();
  }

  function insertNode(node: HTMLElement) {
    restoreSelection();
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const paragraph = insertEditorBlock(editor, range, node);
    range.selectNodeContents(paragraph);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    rememberSelection();
    publish();
  }

  function insertTable() {
    const wrapper = createEditorTable(document, rows, columns, headerRow);
    insertNode(wrapper);
    const table = wrapper.querySelector("table")!;
    selectElement(table, table.rows[0]?.cells[0]);
    setShowTableForm(false);
    setNotice("جدول اضافه شد. داخل خانه‌ها بنویسید؛ اندازه و ساختار آن را از ابزارهای زیر تغییر دهید.");
  }

  async function insertImage(file: File) {
    setIsUploading(true);
    setNotice("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "بارگذاری تصویر انجام نشد.");
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = result.url;
      image.alt = "";
      image.style.width = "100%";
      image.style.height = "auto";
      const caption = document.createElement("figcaption");
      caption.textContent = "توضیح تصویر";
      figure.append(image, caption);
      if (mode === "html") publish(`${lastValueRef.current}\n${figure.outerHTML}`);
      else { insertNode(figure); selectElement(image); }
      setNotice("تصویر اضافه شد. برای تغییر اندازه، روی تصویر کلیک کنید.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "بارگذاری تصویر انجام نشد.");
    } finally { setIsUploading(false); }
  }

  function resize(amount: number, nextUnit = unit) {
    const element = selectedRef.current;
    if (!element || !Number.isFinite(amount)) return;
    const bounded = Math.max(nextUnit === "%" ? 10 : 40, Math.min(nextUnit === "%" ? 100 : 2400, amount));
    setWidth(bounded);
    setUnit(nextUnit);
    setElementWidth(element, bounded, nextUnit);
    publish();
  }

  function tableAction(action: Parameters<typeof editTable>[2]) {
    const table = selectedRef.current;
    if (!table || table.tagName !== "TABLE") return;
    try {
      editTable(table as HTMLTableElement, cellRef.current, action);
      selectElement(table, (table as HTMLTableElement).rows[0]?.cells[0]);
      publish();
      setNotice("جدول به‌روزرسانی شد.");
    } catch (caught) { setNotice(caught instanceof Error ? caught.message : "تغییر جدول انجام نشد."); }
  }

  return (
    <div className="rich-editor">
      <div className="editor-mode-tabs" role="tablist" aria-label="نوع ویرایشگر">
        <button type="button" role="tab" aria-selected={mode === "visual"} className={mode === "visual" ? "active" : ""} onClick={() => { clearSelected(); setMode("visual"); }}>ویرایشگر دیداری</button>
        <button type="button" role="tab" aria-selected={mode === "html"} className={mode === "html" ? "active" : ""} onClick={() => { clearSelected(); setMode("html"); }}><Code2 size={15} /> کد HTML</button>
      </div>
      {mode === "visual" ? <>
        <div className="editor-toolbar" role="toolbar" aria-label="ابزارهای ویرایش متن" onMouseDown={(event) => { if ((event.target as Element).closest("button")) event.preventDefault(); }}>
          <select aria-label="نوع متن" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)}><option value="p">متن معمولی</option><option value="h2">عنوان ۲</option><option value="h3">عنوان ۳</option></select>
          <span className="toolbar-divider" />
          <button type="button" onClick={() => command("bold")} aria-label="پررنگ" title="پررنگ"><Bold size={17} /></button>
          <button type="button" onClick={() => command("italic")} aria-label="مورب" title="مورب"><Italic size={17} /></button>
          <button type="button" onClick={() => command("underline")} aria-label="زیرخط" title="زیرخط"><Underline size={17} /></button>
          <button type="button" onClick={() => command("formatBlock", "blockquote")} aria-label="نقل‌قول" title="نقل‌قول"><Quote size={17} /></button>
          <button type="button" onClick={() => command("insertUnorderedList")} aria-label="فهرست نقطه‌ای" title="فهرست نقطه‌ای"><List size={17} /></button>
          <button type="button" onClick={() => command("insertOrderedList")} aria-label="فهرست شماره‌ای" title="فهرست شماره‌ای"><ListOrdered size={17} /></button>
          <button type="button" onClick={() => command("justifyRight")} aria-label="راست‌چین" title="راست‌چین"><AlignRight size={17} /></button>
          <button type="button" onClick={() => command("justifyCenter")} aria-label="وسط‌چین" title="وسط‌چین"><AlignCenter size={17} /></button>
          <button type="button" onClick={() => command("justifyFull")} aria-label="تراز" title="تراز"><AlignJustify size={17} /></button>
          <span className="toolbar-divider" />
          <button type="button" onClick={() => { const href = window.prompt("نشانی پیوند را وارد کنید:", "https://"); if (href && /^(https?:\/\/|mailto:)/i.test(href)) command("createLink", href); }} aria-label="افزودن پیوند" title="افزودن پیوند"><Link2 size={17} /></button>
          <button type="button" className="editor-labelled-button" disabled={isUploading} onClick={() => { rememberSelection(); imageInputRef.current?.click(); }}>{isUploading ? <LoaderCircle className="spin" size={17} /> : <ImagePlus size={17} />} افزودن تصویر</button>
          <button type="button" className="editor-labelled-button" aria-expanded={showTableForm} aria-controls={`${editorId}-table-form`} onClick={() => { rememberSelection(); setShowTableForm(!showTableForm); }}><Table2 size={17} /> افزودن جدول</button>
          <span className="toolbar-spacer" />
          <button type="button" onClick={() => undoRedo(-1)} aria-label="بازگشت" title="بازگشت"><Undo2 size={17} /></button>
          <button type="button" onClick={() => undoRedo(1)} aria-label="انجام دوباره" title="انجام دوباره"><Redo2 size={17} /></button>
        </div>
        {showTableForm && <div className="editor-table-form" id={`${editorId}-table-form`}>
          <label>تعداد ردیف‌ها<input type="number" min={1} max={20} value={rows} onChange={(event) => setRows(Number(event.target.value))} /></label>
          <label>تعداد ستون‌ها<input type="number" min={1} max={10} value={columns} onChange={(event) => setColumns(Number(event.target.value))} /></label>
          <label className="editor-checkbox"><input type="checkbox" checked={headerRow} onChange={(event) => setHeaderRow(event.target.checked)} /> ردیف عنوان</label>
          <button type="button" className="editor-primary-button" onClick={insertTable}>درج جدول</button>
          <button type="button" onClick={() => setShowTableForm(false)}>انصراف</button>
        </div>}
        {selected && <section className="editor-size-panel" aria-label={selected === "image" ? "تنظیمات تصویر" : "تنظیمات جدول"}>
          <div className="editor-size-heading"><strong>{selected === "image" ? "تنظیمات تصویر" : "تنظیمات جدول"}</strong><button type="button" aria-label="بستن تنظیمات" onClick={clearSelected}><X size={16} /></button></div>
          <div className="editor-size-fields">
            <label>عرض<input type="number" min={unit === "%" ? 10 : 40} max={unit === "%" ? 100 : 2400} value={width} onChange={(event) => resize(Number(event.target.value))} /></label>
            <label>واحد<select value={unit} onChange={(event) => { const nextUnit = event.target.value as "%" | "px"; const element = selectedRef.current; if (!element) return; const parentWidth = element.parentElement?.clientWidth || 600; resize(Math.round(nextUnit === "%" ? element.getBoundingClientRect().width / parentWidth * 100 : element.getBoundingClientRect().width), nextUnit); }}><option value="%">درصد</option><option value="px">پیکسل</option></select></label>
            <label className="editor-size-slider">تغییر اندازه<input type="range" min={unit === "%" ? 10 : 40} max={unit === "%" ? 100 : 2400} step={unit === "%" ? 1 : 10} value={width} onChange={(event) => resize(Number(event.target.value))} /></label>
            <label>جای‌گذاری<select value={alignment} onChange={(event) => { const element = selectedRef.current; if (!element) return; setAlignment(event.target.value); element.style.marginLeft = event.target.value === "left" ? "0" : "auto"; element.style.marginRight = event.target.value === "right" ? "0" : "auto"; publish(); }}><option value="center">وسط</option><option value="left">چپ</option><option value="right">راست</option></select></label>
          </div>
          {selected === "image" ? <label className="editor-alt-field">توضیح تصویر (متن جایگزین)<input type="text" value={alt} onChange={(event) => { setAlt(event.target.value); const element = selectedRef.current as HTMLImageElement | null; if (element) { element.alt = event.target.value; publish(); } }} /></label> : <>
            <div className="editor-table-actions">
              <button type="button" onClick={() => tableAction("addRow")}>افزودن ردیف</button><button type="button" onClick={() => tableAction("deleteRow")}>حذف ردیف انتخابی</button>
              <button type="button" onClick={() => tableAction("addColumn")}>افزودن ستون</button><button type="button" onClick={() => tableAction("deleteColumn")}>حذف ستون انتخابی</button>
              <button type="button" onClick={() => tableAction("header")}>تغییر ردیف عنوان</button>
              <button type="button" onClick={() => { const table = selectedRef.current; if (!table) return; const paragraph = document.createElement("p"); paragraph.append(document.createElement("br")); (table.closest(".blog-table-scroll") || table).after(paragraph); clearSelected(); const range = document.createRange(); range.selectNodeContents(paragraph); range.collapse(true); selectionRef.current = range; restoreSelection(); publish(); }}>متن بعد از جدول</button>
            </div>
            <div className="editor-size-fields">
              <label>ستون<select value={column} onChange={(event) => setColumn(Number(event.target.value))}>{columnWidths.map((_, index) => <option key={index} value={index}>ستون {index + 1}</option>)}</select></label>
              <label>عرض ستون (درصد)<input type="number" min={5} max={100 - 5 * (columnWidths.length - 1)} value={Math.round(columnWidths[column] || 0)} disabled={columnWidths.length < 2 || !editableColumns} onChange={(event) => { const table = selectedRef.current as HTMLTableElement; resizeTableColumn(table, column, Number(event.target.value)); setColumnWidths(tableColumns(table)); publish(); }} /></label>
              <label>ارتفاع ردیف (پیکسل)<input type="number" min={0} max={2000} step={10} value={rowHeight} onChange={(event) => { const amount = Math.max(0, Math.min(2000, Number(event.target.value))); setRowHeight(amount); const row = cellRef.current?.parentElement as HTMLTableRowElement | null; if (row) { for (const cell of Array.from(row.cells)) cell.style.height = amount ? `${amount}px` : ""; publish(); } }} /></label>
            </div>
          </>}
          <p className="editor-size-hint">روی تصویر یا خانهٔ جدول کلیک کنید تا آن را انتخاب کنید. اندازه‌ها در پیش‌نمایش و نوشتهٔ منتشرشده حفظ می‌شوند.</p>
        </section>}
        <div ref={editorRef} className="contenteditable-area" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={`محتوای نوشته (${language})`} dir={language === "en" ? "ltr" : "rtl"} data-placeholder="محتوای نوشته را اینجا بنویسید…"
          onInput={() => { rememberSelection(); publish(); }} onBlur={rememberSelection} onKeyUp={inspectSelection}
          onClick={(event) => { const target = event.target as Element; const image = target.closest("img"); const cell = target.closest<HTMLTableCellElement>("td,th"); const table = target.closest("table"); rememberSelection(); if (image) selectElement(image); else if (table) selectElement(table, cell); else clearSelected(); }}
          onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "z" || event.key.toLowerCase() === "y")) { event.preventDefault(); undoRedo(event.key.toLowerCase() === "y" || event.shiftKey ? 1 : -1); } if (event.key === "Escape") clearSelected(); }} />
      </> : <textarea className="html-source-editor" value={value} onChange={(event) => publish(event.target.value)} dir="ltr" spellCheck={false} aria-label="کد HTML نوشته" />}
      <p className="editor-feedback" role="status" aria-live="polite">{notice || "برای تغییر اندازهٔ تصویر یا جدول، روی آن کلیک کنید."}</p>
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void insertImage(file); event.currentTarget.value = ""; }} />
    </div>
  );
}
