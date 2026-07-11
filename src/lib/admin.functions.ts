import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean; email: string | null }> => {
    const { supabase, userId, claims } = context;
    // RLS lets a user read their own user_roles rows.
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) return { isAdmin: false, email: (claims.email as string) ?? null };
    return { isAdmin: !!data, email: (claims.email as string) ?? null };
  });
