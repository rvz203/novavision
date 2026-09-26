"use client";

import PostEditor from "../../PostEditor";
import { MultilingualEditorPost } from "../../editor-data";

export default function EditForm({ post }: { post: MultilingualEditorPost }) {
  return <PostEditor initialPost={post} />;
}
