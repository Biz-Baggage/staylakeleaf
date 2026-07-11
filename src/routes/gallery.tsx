import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Leaf } from "lucide-react";
import heroLake from "@/assets/hero-lake.jpg";
import bedroom from "@/assets/bedroom.jpg";
import rooftop from "@/assets/rooftop.jpg";
import kayak from "@/assets/kayak.jpg";
import sunrise from "@/assets/sunrise.jpg";
import campfire from "@/assets/campfire.jpg";
import bbq from "@/assets/bbq.jpg";
import exterior from "@/assets/exterior.jpg";
import { Lightbox } from "./index";

const FALLBACK = [heroLake, bedroom, rooftop, kayak, sunrise, campfire, bbq, exterior];

const galleryQuery = () => queryOptions({
  queryKey: ["site-content-public"],
  queryFn: async () => {
    const mod = await import("@/lib/content.functions");
    return await mod.getSiteContent();
  },
  staleTime: 60_000,
});

export const Route = createFileRoute("/gallery")({
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(galleryQuery()); },
  head: () => ({
    meta: [
      { title: "Gallery — Lake Leaf Nature Stay" },
      { name: "description", content: "Photos of Lake Leaf Nature Stay on Kaptai Lake — cottage, rooftop, kayaks, campfires and long views over the water." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const bundle = useSuspenseQuery(galleryQuery()).data;
  const db = bundle.gallery.map((g) => g.url);
  const shots = db.length > 0 ? db : FALLBACK;
  const [lightbox, setLightbox] = useState<number | null>(null);
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b border-border">
        <div className="container-page h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg text-primary">
            <Leaf className="h-5 w-5" /> Lake Leaf
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>
      <main className="container-page py-16">
        <div className="max-w-2xl">
          <p className="eyebrow">Gallery</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-medium font-display">Every corner of Lake Leaf.</h1>
          <p className="mt-4 text-muted-foreground">Click any photo to view it large.</p>
        </div>
        <div className="mt-12 columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
          {shots.map((src, i) => (
            <button key={i} onClick={() => setLightbox(i)} className="mb-4 block w-full overflow-hidden rounded-xl group">
              <img src={src} alt="Lake Leaf" loading="lazy" className="w-full h-auto object-cover group-hover:scale-[1.02] transition duration-500" />
            </button>
          ))}
        </div>
      </main>
      {lightbox !== null && <Lightbox images={shots} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />}
    </div>
  );
}
