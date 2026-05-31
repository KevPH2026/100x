/**
 * File content extraction utility.
 * PDF: uses pdf2json for text extraction.
 * Word/Excel/PPT: suggests user paste as text.
 */

const MAX_CONTENT_LENGTH = 3000;

/**
 * Extract text from a PDF buffer (server-side only).
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { default: PDFParser } = await import("pdf2json");
    const parser = new (PDFParser as any)(null, 1);
    return new Promise((resolve) => {
      parser.on("pdfParser_dataReady", (pdfData: any) => {
        const text = pdfData.Pages?.map((page: any) =>
          page.Texts?.map((t: any) =>
            t.R?.map((r: any) => decodeURIComponent(r.T || "")).join("")
          ).join(" ")
        ).join("\n") || "";
        resolve(text.slice(0, MAX_CONTENT_LENGTH));
      });
      parser.on("pdfParser_dataError", () => resolve(""));
      parser.parseBuffer(buffer);
    });
  } catch {
    return "";
  }
}

/**
 * Get a human-readable label for unsupported file types.
 */
export function getUnsupportedFileMessage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext || "")) {
    return `[文件] ${filename}（Word/Excel/PPT 暂不支持自动解析，请将内容粘贴为文本素材）`;
  }
  return `[文件] ${filename}`;
}
