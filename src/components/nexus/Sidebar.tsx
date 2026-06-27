import { LayoutDashboard, KanbanSquare, NotebookPen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type View = "dashboard" | "kanban" | "notes" | "ai";

const items: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "kanban", label: "Task Board", icon: KanbanSquare },
  { id: "notes", label: "Notes Vault", icon: NotebookPen },
  { id: "ai", label: "AI Command", icon: Sparkles },
];

export function Sidebar({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  return (
    <aside className="glass flex w-64 flex-col gap-2 rounded-2xl p-4 shrink-0">
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight">
            <span className="brand-text">NexusOS</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            AI Productivity Hub
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "brand-gradient text-white shadow-[var(--shadow-glow)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-border/60 bg-secondary/40 p-3 text-xs text-muted-foreground">
        Data lives in your browser. Refresh-safe.
      </div>
    </aside>
  );
}