import { readFile } from "node:fs/promises";
import path from "node:path";

let schemaSqlCache: string | null = null;

export async function getSchemaSql() {
  if (schemaSqlCache) {
    return schemaSqlCache;
  }

  const schemaPath = path.join(process.cwd(), "schema.sql");
  schemaSqlCache = await readFile(schemaPath, "utf-8");
  return schemaSqlCache;
}
