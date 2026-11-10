import path from "path";

/** Folder where uploaded video files are kept. Set STORAGE_DIR on the server to a disk that is backed up. */
export const STORAGE = process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage", "videos");

export const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};
