import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, User as UserIcon, Target, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/settings")({ component: Settings });

function Settings() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="px-5 pt-10 pb-6 space-y-5">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Profile</h1>
      </header>

      <section className="glass rounded-3xl p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl brand-gradient grid place-items-center">
          <UserIcon className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-bold truncate">{profile?.full_name || "Friend"}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
      </section>

      <section className="glass rounded-3xl p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Daily targets</h2>
        <Row label="Calories" value={`${profile?.calorie_goal ?? 0} kcal`} />
        <Row label="Protein" value={`${profile?.protein_goal ?? 0} g`} />
        <Row label="Carbs" value={`${profile?.carbs_goal ?? 0} g`} />
        <Row label="Fat" value={`${profile?.fat_goal ?? 0} g`} />
      </section>

      <section className="glass rounded-3xl p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Apple className="h-4 w-4 text-primary" /> Lifestyle</h2>
        <Row label="Goal" value={profile?.goal ?? "—"} />
        <Row label="Diet" value={profile?.diet ?? "—"} />
        <Row label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : "—"} />
        <Row label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "—"} />
      </section>

      <Button onClick={handleLogout} variant="destructive" className="w-full h-12 rounded-xl">
        <LogOut className="h-4 w-4 mr-2" /> Log out
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}