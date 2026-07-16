import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function supabaseForUser(ctx: ToolContext) {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_booking",
  title: "Create booking",
  description:
    "Create a new Lake Leaf booking. Dates use YYYY-MM-DD. Requires an admin-level account under existing RLS.",
  inputSchema: {
    guest_name: z.string().min(1).max(200).describe("Guest full name."),
    total_guests: z.number().int().min(1).describe("Number of guests."),
    check_in: z.string().describe("Check-in date, YYYY-MM-DD."),
    check_out: z.string().describe("Check-out date, YYYY-MM-DD (must be after check_in)."),
    phone: z.string().optional().describe("Guest phone number."),
    notes: z.string().optional().describe("Internal notes about this booking."),
    cost: z.number().nonnegative().optional().describe("Total cost."),
    status: z
      .enum(["new", "contacted", "confirmed", "declined", "cancelled"])
      .optional()
      .describe("Booking status. Defaults to confirmed."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    if (new Date(input.check_out) <= new Date(input.check_in)) {
      return { content: [{ type: "text", text: "check_out must be after check_in." }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("bookings")
      .insert({
        guest_name: input.guest_name.trim(),
        total_guests: input.total_guests,
        check_in: input.check_in,
        check_out: input.check_out,
        phone: input.phone?.trim() || null,
        notes: input.notes?.trim() || null,
        cost: input.cost ?? null,
        status: input.status ?? "confirmed",
        created_by: ctx.getUserId(),
      })
      .select()
      .single();
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Created booking ${data.id}` }],
      structuredContent: { booking: data },
    };
  },
});
