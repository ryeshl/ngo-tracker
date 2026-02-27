const FORBIDDEN_KEYWORDS = [
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "create",
  "truncate",
  "grant",
  "revoke",
  "copy",
  "execute",
  "do"
];

const ALLOWED_TABLES = new Set(["expenses", "public.expenses"]);

export function enforceReadOnlySql(sql: string): string {
  const trimmed = sql.trim().replace(/;+$/, "");
  const lowered = trimmed.toLowerCase();

  if (!lowered.startsWith("select")) {
    throw new Error("Only SELECT statements are allowed.");
  }

  if (trimmed.includes(";")) {
    throw new Error("Only one SQL statement is allowed.");
  }

  if (/--|\/\*/.test(trimmed)) {
    throw new Error("SQL comments are not allowed.");
  }

  for (const keyword of FORBIDDEN_KEYWORDS) {
    const pattern = new RegExp(`\\b${keyword}\\b`, "i");
    if (pattern.test(trimmed)) {
      throw new Error(`Forbidden SQL keyword: ${keyword}`);
    }
  }

  const tableMatches = [...trimmed.matchAll(/\b(?:from|join)\s+([a-zA-Z0-9_."]+)/gi)];
  const normalizedTables = tableMatches.map((match) =>
    match[1].replace(/"/g, "").toLowerCase()
  );

  if (normalizedTables.length === 0) {
    throw new Error("Query must include FROM public.expenses.");
  }

  for (const table of normalizedTables) {
    if (!ALLOWED_TABLES.has(table)) {
      throw new Error(`Table not allowed: ${table}`);
    }
  }

  const limitMatch = trimmed.match(/\blimit\s+(\d+)\b/i);
  if (!limitMatch) {
    return `${trimmed} LIMIT 200`;
  }

  const limitValue = Number(limitMatch[1]);
  if (!Number.isFinite(limitValue) || limitValue < 1) {
    throw new Error("LIMIT must be a positive integer.");
  }

  if (limitValue > 200) {
    return trimmed.replace(/\blimit\s+\d+\b/i, "LIMIT 200");
  }

  return trimmed;
}
