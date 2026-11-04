// Figures out which platform a pasted link belongs to, so it can render as a
// branded button. Opening the link is just a normal navigation — on a phone
// the TikTok/YouTube apps intercept their own domains via Universal/App
// Links and open natively if installed, so no custom URL scheme is needed.
export type LinkPlatform = "tiktok" | "youtube" | "other";

export const linkPlatform = (url: string): LinkPlatform => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "youtube";
  } catch {
    // not a parseable URL — falls through to "other"
  }
  return "other";
};

// Adds "https://" if the user pasted a link without a scheme, and returns
// null if the result still isn't a valid http(s) URL.
export const normalizeLink = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Only add https:// when there's no scheme at all. A string that already
  // names a different scheme (ftp://, javascript:) must not get https://
  // glued on front of it — that would hide the real scheme instead of
  // rejecting it below.
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? withScheme : null;
  } catch {
    return null;
  }
};
