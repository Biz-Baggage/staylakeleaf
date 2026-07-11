import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_CONTENT } from "./site-content-defaults";

export type SiteMediaEntry = { url: string; alt?: string };
export type GalleryImage = { id: string; url: string; caption: string | null; sort_order: number };

export type ContentBundle = {
  content: Record<string, Record<string, unknown>>;
  media: Record<string, SiteMediaEntry>;
  gallery: GalleryImage[];
};

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// -------- Public read --------
export const getSiteContent = createServerFn({ method: "GET" }).handler(async (): Promise<ContentBundle> => {
  const sb = publicClient();
  const [contentRes, mediaRes, galleryRes] = await Promise.all([
    sb.from("site_content").select("section,data"),
    sb.from("site_media").select("slot,url,alt"),
    sb.from("gallery_images").select("id,url,caption,sort_order").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
  ]);

  const content: Record<string, Record<string, unknown>> = { ...DEFAULT_CONTENT };
  for (const row of contentRes.data ?? []) {
    content[row.section] = row.data as Record<string, unknown>;
  }
  const media: Record<string, SiteMediaEntry> = {};
  for (const row of mediaRes.data ?? []) {
    media[row.slot] = { url: row.url, alt: row.alt ?? undefined };
  }
  const gallery: GalleryImage[] = (galleryRes.data ?? []).map((r) => ({
    id: r.id, url: r.url, caption: r.caption, sort_order: r.sort_order,
  }));
  return { content, media, gallery };
});

// -------- Admin: content --------
export const saveContentSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { section: string; data: Record<string, unknown> }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_content")
      .upsert({ section: data.section, data: data.data, updated_by: context.userId }, { onConflict: "section" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetContentSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { section: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("site_content").delete().eq("section", data.section);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Admin: media slots --------
export const saveMediaSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slot: string; url: string; alt?: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_media")
      .upsert({ slot: data.slot, url: data.url, alt: data.alt ?? null, updated_by: context.userId }, { onConflict: "slot" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMediaSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slot: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("site_media").delete().eq("slot", data.slot);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Admin: gallery --------
export const addGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { url: string; caption?: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: maxRow } = await context.supabase
      .from("gallery_images")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const next = (maxRow?.sort_order ?? 0) + 10;
    const { error } = await context.supabase
      .from("gallery_images")
      .insert({ url: data.url, caption: data.caption ?? null, sort_order: next, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; caption?: string; sort_order?: number }) => data)
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.caption !== undefined) patch.caption = data.caption;
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;
    const { error } = await context.supabase.from("gallery_images").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("gallery_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
