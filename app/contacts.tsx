"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Contact,
  type ContactInput,
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from "@/lib/contacts";
import { GENERIC_ERROR, translateContactError } from "@/lib/contact-errors";
import { ContactForm, type ContactFormValues } from "./contact-form";

type SortBy = "name" | "priority" | "created_at";
type PriorityFilter = "all" | Contact["priority"];

const PRIORITY_RANK: Record<Contact["priority"], number> = {
  high: 2,
  medium: 1,
  low: 0,
};

function toInput(values: ContactFormValues): ContactInput {
  return {
    name: values.name.trim(),
    company: values.company.trim() || null,
    role: values.role.trim() || null,
    where_met: values.where_met.trim() || null,
    notes: values.notes.trim() || null,
    priority: values.priority,
  };
}

function toFormValues(contact: Contact): ContactFormValues {
  return {
    name: contact.name,
    company: contact.company ?? "",
    role: contact.role ?? "",
    where_met: contact.where_met ?? "",
    notes: contact.notes ?? "",
    priority: contact.priority,
  };
}

function sortContacts(contacts: Contact[], sortBy: SortBy): Contact[] {
  const sorted = [...contacts];
  switch (sortBy) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "priority":
      sorted.sort(
        (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority],
      );
      break;
    case "created_at":
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
  }
  return sorted;
}

const fieldClass =
  "rounded border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-800";

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>("all");

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await listContacts();
        if (error) setLoadError(translateContactError(error));
        else setContacts(data);
      } catch (err) {
        setLoadError(translateContactError(err));
      }
    })();
  }, []);

  const visibleContacts = useMemo(() => {
    if (!contacts) return [];
    const filtered =
      filterPriority === "all"
        ? contacts
        : contacts.filter((c) => c.priority === filterPriority);
    return sortContacts(filtered, sortBy);
  }, [contacts, sortBy, filterPriority]);

  async function handleCreate(values: ContactFormValues) {
    setActionError(null);
    const { data, error } = await createContact(toInput(values));
    if (error) {
      return { error: { message: translateContactError(error) } };
    }
    if (!data) {
      return { error: { message: GENERIC_ERROR } };
    }
    setContacts((c) => [...(c ?? []), data]);
    setAdding(false);
    return { error: null };
  }

  async function handleUpdate(id: number, values: ContactFormValues) {
    setActionError(null);
    const { data, error } = await updateContact(id, toInput(values));
    if (error) {
      return { error: { message: translateContactError(error) } };
    }
    if (!data) {
      return { error: { message: GENERIC_ERROR } };
    }
    setContacts((c) => (c ?? []).map((row) => (row.id === id ? data : row)));
    setEditingId(null);
    return { error: null };
  }

  async function handleDelete(id: number) {
    setActionError(null);
    try {
      const { error } = await deleteContact(id);
      if (error) {
        setActionError(translateContactError(error));
        return;
      }
      setContacts((c) => (c ?? []).filter((row) => row.id !== id));
    } catch (err) {
      setActionError(translateContactError(err));
    }
  }

  if (loadError) {
    return <p className="text-red-600">{loadError}</p>;
  }

  if (contacts === null) {
    return <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 px-2 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Contacts</h1>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Add contact
          </button>
        )}
      </div>

      {contacts.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Sort by</span>
            <select
              className={fieldClass}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="name">Name</option>
              <option value="priority">Priority</option>
              <option value="created_at">Date added</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Filter</span>
            <select
              className={fieldClass}
              value={filterPriority}
              onChange={(e) =>
                setFilterPriority(e.target.value as PriorityFilter)
              }
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>
      )}

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {adding && (
        <ContactForm
          submitLabel="Add"
          onSubmit={handleCreate}
          onCancel={() => setAdding(false)}
        />
      )}

      {contacts.length === 0 && !adding && (
        <p className="text-zinc-500 dark:text-zinc-400">
          No contacts yet — add your first one.
        </p>
      )}

      {contacts.length > 0 && visibleContacts.length === 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">
          No contacts match this filter.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {visibleContacts.map((contact) =>
          editingId === contact.id ? (
            <li key={contact.id}>
              <ContactForm
                initialValues={toFormValues(contact)}
                submitLabel="Save"
                onSubmit={(values) => handleUpdate(contact.id, values)}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={contact.id}
              className="flex flex-col gap-2 rounded border border-black/10 p-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {[contact.role, contact.company].filter(Boolean).join(" at ")}
                </p>
                <p className="text-xs uppercase text-zinc-400">
                  {contact.priority}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(contact.id)}
                  className="rounded border border-black/10 px-2 py-1 text-sm dark:border-white/10"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="rounded border border-black/10 px-2 py-1 text-sm dark:border-white/10"
                >
                  Delete
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
