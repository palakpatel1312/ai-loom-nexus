import { useStore, formatRelative } from "@/lib/store";
import { CheckSquare, NotebookText, Cpu, Activity } from "lucide-react";

function Metric({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon: typeof CheckSquare;
  hint: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="mt-3 text-4xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

export function Dashboard() {
  const tasks = useStore((s) => s.tasks);
  const notes = useStore((s) => s.notes);
  const tokens = useStore((s) => s.tokensUsed);
  const activity = useStore((s) => s.activity);

  const pending = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="glass relative overflow-hidden rounded-3xl p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Welcome back
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Your <span className="brand-text">productivity OS</span> is online.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Capture thoughts, ship tasks, and let the AI command center run the
            tedious bits. Everything you create syncs across views instantly.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Pending Tasks" value={pending} icon={CheckSquare} hint={`${tasks.length} total`} />
        <Metric label="Saved Notes" value={notes.length} icon={NotebookText} hint="In your vault" />
        <Metric label="AI Tokens Used" value={tokens.toLocaleString()} icon={Cpu} hint="This session" />
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-widest">
            Recent Activity
          </h2>
        </div>
        {activity.length === 0 ? (
          <EmptyActivity />
        ) : (
          <ul className="divide-y divide-border/50">
            {activity.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <span>{a.text}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="brand-gradient mb-3 flex h-12 w-12 items-center justify-center rounded-2xl opacity-80">
        <Activity className="h-6 w-6 text-white" />
      </div>
      <p className="text-sm font-medium">No activity yet</p>
      <p className="text-xs text-muted-foreground">
        Create a task or note to get things moving.
      </p>
    </div>
  );
}