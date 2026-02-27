"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { enqueueExpense } from "@/lib/offline/db";
import { fileToBase64 } from "@/lib/security/image";
import { useSyncQueue } from "@/lib/offline/use-sync-queue";
import type { ExpenseCategory, ReceiptExtraction } from "@/types/expense";

const CATEGORIES: ExpenseCategory[] = [
  "Travel",
  "Meals",
  "Accommodation",
  "Supplies",
  "Logistics",
  "Utilities",
  "Other"
];

const EMPTY_EXTRACTION: ReceiptExtraction = {
  expense_date: new Date().toISOString().slice(0, 10),
  amount: null,
  currency: "GBP",
  vendor_name: "",
  category: "Other"
};

export function ExpenseCaptureForm() {
  const { isOnline, isSyncing, queuedCount, statusLabel, runSync, refreshQueueCount } = useSyncQueue();
  const [projectId, setProjectId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReceiptExtraction>(EMPTY_EXTRACTION);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  const canSave = useMemo(() => {
    return Boolean(projectId.trim()) && Boolean(imageFile) && Boolean(formData.expense_date) && Boolean(formData.amount);
  }, [formData.amount, formData.expense_date, imageFile, projectId]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const onImageSelected = (file: File | null) => {
    setImageFile(file);
  };

  const scanReceiptWithGemini = async () => {
    if (!imageFile) {
      setFeedback("Capture a receipt image first.");
      return;
    }

    setIsScanning(true);
    setFeedback("Running OCR scan...");

    try {
      const imageBase64 = await fileToBase64(imageFile);
      const response = await fetch("/api/ocr/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageBase64,
          mimeType: imageFile.type || "image/jpeg"
        })
      });

      if (!response.ok) {
        throw new Error("OCR request failed.");
      }

      const payload = (await response.json()) as ReceiptExtraction;
      setFormData({
        expense_date: payload.expense_date || formData.expense_date,
        amount: payload.amount ?? formData.amount,
        currency: payload.currency || formData.currency,
        vendor_name: payload.vendor_name || "",
        category: payload.category || "Other"
      });
      setFeedback("OCR complete. Review and edit before saving.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "OCR failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const saveToOfflineQueue = async (event: FormEvent) => {
    event.preventDefault();

    if (!imageFile) {
      setFeedback("Please attach a receipt image.");
      return;
    }

    if (!canSave || !formData.amount) {
      setFeedback("Please complete project id, amount, and date.");
      return;
    }

    setIsSaving(true);
    setFeedback("Saving expense...");

    try {
      const imageBase64 = await fileToBase64(imageFile);

      await enqueueExpense({
        project_id: projectId.trim(),
        amount: formData.amount,
        currency: formData.currency || "GBP",
        vendor_name: formData.vendor_name || "",
        category: formData.category || "Other",
        expense_date: formData.expense_date,
        image_base64: imageBase64,
        mime_type: imageFile.type || "image/jpeg"
      });

      await refreshQueueCount();

      if (navigator.onLine) {
        await runSync();
        setFeedback("Expense saved and sync attempted.");
      } else {
        setFeedback("Expense saved offline. It will sync when connectivity returns.");
      }

      setImageFile(null);
      setPreviewUrl(null);
      setFormData({
        ...EMPTY_EXTRACTION,
        expense_date: new Date().toISOString().slice(0, 10)
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="grid gap-4 rounded-3xl border border-emerald-100 bg-panel p-5 shadow-sm sm:p-6">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
        <p className="font-semibold text-accent">{statusLabel}</p>
        <p className="text-muted">Queued expenses: {queuedCount}</p>
        <button
          type="button"
          className="mt-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-accent transition hover:bg-emerald-100 disabled:opacity-60"
          onClick={() => void runSync()}
          disabled={!isOnline || isSyncing || queuedCount === 0}
        >
          Sync Queue Now
        </button>
      </div>

      <form className="grid gap-4" onSubmit={saveToOfflineQueue}>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Project ID</span>
          <input
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="rounded-xl border border-emerald-200 bg-white px-3 py-3 outline-none ring-accent/40 focus:ring"
            placeholder="PROJECT-001"
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Receipt Photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => onImageSelected(event.target.files?.[0] ?? null)}
            className="rounded-xl border border-emerald-200 bg-white px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-accent"
            required
          />
        </label>

        {previewUrl ? (
          <img src={previewUrl} alt="Receipt preview" className="max-h-72 w-full rounded-2xl border border-emerald-100 object-contain" />
        ) : null}

        <button
          type="button"
          onClick={() => void scanReceiptWithGemini()}
          disabled={!imageFile || isScanning}
          className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-accent transition hover:bg-emerald-50 disabled:opacity-60"
        >
          {isScanning ? "Scanning..." : "Scan Receipt With AI"}
        </button>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Date</span>
            <input
              type="date"
              value={formData.expense_date}
              onChange={(event) => setFormData((current) => ({ ...current, expense_date: event.target.value }))}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-3 outline-none ring-accent/40 focus:ring"
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount ?? ""}
              onChange={(event) => setFormData((current) => ({ ...current, amount: Number(event.target.value) || null }))}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-3 outline-none ring-accent/40 focus:ring"
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Currency</span>
            <input
              value={formData.currency}
              onChange={(event) => setFormData((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-3 outline-none ring-accent/40 focus:ring"
              maxLength={3}
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Vendor</span>
            <input
              value={formData.vendor_name}
              onChange={(event) => setFormData((current) => ({ ...current, vendor_name: event.target.value }))}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-3 outline-none ring-accent/40 focus:ring"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Category</span>
          <select
            value={formData.category}
            onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value as ExpenseCategory }))}
            className="rounded-xl border border-emerald-200 bg-white px-3 py-3 outline-none ring-accent/40 focus:ring"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={!canSave || isSaving}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Expense"}
        </button>
      </form>

      {feedback ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-muted">{feedback}</p> : null}
    </section>
  );
}
