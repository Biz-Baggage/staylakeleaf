import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean; email: string | null }> => {
    const { supabase, userId, claims } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) return { isAdmin: false, email: (claims.email as string) ?? null };
    return { isAdmin: !!data, email: (claims.email as string) ?? null };
  });

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export type ManagedUser = {
  id: string;
  email: string | null;
  is_admin: boolean;
  created_at: string;
};

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw error;
    const users = data.users ?? [];
    const ids = users.map((u) => u.id);
    let adminIds = new Set<string>();
    if (ids.length) {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids)
        .eq("role", "admin");
      adminIds = new Set((roles ?? []).map((r: any) => r.user_id));
    }
    return users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      is_admin: adminIds.has(u.id),
      created_at: u.created_at,
    }));
  });

export const createViewerUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; password: string; full_name?: string; is_admin?: boolean }) => {
    if (!input.email?.trim()) throw new Error("Email required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error("Invalid email");
    if (!input.password || input.password.length < 8) throw new Error("Password must be at least 8 characters");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name?.trim() || "" },
    });
    if (error) throw error;
    if (data.is_admin && created.user) {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: created.user.id, role: "admin" });
    }
    return { ok: true, id: created.user?.id };
  });

export const deleteManagedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.id === context.userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw error;
    return { ok: true };
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; is_admin: boolean }) => {
    if (!input.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.id === context.userId && !data.is_admin) throw new Error("You cannot remove your own admin role");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.is_admin) {
      await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: "admin" });
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id).eq("role", "admin");
    }
    return { ok: true };
  });
