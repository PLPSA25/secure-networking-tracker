"use client";

import { useState } from "react";
import type { Contact } from "@/lib/contacts";

type Priority = Contact["priority"];

const PRIORITIES: Priority[] = ["high", "medium", "low"];

export type ContactFormValues = {
  name: string;
  company: string;
  role: string;
  where_met: string;
  notes: string;
  priority: Priority;
};

const EMPTY_VALUES: ContactFormValues = {
  name: "",
  company: "",
  role: "",
  where_met: "",
  notes: "",
  priority: "medium",
};

const fieldClass =
  "rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-800";

export function ContactForm({
  initialValues = EMPTY_VALUES,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues?: ContactFormValues;
  submitLabel: string;
  onSubmit: (
    values: ContactFormValues,
  ) => Promise<{ error: { message: string } | null }>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await onSubmit(values);
    setPending(false);
    if (error) setError(error.message);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
    >
      <input
        className={fieldClass}
        placeholder="Name"
        value={values.name}
        onChange={(e) => set("name", e.target.value)}
        required
      />
      <input
        className={fieldClass}
        placeholder="Company"
        value={values.company}
        onChange={(e) => set("company", e.target.value)}
      />
      <input
        className={fieldClass}
        placeholder="Role"
        value={values.role}
        onChange={(e) => set("role", e.target.value)}
      />
      <input
        className={fieldClass}
        placeholder="Where you met"
        value={values.where_met}
        onChange={(e) => set("where_met", e.target.value)}
      />
      <textarea
        className={fieldClass}
        placeholder="Notes"
        value={values.notes}
        onChange={(e) => set("notes", e.target.value)}
        rows={3}
      />
      <select
        className={fieldClass}
        value={values.priority}
        onChange={(e) => set("priority", e.target.value as Priority)}
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-black/10 px-3 py-2 dark:border-white/10"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
