export type ContentType = "PDF" | "IMAGE";

export interface Content {
  id: string;
  name: string;
  contentType: ContentType;
  childFolderId: string;
  hasSummary: boolean;
}

export interface FolderSuggestion {
  matched: boolean;
  motherFolderId: string | null;
  childFolderId: string | null;
  suggestedMotherFolderName: string | null;
  suggestedChildFolderName: string | null;
}

export interface DownloadUrlResponse {
  url: string;
}
