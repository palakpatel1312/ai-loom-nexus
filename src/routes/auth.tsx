import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).catch("login") });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — SnapCalorie" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (session) navigate({ to: profile?.onboarded ? "/dashboard" : "/onboarding", replace: true });
  }, [loading, session, profile, navigate]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="mt-8 mb-6">
        <h1 className="text-3xl font-black tracking-tight">
          {mode === "signup" ? "Create account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup" ? "Start tracking in seconds." : "Sign in to continue your streak."}
        </p>
      </div>

      {mode === "signup" ? <SignupForm /> : <LoginForm />}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>Already registered? <Link to="/auth" search={{ mode: "login" }} className="text-primary font-medium">Log in</Link></>
        ) : (
          <>New here? <Link to="/auth" search={{ mode: "signup" }} className="text-primary font-medium">Create an account</Link></>
        )}
      </div>
    </div>
  );
}

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name"),
    email: z.string().trim().email("Invalid email"),
    password: z.string().min(6, "At least 6 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

function SignupForm() {
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = signupSchema.safeParse(values);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: values.name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created!");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full name" error={errors.name}>
        <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="Jane Doe" className="h-12 rounded-xl" />
      </Field>
      <Field label="Email" error={errors.email}>
        <Input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="you@email.com" className="h-12 rounded-xl" />
      </Field>
      <Field label="Password" error={errors.password}>
        <PasswordInput value={values.password} onChange={(v) => setValues({ ...values, password: v })} show={show} onToggle={() => setShow(!show)} />
      </Field>
      <Field label="Confirm password" error={errors.confirm}>
        <PasswordInput value={values.confirm} onChange={(v) => setValues({ ...values, confirm: v })} show={show} onToggle={() => setShow(!show)} />
      </Field>
      <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl brand-gradient text-primary-foreground border-0 hover:opacity-90">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Required"),
});

function LoginForm() {
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) toast.error(error.message);
  }

  async function onForgot() {
    if (!values.email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" error={errors.email}>
        <Input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="you@email.com" className="h-12 rounded-xl" />
      </Field>
      <Field label="Password" error={errors.password}>
        <PasswordInput value={values.password} onChange={(v) => setValues({ ...values, password: v })} show={show} onToggle={() => setShow(!show)} />
      </Field>
      <button type="button" onClick={onForgot} className="text-sm text-primary font-medium">
        Forgot password?
      </button>
      <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl brand-gradient text-primary-foreground border-0 hover:opacity-90">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggle }: { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl pr-12" />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}