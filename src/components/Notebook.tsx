import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";

type Note = {
  id: string;
  title: string;
  body: string;
  tag: string;
  updatedAt: number;
};

const STORAGE_KEY = "notebook.notes.v2";

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
  const [savedFlash, setSavedFlash] = useState(false);

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
      title: "UNTITLED ENTRY",
      body: "",
      tag: "Scouting Report",
      updatedAt: Date.now(),
    };
    setNotes((p) => [n, ...p]);
    setActiveId(n.id);
  };

  const updateActive = (patch: Partial<Note>) => {
    if (!active) return;
    setNotes((p) =>
      p.map((n) =>
        n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n,
      ),
    );
  };

  const deleteActive = () => {
    if (!active) return;
    setNotes((p) => {
      const next = p.filter((n) => n.id !== active.id);
      setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const flashSave = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const wordCount = active ? active.body.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <main className="flex h-full min-w-0 flex-1 flex-col border-r border-[var(--color-amber)]/20 bg-[var(--color-ink)] text-white">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-[var(--color-panel)] p-6 lg:p-8">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="block h-[2px] w-6 bg-[var(--color-amber)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-amber)]">
              {active?.tag ?? "Project: Season Analysis"}
            </span>
          </div>
          {active ? (
            <input
              value={active.title}
              onChange={(e) =>
                updateActive({ title: e.target.value.toUpperCase() })
              }
              className="w-full bg-transparent font-display text-4xl uppercase leading-none tracking-tight text-white outline-none lg:text-6xl"
            />
          ) : (
            <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-white/30 lg:text-6xl">
              NO ENTRY SELECTED
            </h1>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={createNote}
            className="flex items-center gap-2 border border-[var(--color-cyan)]/40 bg-[var(--color-panel)] px-3 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-cyan)] transition hover:bg-[var(--color-cyan)] hover:text-[var(--color-ink)]"
          >
            <Plus className="h-3 w-3" /> New
          </button>
          <button
            onClick={flashSave}
            disabled={!active}
            className="flex items-center gap-2 border border-[var(--color-amber)]/40 bg-[var(--color-panel)] px-3 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-amber)] transition hover:bg-[var(--color-amber)] hover:text-[var(--color-ink)] disabled:opacity-30"
          >
            <Save className="h-3 w-3" />
            {savedFlash ? "Saved" : "Save Draft"}
          </button>
          <button
            onClick={deleteActive}
            disabled={!active}
            className="flex items-center gap-2 border border-white/10 bg-[var(--color-panel)] px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/40 transition hover:border-red-500/60 hover:text-red-400 disabled:opacity-30"
            aria-label="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Entry list */}
        <div className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-panel)] md:flex">
          <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
            ENTRIES // {sorted.length.toString().padStart(2, "0")}
          </div>
          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 && (
              <p className="px-4 py-3 text-[11px] uppercase tracking-widest text-white/20">
                No entries. Hit NEW.
              </p>
            )}
            {sorted.map((n) => {
              const isActive = n.id === activeId;
              return (
                <button
                  key={n.id}
                  onClick={() => setActiveId(n.id)}
                  className={`group block w-full border-l-2 px-4 py-3 text-left transition ${
                    isActive
                      ? "border-[var(--color-amber)] bg-[var(--color-panel)]"
                      : "border-transparent hover:border-[var(--color-cyan)]/40 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="truncate font-display text-base uppercase tracking-wide text-white">
                    {n.title || "UNTITLED"}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-white/40">
                    {n.body.split("\n")[0] || "Empty draft"}
                  </div>
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">
                    {new Date(n.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <section className="relative flex min-w-0 flex-1 flex-col p-6 lg:p-12">
          {active ? (
            <>
              <div className="mb-6 flex items-center gap-4 text-base font-bold tracking-tighter text-[var(--color-cyan)] lg:text-xl">
                <span className="block h-[2px] w-8 bg-[var(--color-cyan)]" />
                01. LINEUP EFFICIENCY
              </div>

              <div className="mb-6 border-l-4 border-[var(--color-cyan)] bg-[var(--color-panel)] p-5">
                <input
                  value={active.tag}
                  onChange={(e) => updateActive({ tag: e.target.value })}
                  className="w-full bg-transparent text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-cyan)] outline-none"
                  placeholder="TAG"
                />
              </div>

              <textarea
                value={active.body}
                onChange={(e) => updateActive({ body: e.target.value })}
                placeholder="Continue typing tactical notes..."
                className="min-h-[300px] flex-1 resize-none bg-transparent text-lg leading-relaxed text-gray-300 placeholder-gray-700 outline-none"
              />

              {/* Status bar */}
              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-panel)] pt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                <span>WORDS: {wordCount.toString().padStart(4, "0")}</span>
                <span>CHARS: {active.body.length.toString().padStart(4, "0")}</span>
                <span className="text-[var(--color-amber)]/60">
                  AUTOSAVED · {new Date(active.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <button
                onClick={createNote}
                className="border border-[var(--color-amber)]/40 bg-[var(--color-panel)] px-6 py-3 font-display text-xl uppercase tracking-widest text-[var(--color-amber)] transition hover:bg-[var(--color-amber)] hover:text-[var(--color-ink)]"
              >
                + Open New Entry
              </button>
            </div>
          )}

          {/* Background decorative number */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-4 right-6 font-display text-[120px] leading-none text-white/[0.04]"
          >
            NBA.2024
          </div>
        </section>
      </div>
    </main>
  );
}
