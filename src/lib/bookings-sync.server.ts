// Full-replace the configured Google Sheets tab after a booking change.
// Silently no-ops when the connector or spreadsheet is not configured.
export async function syncBookingsToSheet(sb: any): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!spreadsheetId || !sheetsKey || !lovableKey) return;

  const tab = process.env.GOOGLE_SHEETS_TAB || "Bookings";
  const { data, error } = await sb
    .from("bookings")
    .select("id,guest_name,total_guests,check_in,check_out,phone,notes,cost,status,created_at,updated_at")
    .order("check_in", { ascending: true });
  if (error) throw error;

  const header = ["ID", "Guest", "Guests", "Check-in", "Check-out", "Phone", "Notes", "Cost", "Status", "Created", "Updated"];
  const rows = (data ?? []).map((b: any) => [
    b.id, b.guest_name, String(b.total_guests), b.check_in, b.check_out,
    b.phone ?? "", b.notes ?? "", b.cost != null ? String(b.cost) : "", b.status, b.created_at, b.updated_at,
  ]);
  const base = "https://connector-gateway.lovable.dev/google_sheets/v4";
  const headers = {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
    "Content-Type": "application/json",
  };
  const range = `${tab}!A1:Z10000`;
  const clearRes = await fetch(`${base}/spreadsheets/${spreadsheetId}/values/${range}:clear`, { method: "POST", headers });
  if (!clearRes.ok) throw new Error(`Sheets clear [${clearRes.status}]: ${await clearRes.text()}`);
  const writeRes = await fetch(`${base}/spreadsheets/${spreadsheetId}/values/${tab}!A1?valueInputOption=RAW`, {
    method: "PUT", headers, body: JSON.stringify({ values: [header, ...rows] }),
  });
  if (!writeRes.ok) throw new Error(`Sheets write [${writeRes.status}]: ${await writeRes.text()}`);
}