"use client";

import { useEffect, useState } from "react";
import {
  type Contact,
  type ContactInput,
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from "@/lib/contacts";
import { ContactForm, type ContactFormValues } from "./contact-form";

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

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    listContacts().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      else setContacts(data);
    });
  }, []);

  async function handleCreate(values: ContactFormValues) {
    const { data, error } = await createContact(toInput(values));
    if (!error && data) {
      setContacts((c) => [...(c ?? []), data]);
      setAdding(false);
    }
    return { error };
  }

  async function handleUpdate(id: number, values: ContactFormValues) {
    const { data, error } = await updateContact(id, toInput(values));
    if (!error && data) {
      setContacts((c) => (c ?? []).map((row) => (row.id === id ? data : row)));
      setEditingId(null);
    }
    return { error };
  }

  async function handleDelete(id: number) {
    setActionError(null);
    const { error } = await deleteContact(id);
    if (error) {
      setActionError(error.message);
      return;
    }
    setContacts((c) => (c ?? []).filter((row) => row.id !== id));
  }

  if (loadError) {
    return <p className="text-red-600">{loadError}</p>;
  }

  if (contacts === null) {
    return <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
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

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {adding && (
        <ContactForm
          submitLabel="Add"
          onSubmit={handleCreate}
          onCancel={() => setAdding(false)}
        />
      )}

      <ul className="flex flex-col gap-2">
        {contacts.map((contact) =>
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
              className="flex items-center justify-between rounded border border-black/10 p-3 dark:border-white/10"
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
