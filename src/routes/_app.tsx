import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, Camera, MessageCircle, User as UserIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth", search: { mode: "login" }, replace: true });
      return;
    }
    if (profile && !profile.onboarded && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, session, profile, pathname, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full brand-gradient animate-pulse" />
      </div>
    );
  }

  const showNav = profile?.onboarded && pathname !== "/onboarding";

  return (
    <div className="mx-auto max-w-md min-h-screen pb-24">
      <Outlet />
      {showNav && <BottomNav pathname={pathname} />}
    </div>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const items = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/snap", icon: Camera, label: "Snap" },
    { to: "/coach", icon: MessageCircle, label: "Coach" },
    { to: "/settings", icon: UserIcon, label: "Profile" },
  ] as const;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50">
      <div className="mx-auto max-w-md px-4 pb-4">
        <div className="glass rounded-2xl border border-border/60 flex items-center justify-around px-2 py-2 shadow-2xl">
          {items.map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_currentColor]")} />
                <span className="text-[10px] font-medium">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}