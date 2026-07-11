import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BookingStatus = "new" | "contacted" | "confirmed" | "declined" | "cancelled";

export type Booking = {
  id: string;
  guest_name: string;
  total_guests: number;
  check_in: string;
  check_out: string;
  phone: string | null;
  notes: string | null;
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
    status?: BookingStatus;
  }) => {
    if (!input.guest_name?.trim()) throw new Error("Guest name required");
    if (input.guest_name.length > 200) throw new Error("Guest name too long");
    if (!input.check_in || !input.check_out) throw new Error("Dates required");
    if (new Date(input.check_out) <= new Date(input.check_in)) throw new Error("Check-out must be after check-in");
    if (!Number.isFinite(input.total_guests) || input.total_guests < 1) throw new Error("Guests must be at least 1");
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
      status: data.status ?? "confirmed",
      created_by: userId,
    };

    const result = data.id
      ? await supabase.from("bookings").update(payload).eq("id", data.id).select().single()
      : await supabase.from("bookings").insert(payload).select().single();
    if (result.error) throw result.error;
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
    return { ok: true };
  });
