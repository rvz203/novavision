export const EDITOR_LANGUAGES = ["fa", "en", "ar"] as const;
export type EditorLanguage = (typeof EDITOR_LANGUAGES)[number];

export type EditorTranslation = {
  title: string;
  slug: string;
  content: string;
  contentFormat: "html" | "markdown";
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  seoTitle: string;
  seoDescription: string;
};

export type EditorPost = EditorTranslation & {
  id?: string;
  template: "standard" | "analysis" | "guide" | "news";
  coverImage: string;
  featured: boolean;
  published: boolean;
  language: EditorLanguage;
};

export type MultilingualEditorPost = {
  id?: string;
  template: EditorPost["template"];
  coverImage: string;
  featured: boolean;
  published: boolean;
  translations: Record<EditorLanguage, EditorTranslation>;
};

const emptyTranslation = (author: string): EditorTranslation => ({
  title: "", slug: "", content: "", contentFormat: "html", excerpt: "", category: "", tags: [], author, seoTitle: "", seoDescription: "",
});

export const EMPTY_POST: MultilingualEditorPost = {
  template: "standard",
  coverImage: "",
  featured: false,
  published: false,
  translations: {
    fa: emptyTranslation("تیم NovaVison"),
    en: emptyTranslation("NovaVison Team"),
    ar: emptyTranslation("فريق جيفان"),
  },
};

const templateCopy = {
  standard: {
    fa: `<p>موضوع اصلی نوشته را کوتاه و روشن معرفی کنید.</p><h2>چرا این موضوع مهم است؟</h2><p>زمینه و اهمیت موضوع را توضیح دهید.</p><h2>نکات کلیدی</h2><ul><li>نکته نخست</li><li>نکته دوم</li><li>نکته سوم</li></ul><h2>جمع‌بندی</h2><p>نتیجه اصلی و قدم بعدی خواننده را بیان کنید.</p>`,
    en: `<p>Introduce the article topic clearly and briefly.</p><h2>Why does this matter?</h2><p>Explain the background and importance of the topic.</p><h2>Key takeaways</h2><ul><li>First key point</li><li>Second key point</li><li>Third key point</li></ul><h2>Conclusion</h2><p>Summarize the main result and the reader's next step.</p>`,
    ar: `<p>قدّم موضوع المقال بوضوح واختصار.</p><h2>لماذا هذا الموضوع مهم؟</h2><p>اشرح خلفية الموضوع وأهميته.</p><h2>النقاط الرئيسية</h2><ul><li>النقطة الأولى</li><li>النقطة الثانية</li><li>النقطة الثالثة</li></ul><h2>الخلاصة</h2><p>لخّص النتيجة الرئيسية والخطوة التالية للقارئ.</p>`,
  },
  analysis: {
    fa: `<p>تحولات اخیر بازار و عوامل اثرگذار را بررسی کنید.</p><h2>خلاصه تحلیل</h2><p>مهم‌ترین نتیجه را بنویسید.</p><h2>عوامل اثرگذار</h2><ul><li><strong>عامل اول:</strong> توضیح اثر</li><li><strong>عامل دوم:</strong> توضیح اثر</li></ul><h2>سناریوها</h2><p>سناریوی صعودی، خنثی و نزولی را مقایسه کنید.</p><h2>چشم‌انداز</h2><p>دیدگاه نهایی و ریسک‌ها را شفاف بیان کنید.</p>`,
    en: `<p>Review recent market moves and their main drivers.</p><h2>Analysis summary</h2><p>State the most important conclusion.</p><h2>Market drivers</h2><ul><li><strong>Driver one:</strong> explain the impact</li><li><strong>Driver two:</strong> explain the impact</li></ul><h2>Scenarios</h2><p>Compare bullish, neutral, and bearish scenarios.</p><h2>Outlook</h2><p>State the final view and key risks clearly.</p>`,
    ar: `<p>راجع تحركات السوق الأخيرة والعوامل المؤثرة فيها.</p><h2>ملخص التحليل</h2><p>اذكر أهم نتيجة.</p><h2>العوامل المؤثرة</h2><ul><li><strong>العامل الأول:</strong> اشرح التأثير</li><li><strong>العامل الثاني:</strong> اشرح التأثير</li></ul><h2>السيناريوهات</h2><p>قارن السيناريو الصاعد والمحايد والهابط.</p><h2>التوقعات</h2><p>اذكر الرأي النهائي والمخاطر بوضوح.</p>`,
  },
  guide: {
    fa: `<p>مسیر انجام کار را مرحله‌به‌مرحله مرور کنید.</p><h2>پیش‌نیازها</h2><ul><li>پیش‌نیاز اول</li><li>پیش‌نیاز دوم</li></ul><h2>گام اول: شروع</h2><p>کارهای گام اول را توضیح دهید.</p><h2>گام دوم: اجرا</h2><p>جزئیات اجرا را بنویسید.</p><h2>گام سوم: بررسی</h2><p>روش اطمینان از نتیجه را توضیح دهید.</p>`,
    en: `<p>Walk through the process step by step.</p><h2>Prerequisites</h2><ul><li>First prerequisite</li><li>Second prerequisite</li></ul><h2>Step one: Start</h2><p>Explain the first actions.</p><h2>Step two: Execute</h2><p>Describe the implementation details.</p><h2>Step three: Verify</h2><p>Explain how to verify the result.</p>`,
    ar: `<p>اشرح العملية خطوة بخطوة.</p><h2>المتطلبات</h2><ul><li>المتطلب الأول</li><li>المتطلب الثاني</li></ul><h2>الخطوة الأولى: البدء</h2><p>اشرح الإجراءات الأولى.</p><h2>الخطوة الثانية: التنفيذ</h2><p>اكتب تفاصيل التنفيذ.</p><h2>الخطوة الثالثة: التحقق</h2><p>اشرح طريقة التحقق من النتيجة.</p>`,
  },
  news: {
    fa: `<p><strong>خبر را با مهم‌ترین اطلاعات آغاز کنید.</strong></p><h2>جزئیات خبر</h2><p>چه اتفاقی، چه زمانی و چرا مهم است؟</p><h2>تأثیر و گام بعدی</h2><p>پیامدها و موارد قابل پیگیری را بنویسید.</p>`,
    en: `<p><strong>Open with the most important facts.</strong></p><h2>News details</h2><p>What happened, when, and why does it matter?</p><h2>Impact and next steps</h2><p>Describe the likely impact and what to watch next.</p>`,
    ar: `<p><strong>ابدأ الخبر بأهم المعلومات.</strong></p><h2>تفاصيل الخبر</h2><p>ماذا حدث ومتى ولماذا يهم؟</p><h2>التأثير والخطوة التالية</h2><p>اكتب النتائج المتوقعة وما يجب متابعته.</p>`,
  },
};

export const POST_TEMPLATES: Array<{ id: EditorPost["template"]; name: string; description: string; categories: Record<EditorLanguage, string>; content: Record<EditorLanguage, string> }> = [
  { id: "standard", name: "مقاله استاندارد", description: "مناسب نوشته‌های آموزشی و عمومی", categories: { fa: "مقاله", en: "Article", ar: "مقال" }, content: templateCopy.standard },
  { id: "analysis", name: "تحلیل بازار", description: "ساختار کامل گزارش و سناریو", categories: { fa: "تحلیل بازار", en: "Market analysis", ar: "تحليل السوق" }, content: templateCopy.analysis },
  { id: "guide", name: "راهنمای گام‌به‌گام", description: "مناسب آموزش فرایندها", categories: { fa: "آموزش", en: "Guide", ar: "دليل" }, content: templateCopy.guide },
  { id: "news", name: "خبر کوتاه", description: "انتشار سریع خبر و اطلاعیه", categories: { fa: "اخبار", en: "News", ar: "أخبار" }, content: templateCopy.news },
];

export const LANGUAGE_META: Record<EditorLanguage, { label: string; short: string; dir: "rtl" | "ltr" }> = {
  fa: { label: "فارسی", short: "FA", dir: "rtl" },
  en: { label: "English", short: "EN", dir: "ltr" },
  ar: { label: "العربية", short: "AR", dir: "rtl" },
};

export function makeSlug(value: string) {
  return value.toLocaleLowerCase("fa").trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}
