import { promises as fs } from "fs";
import path from "path";
import { COVERS_DIR } from "../../config/path.ts";

export async function downloadCoverIfNeeded(
  code: string,
  coverUrl?: string | null,
) {
  if (!coverUrl) return null;

  try {
    const res = await fetch(coverUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : "jpg";

    const filename = `${code.replace(/\W+/g, "_")}.${ext}`;
    const filepath = path.join(COVERS_DIR, filename);

    const arrayBuf = await res.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(arrayBuf));

    return `/public/covers/${filename}`;
  } catch {
    return null;
  }
}

export async function deleteLocalCoverIfExists(localCover?: string | null) {
  if (!localCover) return;

  try {
    // convert "/public/covers/filename.jpg" → actual file path
    const filename = path.basename(localCover);
    const filepath = path.join(COVERS_DIR, filename);

    await fs.rm(filepath, { force: true });
  } catch (err) {
    console.warn("Failed to delete cover:", err);
  }
}
