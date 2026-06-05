import { createHash } from "node:crypto";

export function contentHash(...parts: Array<string | undefined | null>) {
  return createHash("sha256")
    .update(parts.filter(Boolean).join("\n").trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

export function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) =>
      parsed.searchParams.delete(key),
    );
    return parsed.toString();
  } catch {
    return url.trim();
  }
}
