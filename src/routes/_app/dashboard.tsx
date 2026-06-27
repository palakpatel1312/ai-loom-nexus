import { createFileRoute } from "@tanstack/react-router";
import { Flame, Droplet, Plus, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

type Totals = { calories: number; protein: number; carbs: number; fat: number };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function Dashboard() {
  const { user, profile } = useAuth();
  const [totals, setTotals] = useState<Totals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [water, setWater] = useState(0);

  async function refresh() {
    if (!user) return;
    const today = todayKey();
    const { data: foods } = await supabase
      .from("food_logs")
      .select("calories, protein, carbs, fat")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00Z`);
    const t = (foods ?? []).reduce<Totals>(
      (acc, f) => ({
        calories: acc.calories + (f.calories ?? 0),
        protein: acc.protein + (f.protein ?? 0),
        carbs: acc.carbs + (f.carbs ?? 0),
        fat: acc.fat + (f.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    setTotals(t);
    const { data: w } = await supabase
      .from("water_logs")
      .select("glasses")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle();
    setWater(w?.glasses ?? 0);
  }

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("food-logs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_logs" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "water_logs" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function addWater() {
    if (!user) return;
    const today = todayKey();
    const next = water + 1;
    setWater(next);
    await supabase
      .from("water_logs")
      .upsert({ user_id: user.id, day: today, glasses: next }, { onConflict: "user_id,day" });
  }

  const goals = {
    calories: profile?.calorie_goal ?? 2000,
    protein: profile?.protein_goal ?? 140,
    carbs: profile?.carbs_goal ?? 220,
    fat: profile?.fat_goal ?? 65,
  };

  return (
    <div className="px-5 pt-10 pb-6 space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Good day,</p>
        <h1 className="text-3xl font-black tracking-tight">{profile?.full_name?.split(" ")[0] ?? "there"} 👋</h1>
      </header>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Calories today</p>
            <p className="mt-1 text-3xl font-black">
              {totals.calories}
              <span className="text-base font-medium text-muted-foreground"> / {goals.calories}</span>
            </p>
          </div>
          <Ring value={totals.calories} max={goals.calories} size={92} color="oklch(0.82 0.22 145)">
            <Flame className="h-6 w-6 text-primary" />
          </Ring>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Macro label="Protein" value={totals.protein} max={goals.protein} color="oklch(0.78 0.18 30)" unit="g" />
          <Macro label="Carbs" value={totals.carbs} max={goals.carbs} color="oklch(0.78 0.18 80)" unit="g" />
          <Macro label="Fat" value={totals.fat} max={goals.fat} color="oklch(0.76 0.18 280)" unit="g" />
        </div>
      </section>

      <section className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-sky-400" />
            <h2 className="font-semibold">Water</h2>
          </div>
          <span className="text-sm text-muted-foreground">{water} / 8 glasses</span>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <button
              key={i}
              onClick={addWater}
              className={cn(
                "aspect-[3/4] rounded-lg border transition-all active:scale-90",
                i < water
                  ? "bg-sky-400/80 border-sky-300 shadow-[0_0_12px_oklch(0.78_0.15_230/0.6)]"
                  : "border-border bg-muted/30 hover:bg-muted/50",
              )}
              aria-label="Add glass of water"
            />
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Quick add</h2>
          </div>
        </div>
        <Button asChild className="w-full h-12 rounded-xl brand-gradient text-primary-foreground border-0 hover:opacity-90">
          <a href="/snap"><Plus className="h-4 w-4 mr-2" /> Snap a meal</a>
        </Button>
      </section>
    </div>
  );
}

function Ring({ value, max, size, color, children }: { value: number; max: number; size: number; color: string; children?: React.ReactNode }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / Math.max(1, max));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(0.3 0.02 160 / 0.5)" strokeWidth={8} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function Macro({ label, value, max, color, unit }: { label: string; value: number; max: number; color: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-3 flex flex-col items-center text-center">
      <Ring value={value} max={max} size={64} color={color}>
        <span className="text-xs font-bold">{Math.round((value / Math.max(1, max)) * 100)}%</span>
      </Ring>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}<span className="text-muted-foreground">/{max}{unit}</span></p>
    </div>
  );
}