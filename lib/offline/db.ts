"use client";

import Dexie, { type Table } from "dexie";
import type { QueuedExpenseDraft } from "@/types/expense";

class ExpenseQueueDatabase extends Dexie {
  queuedExpenses!: Table<QueuedExpenseDraft, number>;

  constructor() {
    super("ngoExpenseQueue");
    this.version(1).stores({
      queuedExpenses: "++id, project_id, created_at, retry_count"
    });
  }
}

export const offlineDb = new ExpenseQueueDatabase();

export async function enqueueExpense(draft: Omit<QueuedExpenseDraft, "id" | "retry_count" | "created_at">) {
  await offlineDb.queuedExpenses.add({
    ...draft,
    created_at: Date.now(),
    retry_count: 0
  });
}

export async function getQueuedExpenses() {
  return offlineDb.queuedExpenses.orderBy("created_at").toArray();
}

export async function removeQueuedExpense(id: number) {
  await offlineDb.queuedExpenses.delete(id);
}

export async function markQueueError(id: number, message: string) {
  const existing = await offlineDb.queuedExpenses.get(id);
  if (!existing) {
    return;
  }

  await offlineDb.queuedExpenses.update(id, {
    retry_count: existing.retry_count + 1,
    last_error: message
  });
}

export async function getQueueCount() {
  return offlineDb.queuedExpenses.count();
}
