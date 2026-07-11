// Static content shim. When Lovable Cloud is enabled, swap this for a
// createServerFn that reads from `site_content` + `site_media` tables.
import { DEFAULT_CONTENT } from "./site-content-defaults";

export type SiteMediaEntry = { url: string; alt?: string };

export async function getSiteContent(): Promise<{
  content: Record<string, Record<string, unknown>>;
  media: Record<string, SiteMediaEntry>;
}> {
  return { content: DEFAULT_CONTENT, media: {} };
}
