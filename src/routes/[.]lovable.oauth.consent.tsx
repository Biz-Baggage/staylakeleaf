import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

type OAuthClient = { name?: string; client_uri?: string; logo_uri?: string };
type AuthorizationDetails = {
  client?: OAuthClient;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};

// Local typed wrapper — supabase.auth.oauth is beta and not always in the exported types.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: any }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: Supabase reads its session from localStorage, absent on SSR.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      // The /auth route already reads a `redirect` search param and navigates
      // there after sign-in — preserve the full consent URL so we come back
      // with the same authorization_id.
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { redirect: next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen grid place-items-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-display mb-2">Could not load this authorization</h1>
        <p className="text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message ?? "Something went wrong.");
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";

  return (
    <main className="min-h-screen grid place-items-center bg-secondary/40 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 text-primary mb-8 justify-center font-display text-xl">
          <Leaf className="h-5 w-5" /> Lake Leaf
        </div>
        <div className="rounded-2xl bg-card border border-border p-7 shadow-[var(--shadow-soft)]">
          <h1 className="text-xl font-display font-medium">Connect {clientName} to Lake Leaf</h1>
          <p className="text-sm text-muted-foreground mt-2">
            This lets {clientName} use Lake Leaf as you. It can call the app's enabled tools while you
            are signed in.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            This does not bypass Lake Leaf's permissions — the tools still act under your account's access.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-6 flex gap-2">
            <Button onClick={() => decide(true)} disabled={busy} className="flex-1">
              Approve
            </Button>
            <Button
              onClick={() => decide(false)}
              disabled={busy}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
