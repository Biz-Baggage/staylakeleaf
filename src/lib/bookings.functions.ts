import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { syncBookingsToSheet } from "./bookings-sync.server";

export type ReservedRange = { check_in: string; check_out: string };

export const listReservedRanges = createServerFn({ method: "GET" }).handler(async (): Promise<ReservedRange[]> => {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const sb = createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data, error } = await (sb as any).rpc("get_reserved_ranges");
  if (error) throw error;
  return (data ?? []) as ReservedRange[];
});

export type BookingStatus = "new" | "contacted" | "confirmed" | "declined" | "cancelled";

export type Booking = {
  id: string;
  guest_name: string;
  total_guests: number;
  check_in: string;
  check_out: string;
  phone: string | null;
  notes: string | null;
  cost: number | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Booking[]> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("check_in", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Booking[];
  });

export const upsertBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id?: string;
    guest_name: string;
    total_guests: number;
    check_in: string;
    check_out: string;
    phone?: string;
    notes?: string;
    cost?: number | null;
    status?: BookingStatus;
  }) => {
    if (!input.guest_name?.trim()) throw new Error("Guest name required");
    if (input.guest_name.length > 200) throw new Error("Guest name too long");
    if (!input.check_in || !input.check_out) throw new Error("Dates required");
    if (new Date(input.check_out) <= new Date(input.check_in)) throw new Error("Check-out must be after check-in");
    if (!Number.isFinite(input.total_guests) || input.total_guests < 1) throw new Error("Guests must be at least 1");
    if (input.cost != null && (!Number.isFinite(input.cost) || input.cost < 0)) throw new Error("Cost must be a positive number");
    return input;
  })
  .handler(async ({ data, context }): Promise<Booking> => {
    const { supabase, userId } = context;
    const payload = {
      guest_name: data.guest_name.trim(),
      total_guests: data.total_guests,
      check_in: data.check_in,
      check_out: data.check_out,
      phone: data.phone?.trim() || null,
      notes: data.notes?.trim() || null,
      cost: data.cost ?? null,
      status: data.status ?? "confirmed",
      created_by: userId,
    };

    const result = data.id
      ? await supabase.from("bookings").update(payload).eq("id", data.id).select().single()
      : await supabase.from("bookings").insert(payload).select().single();
    if (result.error) throw result.error;
    await syncBookingsToSheet(supabase).catch((e) => console.error("[sheets sync]", e));
    return result.data as Booking;
  });

export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("bookings").delete().eq("id", data.id);
    if (error) throw error;
    await syncBookingsToSheet(supabase).catch((e) => console.error("[sheets sync]", e));
    return { ok: true };
  });


