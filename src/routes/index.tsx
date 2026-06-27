import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, Camera, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SnapCalorie — AI Nutritionist" },
      { name: "description", content: "Track meals in one snap. Your AI dietitian, in your pocket." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (session) navigate({ to: profile?.onboarded ? "/dashboard" : "/onboarding", replace: true });
  }, [loading, session, profile, navigate]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 brand-gradient rounded-[2rem] blur-2xl opacity-60" />
          <div className="relative h-24 w-24 grid place-items-center rounded-[2rem] brand-gradient shadow-[var(--shadow-glow)]">
            <Sparkles className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-5xl font-black tracking-tight">
          Snap<span className="brand-text">Calorie</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xs">
          Your pocket AI nutritionist. One snap, full insight.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-3 w-full">
          <Feature icon={<Camera className="h-5 w-5" />} label="Snap & track" />
          <Feature icon={<Heart className="h-5 w-5" />} label="Hit your goals" />
        </div>
      </div>

      <div className="space-y-3">
        <Button asChild size="lg" className="w-full h-14 text-base rounded-2xl brand-gradient text-primary-foreground border-0 shadow-[var(--shadow-glow)] hover:opacity-90">
          <Link to="/auth" search={{ mode: "signup" }}>Get Started</Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="w-full h-12 rounded-2xl">
          <Link to="/auth" search={{ mode: "login" }}>Already have an account? Log in</Link>
        </Button>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-3">
      <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary/20 text-primary">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
