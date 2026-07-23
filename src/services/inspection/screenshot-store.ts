import "server-only";

/**
 * Screenshot persistence.
 * Production: Vercel Blob (BLOB_READ_WRITE_TOKEN) via its REST API — public,
 * cache-friendly URL stored on the report.
 * Development without Blob: store as a data URL (small JPEGs only) so the
 * report page still shows something; oversized captures are dropped.
 */

const MAX_DATA_URL_BYTES = 900 * 1024; // keep DB rows sane in dev

export async function storeScreenshot(
  reportId: string,
  jpegBase64: string,
): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const bytes = Buffer.from(jpegBase64, "base64");

  if (token) {
    try {
      const res = await fetch(
        `https://blob.vercel-storage.com/screenshots/${reportId}.jpg`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-api-version": "7",
            "content-type": "image/jpeg",
            "x-add-random-suffix": "1",
          },
          body: bytes,
        },
      );
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) return data.url;
      }
      console.error(`[screenshot] blob upload failed: ${res.status}`);
    } catch (err) {
      console.error("[screenshot] blob upload error:", err);
    }
    return null;
  }

  if (bytes.length <= MAX_DATA_URL_BYTES) {
    return `data:image/jpeg;base64,${jpegBase64}`;
  }
  return null;
}
