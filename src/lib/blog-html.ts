import sanitizeHtml from "sanitize-html";

// Only bounded layout properties are retained; arbitrary CSS and executable URLs are discarded.
const dimension = /^(?:100|(?:[1-9]?\d)(?:\.\d{1,2})?)%$|^(?:[1-9]\d{0,2}|1\d{3}|2[0-3]\d{2}|2400)px$/;
const height = /^(?:[1-9]\d{0,2}|1\d{3}|2000)px$/;

export function sanitizePostHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "figure", "figcaption", "section", "article", "div", "span", "mark", "hr", "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class", "dir", "style"],
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      th: ["colspan", "rowspan", "scope", "abbr"],
      td: ["colspan", "rowspan"],
      col: ["span"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowedStyles: {
      "*": { "text-align": [/^(left|right|center|justify)$/], direction: [/^(ltr|rtl)$/] },
      img: { width: [dimension], "max-width": [/^100%$/], height: [/^auto$/], "margin-left": [/^(auto|0(?:px)?)$/], "margin-right": [/^(auto|0(?:px)?)$/] },
      table: { width: [dimension], "max-width": [/^100%$/], "table-layout": [/^(fixed|auto)$/], "margin-left": [/^(auto|0(?:px)?)$/], "margin-right": [/^(auto|0(?:px)?)$/] },
      col: { width: [dimension] },
      td: { height: [height], "vertical-align": [/^(top|middle|bottom)$/] },
      th: { height: [height], "vertical-align": [/^(top|middle|bottom)$/] },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
    },
  });
}
