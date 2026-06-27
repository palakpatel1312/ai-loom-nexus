import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Upload, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { analyzeFood } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/snap")({ component: SnapPage });

type Result = { dish: string; calories: number; protein: number; carbs: number; fat: number; tip: string };

function SnapPage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [logged, setLogged] = useState(false);

  async function handleFile(file?: File) {
    if (!file) {
      // simulated camera
      setPreview("simulated");
    } else {
      setPreview(URL.createObjectURL(file));
    }
    setResult(null);
    setLogged(false);
    setLoading(true);
    try {
      const r = await analyzeFood({ data: {} });
      setResult(r);
    } catch (e) {
      toast.error("Analysis failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function logMeal() {
    if (!user || !result) return;
    const { error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      dish: result.dish,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setLogged(true);
    toast.success(`${result.dish} logged!`);
  }

  return (
    <div className="px-5 pt-10 pb-6 space-y-5">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Snap a meal</h1>
        <p className="text-sm text-muted-foreground">AI estimates calories and macros in seconds.</p>
      </header>

      <div className="glass rounded-3xl p-4">
        <div className="aspect-square rounded-2xl overflow-hidden bg-black/50 grid place-items-center relative border border-border">
          {preview && preview !== "simulated" ? (
            <img src={preview} alt="meal" className="h-full w-full object-cover" />
          ) : preview === "simulated" ? (
            <div className="text-center p-6">
              <Sparkles className="h-12 w-12 mx-auto text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Simulated capture</p>
            </div>
          ) : (
            <div className="text-center p-6">
              <Camera className="h-14 w-14 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">Capture or upload a photo of your meal</p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 shimmer" />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button onClick={() => handleFile(undefined)} disabled={loading} className="h-12 rounded-xl brand-gradient text-primary-foreground border-0 hover:opacity-90">
            <Camera className="h-4 w-4 mr-2" /> Take Photo
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={loading} className="h-12 rounded-xl">
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {loading && <ShimmerCard />}

      {result && !loading && (
        <div className="glass rounded-3xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <p className="text-xs text-primary uppercase font-bold tracking-widest">Identified</p>
            <h2 className="text-2xl font-black mt-1">{result.dish}</h2>
          </div>
          <div className="rounded-2xl bg-primary/10 border border-primary/30 p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated calories</span>
            <span className="text-2xl font-black brand-text">{result.calories} kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Protein" value={`${result.protein}g`} />
            <Stat label="Carbs" value={`${result.carbs}g`} />
            <Stat label="Fat" value={`${result.fat}g`} />
          </div>
          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">💡 Health tip</p>
            <p className="text-sm">{result.tip}</p>
          </div>
          <Button onClick={logMeal} disabled={logged} className="w-full h-12 rounded-xl brand-gradient text-primary-foreground border-0 hover:opacity-90">
            {logged ? (<><Check className="h-4 w-4 mr-2" /> Logged</>) : "Log this meal"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function ShimmerCard() {
  return (
    <div className="glass rounded-3xl p-5 space-y-3">
      <div className="h-6 w-2/3 rounded-md shimmer" />
      <div className="h-16 rounded-2xl shimmer" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-14 rounded-2xl shimmer" />
        <div className="h-14 rounded-2xl shimmer" />
        <div className="h-14 rounded-2xl shimmer" />
      </div>
    </div>
  );
}