export type ResizableElement = HTMLImageElement | HTMLTableElement;

export function insertEditorBlock(editor: HTMLElement, range: Range, node: HTMLElement) {
  const doc = editor.ownerDocument;
  const parent = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer as Element : range.commonAncestorContainer.parentElement;
  const surrounding = parent?.closest("table,figure");
  const paragraph = doc.createElement("p");
  if (surrounding && editor.contains(surrounding)) {
    (surrounding.closest(".blog-table-scroll") || surrounding).after(node, paragraph);
  } else {
    range.deleteContents();
    const block = parent?.closest("p,h1,h2,h3,h4,h5,h6");
    if (block && editor.contains(block)) {
      const tail = doc.createRange();
      tail.setStart(range.startContainer, range.startOffset);
      tail.setEnd(block, block.childNodes.length);
      paragraph.append(tail.extractContents());
      block.after(node, paragraph);
      if (!block.hasChildNodes()) block.append(doc.createElement("br"));
    } else {
      range.insertNode(node);
      node.after(paragraph);
    }
  }
  if (!paragraph.hasChildNodes()) paragraph.append(doc.createElement("br"));
  return paragraph;
}

export function serializeEditor(editor: HTMLElement) {
  const copy = editor.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("[data-editor-selected]").forEach((element) => element.removeAttribute("data-editor-selected"));
  return copy.innerHTML;
}

export function createEditorTable(doc: Document, rowCount: number, columnCount: number, header: boolean) {
  const rows = Math.max(1, Math.min(20, Math.round(rowCount) || 1));
  const columns = Math.max(1, Math.min(10, Math.round(columnCount) || 1));
  const table = doc.createElement("table");
  table.style.width = "100%";
  table.style.tableLayout = "fixed";
  const body = table.createTBody();
  for (let row = 0; row < rows; row++) {
    const tr = body.insertRow();
    for (let col = 0; col < columns; col++) {
      const cell = doc.createElement(header && row === 0 ? "th" : "td");
      if (cell.tagName === "TH") cell.setAttribute("scope", "col");
      cell.append(doc.createElement("br"));
      tr.append(cell);
    }
  }
  setTableColumns(table, Array(columns).fill(100 / columns));
  const wrapper = doc.createElement("div");
  wrapper.className = "blog-table-scroll";
  wrapper.append(table);
  return wrapper;
}

export function simpleTable(table: HTMLTableElement) {
  const width = table.rows[0]?.cells.length || 0;
  return width > 0 && Array.from(table.rows).every((row) => row.cells.length === width && Array.from(row.cells).every((cell) => cell.colSpan === 1 && cell.rowSpan === 1));
}

export function tableColumns(table: HTMLTableElement) {
  const count = table.rows[0]?.cells.length || 1;
  const columns = Array.from(table.querySelectorAll(":scope > colgroup > col"));
  return Array.from({ length: count }, (_, index) => {
    const value = parseFloat((columns[index] as HTMLElement | undefined)?.style.width || "");
    return Number.isFinite(value) && value > 0 ? value : 100 / count;
  });
}

export function setTableColumns(table: HTMLTableElement, widths: number[]) {
  let group = table.querySelector<HTMLTableColElement>(":scope > colgroup");
  if (!group) {
    group = table.ownerDocument.createElement("colgroup");
    const caption = table.querySelector(":scope > caption");
    if (caption) caption.after(group); else table.prepend(group);
  }
  group.replaceChildren(...widths.map((width) => {
    const col = table.ownerDocument.createElement("col");
    col.style.width = `${Math.round(width * 100) / 100}%`;
    return col;
  }));
  table.style.tableLayout = "fixed";
}

export function resizeTableColumn(table: HTMLTableElement, index: number, value: number) {
  const widths = tableColumns(table);
  if (widths.length < 2 || index < 0 || index >= widths.length || !Number.isFinite(value)) return;
  const target = Math.max(5, Math.min(100 - 5 * (widths.length - 1), value));
  const remainder = widths.reduce((sum, width, column) => column === index ? sum : sum + width, 0);
  const next = widths.map((width, column) => column === index ? target : (100 - target) * width / remainder);
  setTableColumns(table, next);
}

export function editTable(table: HTMLTableElement, cell: HTMLTableCellElement | null, action: "addRow" | "deleteRow" | "addColumn" | "deleteColumn" | "header") {
  if (!simpleTable(table)) throw new Error("این جدول سلول ادغام‌شده دارد. ابتدا در کد HTML ادغام را باز کنید تا ساختار جدول حفظ شود.");
  const row = cell?.parentElement as HTMLTableRowElement | null;
  const rowIndex = row?.rowIndex ?? table.rows.length - 1;
  const columnIndex = cell?.cellIndex ?? table.rows[0].cells.length - 1;
  const doc = table.ownerDocument;
  const newCell = (header = false) => {
    const element = doc.createElement(header ? "th" : "td");
    if (header) element.setAttribute("scope", "col");
    element.append(doc.createElement("br"));
    return element;
  };

  if (action === "addRow") {
    if (table.rows.length >= 100) throw new Error("هر جدول می‌تواند حداکثر ۱۰۰ ردیف داشته باشد.");
    const tr = doc.createElement("tr");
    for (let column = 0; column < table.rows[0].cells.length; column++) tr.append(newCell());
    const anchor = table.rows[rowIndex];
    // Body rows must remain outside a header section.
    if (anchor.parentElement?.tagName === "THEAD") {
      const body = table.tBodies[0] || table.createTBody();
      body.prepend(tr);
    } else anchor.after(tr);
  }
  if (action === "deleteRow") {
    if (table.rows.length <= 1) throw new Error("آخرین ردیف را نمی‌توان حذف کرد.");
    table.deleteRow(rowIndex);
  }
  if (action === "addColumn" || action === "deleteColumn") {
    const count = table.rows[0].cells.length;
    if (action === "addColumn" && count >= 10) throw new Error("هر جدول می‌تواند حداکثر ۱۰ ستون داشته باشد.");
    if (action === "deleteColumn" && count <= 1) throw new Error("آخرین ستون را نمی‌توان حذف کرد.");
    Array.from(table.rows).forEach((tr) => {
      if (action === "addColumn") tr.cells[columnIndex].after(newCell(tr.cells[columnIndex].tagName === "TH"));
      else tr.deleteCell(columnIndex);
    });
    const nextCount = table.rows[0].cells.length;
    setTableColumns(table, Array(nextCount).fill(100 / nextCount));
  }
  if (action === "header") {
    const first = table.rows[0];
    const makeHeader = first.cells[0].tagName !== "TH";
    Array.from(first.cells).forEach((old) => {
      const replacement = newCell(makeHeader);
      replacement.innerHTML = old.innerHTML;
      replacement.style.cssText = old.style.cssText;
      old.replaceWith(replacement);
    });
  }
}

export function setElementWidth(element: ResizableElement, amount: number, unit: "%" | "px") {
  const maximum = unit === "%" ? 100 : 2400;
  const minimum = unit === "%" ? 10 : 40;
  element.style.width = `${Math.round(Math.max(minimum, Math.min(maximum, amount)))}${unit}`;
  element.style.maxWidth = "100%";
  element.removeAttribute("width");
  if (element.tagName === "IMG") {
    element.style.height = "auto";
    element.removeAttribute("height");
  }
}
