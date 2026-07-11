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

// -------- Google Sheets sync (one-way) --------
// Full-replace the "Bookings" tab in the configured spreadsheet.
// Silently no-ops when the Google Sheets connector or spreadsheet id is not configured.
async function syncBookingsToSheet(sb: any): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!spreadsheetId || !sheetsKey || !lovableKey) return;

  const tab = process.env.GOOGLE_SHEETS_TAB || "Bookings";
  const { data, error } = await sb
    .from("bookings")
    .select("id,guest_name,total_guests,check_in,check_out,phone,notes,status,created_at,updated_at")
    .order("check_in", { ascending: true });
  if (error) throw error;

  const header = ["ID","Guest","Guests","Check-in","Check-out","Phone","Notes","Status","Created","Updated"];
  const rows = (data ?? []).map((b: any) => [
    b.id, b.guest_name, String(b.total_guests), b.check_in, b.check_out,
    b.phone ?? "", b.notes ?? "", b.status, b.created_at, b.updated_at,
  ]);
  const values = [header, ...rows];

  const base = "https://connector-gateway.lovable.dev/google_sheets/v4";
  const headers = {
    "Authorization": `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
    "Content-Type": "application/json",
  };

  // Clear existing values then write fresh
  const range = `${tab}!A1:Z10000`;
  const clearRes = await fetch(`${base}/spreadsheets/${spreadsheetId}/values/${range}:clear`, { method: "POST", headers });
  if (!clearRes.ok) throw new Error(`Sheets clear [${clearRes.status}]: ${await clearRes.text()}`);
  const writeRange = `${tab}!A1`;
  const writeRes = await fetch(`${base}/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=RAW`, {
    method: "PUT", headers, body: JSON.stringify({ values }),
  });
  if (!writeRes.ok) throw new Error(`Sheets write [${writeRes.status}]: ${await writeRes.text()}`);
}

