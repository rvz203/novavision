import NewPostForm from "./NewPostForm";
import { requirePermission } from "@/lib/admin-auth";

export default async function NewPost() {
  await requirePermission("blog.write");
  return <NewPostForm />;
}
