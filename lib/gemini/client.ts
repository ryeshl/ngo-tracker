import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerEnv } from "@/lib/supabase/env";

let geminiClient: GoogleGenerativeAI | null = null;

export function getGeminiClient() {
  if (!geminiClient) {
    const serverEnv = getServerEnv();
    geminiClient = new GoogleGenerativeAI(serverEnv.GOOGLE_GEMINI_API_KEY);
  }

  return geminiClient;
}
