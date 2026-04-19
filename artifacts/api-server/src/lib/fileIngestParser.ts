/** Parse file content into normalized text blocks */

export interface ParsedRecord {
  title: string;
  rawText: string;
  meta: Record<string, string>;
}

/** Parse CSV string into records (simple, no dep) */
function parseCsv(content: string): ParsedRecord[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const records: ParsedRecord[] = [];

  for (let i = 1; i < Math.min(lines.length, 51); i++) {
    const row = splitCsvRow(lines[i]);
    if (row.length === 0) continue;

    const meta: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (row[idx] !== undefined) meta[h] = row[idx].trim();
    });

    // Build title from first string-ish column
    const titleKey = headers.find((h) => /title|name|subject|headline|desc|event/i.test(h)) ?? headers[0];
    const title = meta[titleKey] ?? `Record ${i}`;

    const rawText = Object.entries(meta)
      .map(([k, v]) => `${k}: ${v}`)
      .join(". ");

    records.push({ title: title.slice(0, 120), rawText, meta });
  }

  return records;
}

function splitCsvRow(row: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let current = "";

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.replace(/^"|"$/g, ""));
  return result;
}

/** Parse JSON content into records */
function parseJson(content: string): ParsedRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  const items: unknown[] = Array.isArray(parsed) ? parsed.slice(0, 50) : [parsed];
  return items.map((item, idx) => {
    if (typeof item !== "object" || item === null) {
      return {
        title: `Record ${idx + 1}`,
        rawText: String(item),
        meta: {},
      };
    }
    const obj = item as Record<string, unknown>;
    const titleKey = Object.keys(obj).find((k) => /title|name|subject|headline/i.test(k)) ?? Object.keys(obj)[0];
    const title = String(obj[titleKey] ?? `Record ${idx + 1}`).slice(0, 120);

    const rawText = Object.entries(obj)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(". ");

    const meta: Record<string, string> = {};
    Object.entries(obj).forEach(([k, v]) => {
      meta[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
    });

    return { title, rawText, meta };
  });
}

/** Parse TXT as a single signal block */
function parseTxt(content: string, fileName: string): ParsedRecord[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // Split by double newline for multi-section documents
  const sections = trimmed.split(/\n{2,}/).filter((s) => s.trim().length > 20);
  if (sections.length <= 1) {
    const firstLine = trimmed.split("\n")[0]?.slice(0, 120) ?? fileName;
    return [{ title: firstLine, rawText: trimmed.slice(0, 2000), meta: { fileName } }];
  }

  return sections.slice(0, 10).map((section, idx) => {
    const firstLine = section.split("\n")[0]?.trim().slice(0, 120) ?? `Section ${idx + 1}`;
    return { title: firstLine, rawText: section.trim().slice(0, 2000), meta: { section: String(idx + 1) } };
  });
}

export function parseFileContent(
  content: string,
  fileName: string,
  fileType: "csv" | "json" | "txt",
): ParsedRecord[] {
  switch (fileType) {
    case "csv":
      return parseCsv(content);
    case "json":
      return parseJson(content);
    case "txt":
    default:
      return parseTxt(content, fileName);
  }
}
