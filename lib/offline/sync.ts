"use client";

import { base64ToBlob, stripImageMetadata } from "@/lib/security/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getQueuedExpenses, markQueueError, removeQueuedExpense } from "@/lib/offline/db";

let syncInProgress = false;

export interface SyncResult {
  synced: number;
  failed: number;
}

export async function syncQueuedExpenses(): Promise<SyncResult> {
  if (syncInProgress || typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  syncInProgress = true;
  const result: SyncResult = { synced: 0, failed: 0 };
  const supabase = getSupabaseBrowserClient();

  try {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return result;
    }

    const queuedExpenses = await getQueuedExpenses();

    for (const expense of queuedExpenses) {
      if (!expense.id) {
        continue;
      }

      try {
        const fileBlob = base64ToBlob(expense.image_base64, expense.mime_type);
        const safeBlob = await stripImageMetadata(fileBlob);
        const storagePath = `${user.id}/${expense.project_id}/${crypto.randomUUID()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(storagePath, safeBlob, {
            contentType: "image/jpeg",
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl }
        } = supabase.storage.from("receipts").getPublicUrl(storagePath);

        const { error: insertError } = await supabase.from("expenses").insert({
          user_id: user.id,
          project_id: expense.project_id,
          amount: expense.amount,
          currency: expense.currency || "GBP",
          vendor_name: expense.vendor_name || null,
          category: expense.category || "Other",
          expense_date: expense.expense_date,
          receipt_image_url: publicUrl || storagePath
        });

        if (insertError) {
          throw insertError;
        }

        await removeQueuedExpense(expense.id);
        result.synced += 1;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
        await markQueueError(expense.id, errorMessage);
        result.failed += 1;
      }
    }
  } finally {
    syncInProgress = false;
  }

  return result;
}
