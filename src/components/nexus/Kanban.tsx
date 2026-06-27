import { useState } from "react";
import { useStore, type Priority, type Status, type Task } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowRight, ArrowLeft, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMNS: { id: Status; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "inprogress", label: "In Progress" },
  { id: "done", label: "Done" },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  High: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function Kanban() {
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setErrors({});
  }

  function submit() {
    const e: typeof errors = {};
    if (!title.trim()) e.title = "Title is required";
    if (!description.trim()) e.description = "Description is required";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    addTask({ title: title.trim(), description: description.trim(), priority });
    reset();
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
          <p className="text-sm text-muted-foreground">
            Drag work across stages. Click the arrows to move tasks.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button className="brand-gradient text-white shadow-[var(--shadow-glow)]">
              <Plus className="mr-2 h-4 w-4" /> Add New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>Create a task</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={cn(errors.title && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Ship the new dashboard"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-destructive">{errors.title}</p>
                )}
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(errors.description && "border-destructive focus-visible:ring-destructive")}
                  placeholder="What needs to happen..."
                  rows={3}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-destructive">{errors.description}</p>
                )}
              </div>
              <div>
                <Label>Priority</Label>
                <div className="mt-2 flex gap-2">
                  {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                        priority === p
                          ? PRIORITY_STYLES[p]
                          : "border-border bg-secondary text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} className="brand-gradient text-white">
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="glass flex flex-col rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold uppercase tracking-widest">
                  {col.label}
                </h3>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>
              <div
                className="flex min-h-[400px] flex-col gap-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) useStore.getState().moveTask(id, col.id);
                }}
              >
                {colTasks.length === 0 ? (
                  <EmptyColumn label={col.label} />
                ) : (
                  colTasks.map((t) => <TaskCard key={t.id} task={t} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const move = useStore((s) => s.moveTask);
  const del = useStore((s) => s.deleteTask);
  const idx = COLUMNS.findIndex((c) => c.id === task.status);
  const prev = COLUMNS[idx - 1];
  const next = COLUMNS[idx + 1];

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
      className="group rounded-xl border border-border/60 bg-secondary/40 p-3 transition hover:border-primary/50 hover:bg-secondary/60"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug">{task.title}</h4>
        <span
          className={cn(
            "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            PRIORITY_STYLES[task.priority],
          )}
        >
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {prev && (
            <button
              onClick={() => move(task.id, prev.id)}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
              title={`Move to ${prev.label}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          {next && (
            <button
              onClick={() => move(task.id, next.id)}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
              title={`Move to ${next.label}`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => del(task.id)}
          className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-10 text-center">
      <KanbanSquare className="h-8 w-8 text-muted-foreground/50" />
      <p className="mt-2 text-xs text-muted-foreground">No tasks in {label}</p>
    </div>
  );
}