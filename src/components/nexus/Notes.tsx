import { useEffect, useMemo, useState } from "react";
import { useStore, formatRelative } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Sparkles, Search, NotebookPen, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { summarizeNote } from "@/lib/ai.functions";

export function Notes() {
  const notes = useStore((s) => s.notes);
  const addNote = useStore((s) => s.addNote);
  const updateNote = useStore((s) => s.updateNote);
  const deleteNote = useStore((s) => s.deleteNote);
  const setSummary = useStore((s) => s.setNoteSummary);
  const addTokens = useStore((s) => s.addTokens);

  const [activeId, setActiveId] = useState<string | null>(notes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [titleErr, setTitleErr] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  const summarize = useServerFn(summarizeNote);

  const active = useMemo(
    () => notes.find((n) => n.id === activeId) ?? null,
    [notes, activeId],
  );

  useEffect(() => {
    if (active) {
      setTitle(active.title);
      setContent(active.content);
      setDirty(false);
      setTitleErr(false);
    } else {
      setTitle("");
      setContent("");
    }
  }, [activeId, active?.id]);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()),
  );

  function handleNew() {
    const id = addNote();
    setActiveId(id);
  }

  function handleSave() {
    if (!active) return;
    if (!title.trim()) {
      setTitleErr(true);
      return;
    }
    updateNote(active.id, { title: title.trim(), content });
    setDirty(false);
    toast.success("Note saved");
  }

  async function handleSummarize() {
    if (!active) return;
    if (!content.trim()) {
      toast.error("Add some content first");
      return;
    }
    setSummarizing(true);
    try {
      const res = await summarize({ data: { title: title || "Untitled", content } });
      setSummary(active.id, res.bullets);
      addTokens(res.tokens);
      toast.success("Summary ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to summarize";
      if (msg.includes("429")) toast.error("Rate limit — try again shortly");
      else if (msg.includes("402")) toast.error("AI credits exhausted");
      else toast.error(msg);
    } finally {
      setSummarizing(false);
    }
  }

  function handleDelete(id: string) {
    deleteNote(id);
    if (activeId === id) setActiveId(null);
    toast.success("Note deleted");
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notes Vault</h1>
        <p className="text-sm text-muted-foreground">
          Capture ideas. Let AI condense them on demand.
        </p>
      </div>
      <div className="grid flex-1 gap-4 lg:grid-cols-[320px_1fr] overflow-hidden">
        {/* Left list */}
        <div className="glass flex flex-col rounded-2xl p-3 overflow-hidden">
          <Button onClick={handleNew} className="brand-gradient text-white shadow-[var(--shadow-glow)]">
            <Plus className="mr-2 h-4 w-4" /> New Note
          </Button>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="mt-3 flex-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <EmptyNotes hasSearch={!!search} />
            ) : (
              <ul className="flex flex-col gap-1">
                {filtered.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "group flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition cursor-pointer",
                      activeId === n.id
                        ? "bg-primary/15 border border-primary/40"
                        : "border border-transparent hover:bg-secondary/60",
                    )}
                    onClick={() => setActiveId(n.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {n.title || "Untitled"}
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatRelative(n.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right editor */}
        <div className="glass flex flex-col rounded-2xl p-4 overflow-hidden">
          {!active ? (
            <EmptyEditor onCreate={handleNew} />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                    if (e.target.value.trim()) setTitleErr(false);
                  }}
                  placeholder="Note title"
                  className={cn(
                    "h-11 border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 px-2",
                    titleErr && "ring-2 ring-destructive rounded-md",
                  )}
                />
                <Button
                  variant="outline"
                  onClick={handleSummarize}
                  disabled={summarizing}
                  className="shrink-0 border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20"
                >
                  <Sparkles className={cn("mr-2 h-4 w-4 text-primary", summarizing && "animate-pulse")} />
                  AI Summarize
                </Button>
                <Button
                  onClick={handleSave}
                  className="shrink-0 brand-gradient text-white"
                >
                  <Save className="mr-2 h-4 w-4" /> Save{dirty ? "*" : ""}
                </Button>
              </div>
              {titleErr && (
                <p className="px-2 text-xs text-destructive">Title is required</p>
              )}

              {(summarizing || active.summary) && (
                <div className="mt-3 rounded-xl border border-primary/40 bg-primary/10 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Summary
                    </div>
                    {active.summary && !summarizing && (
                      <button
                        onClick={() => setSummary(active.id, [])}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {summarizing ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-3 animate-pulse rounded bg-primary/20"
                          style={{ width: `${90 - i * 15}%` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {active.summary?.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setDirty(true);
                }}
                placeholder="Start writing... markdown supported."
                className="mt-3 flex-1 resize-none border-border/60 bg-background/40 font-mono text-sm leading-relaxed"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyNotes({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <NotebookPen className="h-10 w-10 text-muted-foreground/40" />
      <p className="mt-3 text-sm font-medium">
        {hasSearch ? "No matches" : "No notes yet"}
      </p>
      <p className="text-xs text-muted-foreground">
        {hasSearch ? "Try a different search" : "Click + New Note to start"}
      </p>
    </div>
  );
}

function EmptyEditor({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="brand-gradient mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]">
        <NotebookPen className="h-7 w-7 text-white" />
      </div>
      <h3 className="text-lg font-semibold">Select or create a note</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Your second brain awaits.
      </p>
      <Button onClick={onCreate} className="mt-4 brand-gradient text-white">
        <Plus className="mr-2 h-4 w-4" /> New Note
      </Button>
    </div>
  );
}