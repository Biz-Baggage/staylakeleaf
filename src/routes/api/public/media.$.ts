import { createFileRoute } from "@tanstack/react-router";

// GET /api/public/media/<storage-path> -> 302 redirect to a fresh signed URL.
// Storage bucket "site-media" is private; this route lets any browser fetch
// files without exposing service-role credentials.
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("site-media")
          .createSignedUrl(path, 3600);
        if (error || !data?.signedUrl) return new Response("Not found", { status: 404 });
        return new Response(null, {
          status: 302,
          headers: {
            Location: data.signedUrl,
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
