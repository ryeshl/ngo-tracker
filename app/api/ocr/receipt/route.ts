import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGeminiClient } from "@/lib/gemini/client";
import { extractJsonObject } from "@/lib/gemini/json";
import { RECEIPT_OCR_PROMPT } from "@/lib/gemini/prompts";

export const runtime = "nodejs";

const requestSchema = z.object({
  imageBase64: z.string().min(20),
  mimeType: z.string().min(3)
});

const responseSchema = z.object({
  expense_date: z.string().default(""),
  amount: z.number().nullable(),
  currency: z.string().min(3).max(3).default("GBP"),
  vendor_name: z.string().default(""),
  category: z.enum([
    "Travel",
    "Meals",
    "Accommodation",
    "Supplies",
    "Logistics",
    "Utilities",
    "Other"
  ])
});

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = requestSchema.parse(await request.json());
    const model = getGeminiClient().getGenerativeModel({ model: "gemini-1.5-flash" });
    const modelResponse = await model.generateContent([
      { text: RECEIPT_OCR_PROMPT },
      {
        inlineData: {
          data: payload.imageBase64,
          mimeType: payload.mimeType
        }
      }
    ]);

    const rawText = modelResponse.response.text();
    const extractedJson = extractJsonObject(rawText);
    const parsed = JSON.parse(extractedJson) as Record<string, unknown>;

    const normalized = responseSchema.parse({
      expense_date: parsed.expense_date,
      amount:
        typeof parsed.amount === "number"
          ? parsed.amount
          : parsed.amount === null
            ? null
            : Number(parsed.amount) || null,
      currency: String(parsed.currency || "GBP").toUpperCase().slice(0, 3),
      vendor_name: String(parsed.vendor_name || "").slice(0, 120),
      category: parsed.category
    });

    return NextResponse.json(normalized);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR processing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
