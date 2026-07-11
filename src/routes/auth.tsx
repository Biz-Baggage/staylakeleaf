import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Admin sign in — Lake Leaf" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: search.redirect ?? "/admin", replace: true });
    });
  }, [navigate, search.redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast.success("Welcome back");
      navigate({ to: search.redirect ?? "/admin", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 px-4 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 text-primary mb-8 justify-center font-display text-xl">
          <Leaf className="h-5 w-5" /> Lake Leaf
        </Link>
        <div className="rounded-2xl bg-card border border-border p-7 shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl font-display font-medium">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in with the account provided by the Lake Leaf admin.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : "Sign in"}
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">← Back to Lake Leaf</Link>
        </p>
      </div>
    </div>
  );
}
