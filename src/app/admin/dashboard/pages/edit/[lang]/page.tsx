import { getDictionary, Locale } from "@/dictionaries";
import FlattenedForm from "./FlattenedForm";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin-auth";

export default async function EditPageContent(props: { params: Promise<{ lang: string }> }) {
  await requirePermission("pages.write");
  const { lang } = await props.params;

  if (lang !== 'en' && lang !== 'fa' && lang !== 'ar') {
    notFound();
  }

  // Load the dictionary directly from the unified getter
  // which will try the DB first, then fallback to JSON.
  const content = await getDictionary(lang as Locale);

  const langNames: Record<string, string> = {
    en: "انگلیسی",
    fa: "فارسی",
    ar: "عربی"
  };

  return (
    <FlattenedForm lang={lang} languageName={langNames[lang]} content={content} />
  );
}
