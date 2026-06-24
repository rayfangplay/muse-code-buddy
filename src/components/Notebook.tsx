import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
};

const STORAGE_KEY = "notebook.notes.v1";

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Note[];
  } catch {
    return [];
  }
}

export function Notebook() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = loadNotes();
    setNotes(initial);
    setActiveId(initial[0]?.id ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes, hydrated]);

  const active = useMemo(
    () => notes.find((n) => n.id === activeId) ?? null,
    [notes, activeId],
  );

  const createNote = () => {
    const n: Note = {
      id: crypto.randomUUID(),
      title: "Untitled",
      body: "",
      updatedAt: Date.now(),
    };
    setNotes((prev) => [n, ...prev]);
    setActiveId(n.id);
  };

  const updateActive = (patch: Partial<Note>) => {
    if (!active) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n,
      ),
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (id === activeId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="flex w-64 flex-col border-r bg-muted/30">
        <div className="flex items-center justify-between border-b px-3 py-3">
          <h1 className="text-sm font-semibold tracking-tight">Notes</h1>
          <Button size="icon" variant="ghost" onClick={createNote} aria-label="New note">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sorted.length === 0 && (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              No notes yet. Click + to create one.
            </p>
          )}
          {sorted.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={`group flex w-full items-start justify-between gap-2 border-b px-3 py-2 text-left hover:bg-accent ${
                n.id === activeId ? "bg-accent" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {n.title || "Untitled"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {n.body.split("\n")[0] || "No content"}
                </div>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(n.id);
                }}
                className="opacity-0 transition group-hover:opacity-100"
                aria-label="Delete note"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <>
            <div className="border-b px-6 py-4">
              <Input
                value={active.title}
                onChange={(e) => updateActive({ title: e.target.value })}
                placeholder="Title"
                className="border-0 px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Updated {new Date(active.updatedAt).toLocaleString()}
              </p>
            </div>
            <Textarea
              value={active.body}
              onChange={(e) => updateActive({ body: e.target.value })}
              placeholder="Start writing…"
              className="flex-1 resize-none rounded-none border-0 px-6 py-4 text-base shadow-none focus-visible:ring-0"
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Create a note to get started.
          </div>
        )}
      </div>
    </div>
  );
}
