import type { ContentText } from "@/types/api/content";

export type ContentTextStatus = "pending" | "empty" | "available";

export function getContentTextStatus(content: ContentText): ContentTextStatus {
  if (content.extractedAt === null) return "pending";

  return content.text.trim().length === 0 ? "empty" : "available";
}
