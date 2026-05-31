/**
 * Web content extraction utility using Jina Reader API.
 * Fetches a URL and returns its content as markdown text,
 * truncated to avoid token bloat in AI prompts.
 */

const MAX_CONTENT_LENGTH = 3000;
const FETCH_TIMEOUT_MS = 15_000;

export async function extractWebContent(url: string): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/markdown" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return "";

    const text = await res.text();
    // Truncate to ~3000 chars to avoid token bloat
    return text.slice(0, MAX_CONTENT_LENGTH);
  } catch {
    return "";
  }
}
