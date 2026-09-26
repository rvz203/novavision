import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { notFound } from "next/navigation";
import EditForm from "./EditForm";
import { EDITOR_LANGUAGES, EditorLanguage, EditorTranslation, MultilingualEditorPost } from "../../editor-data";

export default async function EditPost(props: { params: Promise<{ id: string }> }) {
  await requirePermission("blog.write");
  const { id } = await props.params;

  const anchor = await prisma.post.findFirst({ where: { OR: [{ id }, { translationGroupId: id }] } });

  if (!anchor) notFound();
  const groupId = anchor.translationGroupId || anchor.id;
  const posts = await prisma.post.findMany({ where: { OR: [{ translationGroupId: groupId }, { id: groupId }] } });
  const empty = (language: EditorLanguage): EditorTranslation => ({ title: "", slug: "", content: "", contentFormat: "html", excerpt: "", category: "", tags: [], author: language === "fa" ? "تیم NovaVison" : language === "en" ? "NovaVison Team" : "فريق NovaVison", seoTitle: "", seoDescription: "" });
  const translations = Object.fromEntries(EDITOR_LANGUAGES.map((language) => {
    const post = posts.find((item) => item.language === language);
    return [language, post ? { title: post.title, slug: post.slug, content: post.content, contentFormat: post.contentFormat as EditorTranslation["contentFormat"], excerpt: post.excerpt || "", category: post.category || "", tags: post.tags, author: post.author || "", seoTitle: post.seoTitle || "", seoDescription: post.seoDescription || "" } : empty(language)];
  })) as Record<EditorLanguage, EditorTranslation>;
  const shared = posts[0] || anchor;

  return (
    <EditForm
      post={{
        id: groupId,
        template: shared.template as MultilingualEditorPost["template"],
        coverImage: shared.coverImage || "",
        featured: shared.featured,
        published: posts.every((post) => post.published),
        translations,
      }}
    />
  );
}
