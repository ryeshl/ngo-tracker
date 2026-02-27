import postgres from "postgres";
import { getServerEnv } from "@/lib/supabase/env";

export async function executeReadOnlySql(sqlQuery: string) {
  const serverEnv = getServerEnv();

  if (!serverEnv.SUPABASE_DB_URL) {
    throw new Error("SUPABASE_DB_URL is required to execute SQL analytics queries.");
  }

  const client = postgres(serverEnv.SUPABASE_DB_URL, {
    ssl: "require",
    max: 1
  });

  try {
    const rows = await client.unsafe(sqlQuery);
    return rows;
  } finally {
    await client.end();
  }
}
