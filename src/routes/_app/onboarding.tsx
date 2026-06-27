import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/onboarding")({ component: Onboarding });

const DIETS = ["Vegetarian", "Non-Vegetarian", "Vegan"] as const;
const GOALS = ["Lose Weight", "Maintain Weight", "Build Muscle"] as const;
const GENDERS = ["Male", "Female", "Other"] as const;

function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    age: "",
    gender: "" as (typeof GENDERS)[number] | "",
    weight: "",
    height: "",
    diet: "" as (typeof DIETS)[number] | "",
    goal: "" as (typeof GOALS)[number] | "",
  });

  function next() {
    if (step === 0) {
      if (!data.age || !data.gender || !data.weight || !data.height) {
        toast.error("Please fill all fields");
        return;
      }
    }
    if (step === 1 && !data.diet) {
      toast.error("Select a dietary preference");
      return;
    }
    if (step === 2 && !data.goal) {
      toast.error("Select a fitness goal");
      return;
    }
    if (step < 2) setStep(step + 1);
    else save();
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const weight = Number(data.weight);
    let calorie_goal = 2000;
    if (data.goal === "Lose Weight") calorie_goal = Math.round(weight * 24);
    if (data.goal === "Build Muscle") calorie_goal = Math.round(weight * 36);
    if (data.goal === "Maintain Weight") calorie_goal = Math.round(weight * 30);
    const protein_goal = Math.round(weight * 1.8);
    const fat_goal = Math.round((calorie_goal * 0.25) / 9);
    const carbs_goal = Math.round((calorie_goal - protein_goal * 4 - fat_goal * 9) / 4);

    const { error } = await supabase
      .from("profiles")
      .update({
        age: Number(data.age),
        gender: data.gender,
        weight_kg: weight,
        height_cm: Number(data.height),
        diet: data.diet,
        goal: data.goal,
        calorie_goal,
        protein_goal,
        carbs_goal,
        fat_goal,
        onboarded: true,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("All set!");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="px-6 pt-10 pb-10 min-h-screen flex flex-col">
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      <div className="flex-1">
        <p className="text-xs text-primary font-bold uppercase tracking-widest">Step {step + 1} of 3</p>
        {step === 0 && (
          <>
            <h2 className="mt-2 text-2xl font-black">A little about you</h2>
            <p className="text-sm text-muted-foreground mb-6">We'll personalize your calorie targets.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age"><Input type="number" inputMode="numeric" value={data.age} onChange={(e) => setData({ ...data, age: e.target.value })} className="h-12 rounded-xl" /></Field>
              <Field label="Gender">
                <select value={data.gender} onChange={(e) => setData({ ...data, gender: e.target.value as typeof data.gender })} className="h-12 w-full rounded-xl bg-input border border-border px-3 text-sm">
                  <option value="">Select</option>
                  {GENDERS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Weight (kg)"><Input type="number" inputMode="decimal" value={data.weight} onChange={(e) => setData({ ...data, weight: e.target.value })} className="h-12 rounded-xl" /></Field>
              <Field label="Height (cm)"><Input type="number" inputMode="numeric" value={data.height} onChange={(e) => setData({ ...data, height: e.target.value })} className="h-12 rounded-xl" /></Field>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="mt-2 text-2xl font-black">How do you eat?</h2>
            <p className="text-sm text-muted-foreground mb-6">Pick your dietary preference.</p>
            <div className="space-y-3">
              {DIETS.map((d) => (
                <Choice key={d} active={data.diet === d} label={d} onClick={() => setData({ ...data, diet: d })} />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mt-2 text-2xl font-black">What's your goal?</h2>
            <p className="text-sm text-muted-foreground mb-6">We'll set your daily targets accordingly.</p>
            <div className="space-y-3">
              {GOALS.map((g) => (
                <Choice key={g} active={data.goal === g} label={g} onClick={() => setData({ ...data, goal: g })} />
              ))}
            </div>
          </>
        )}
      </div>

      <Button onClick={next} disabled={saving} className="mt-8 w-full h-14 rounded-2xl brand-gradient text-primary-foreground border-0 text-base hover:opacity-90">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>{step < 2 ? "Continue" : "Finish"} <ArrowRight className="h-4 w-4 ml-2" /></>)}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function Choice({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-14 rounded-2xl border text-left px-5 font-medium transition-all",
        active ? "border-primary bg-primary/10 text-primary shadow-[var(--shadow-glow)]" : "border-border bg-muted/30 hover:bg-muted/50",
      )}
    >
      {label}
    </button>
  );
}