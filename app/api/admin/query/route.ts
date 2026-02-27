import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGeminiClient } from "@/lib/gemini/client";
import { getSchemaSql } from "@/lib/gemini/schema-context";
import { SQL_GENERATION_PROMPT } from "@/lib/gemini/prompts";
import { enforceReadOnlySql } from "@/lib/security/sql";
import { executeReadOnlySql } from "@/lib/security/sql-executor";

export const runtime = "nodejs";

const requestSchema = z.object({
  question: z.string().min(3).max(500)
});

function extractSqlText(raw: string): string {
  const fenced = raw.match(/```sql([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return raw.trim();
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminFlag =
    user.app_metadata?.role === "admin" ||
    user.user_metadata?.role === "admin" ||
    user.user_metadata?.is_admin === true;

  if (!adminFlag) {
    return NextResponse.json(
      { error: "Forbidden: admin privileges required for analytics." },
      { status: 403 }
    );
  }

  try {
    const payload = requestSchema.parse(await request.json());
    const schemaSql = await getSchemaSql();
    const model = getGeminiClient().getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
${SQL_GENERATION_PROMPT}

Schema:
${schemaSql}

User question:
${payload.question}
`;

    const generated = await model.generateContent(prompt);
    const sqlText = extractSqlText(generated.response.text());
    const safeSql = enforceReadOnlySql(sqlText);
    const rows = await executeReadOnlySql(safeSql);

    return NextResponse.json({
      sql: safeSql,
      rows
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analytics query failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
