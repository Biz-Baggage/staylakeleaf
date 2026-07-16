import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBookingsTool from "./tools/list-bookings";
import getReservedRangesTool from "./tools/get-reserved-ranges";
import createBookingTool from "./tools/create-booking";

// The OAuth issuer must be the direct Supabase host; on publish SUPABASE_URL is
// rewritten to the .lovable.cloud proxy, which mcp-js rejects. VITE_SUPABASE_PROJECT_ID
// is inlined by Vite at build time and survives publish.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "lake-leaf-mcp",
  title: "Lake Leaf",
  version: "0.1.0",
  instructions:
    "Tools for the Lake Leaf holiday-stay app. Use list_bookings and get_reserved_ranges to inspect availability and bookings, and create_booking to add a new reservation. Requests act as the signed-in Lake Leaf user; only admins can see or modify bookings.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBookingsTool, getReservedRangesTool, createBookingTool],
});
