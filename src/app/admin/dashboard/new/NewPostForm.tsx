"use client";

import PostEditor from "../PostEditor";
import { EMPTY_POST } from "../editor-data";

export default function NewPostForm() {
  return <PostEditor initialPost={EMPTY_POST} />;
}
