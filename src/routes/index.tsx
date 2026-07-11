import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import {
  Leaf, Waves, Sailboat, Flame, Mountain, Sun, Wifi, Wind, Utensils, Refrigerator,
  Microwave, WashingMachine, Trees, Car, Bike, Fish, Camera, MessageCircle,
  MapPin, ChevronLeft, ChevronRight, ChevronDown, Users, BedDouble, Coffee, Star, X,
  type LucideIcon,
} from "lucide-react";


import heroLake from "@/assets/hero-lake.jpg";
import journeyBoat from "@/assets/journey-boat.jpg";
import bedroom from "@/assets/bedroom.jpg";
import rooftop from "@/assets/rooftop.jpg";
import campfire from "@/assets/campfire.jpg";
import bbq from "@/assets/bbq.jpg";
import kayak from "@/assets/kayak.jpg";
import sunrise from "@/assets/sunrise.jpg";
import exterior from "@/assets/exterior.jpg";
import { getSiteContent } from "@/lib/content.functions";

const ICONS: Record<string, LucideIcon> = {
  Leaf, Waves, Sailboat, Flame, Mountain, Sun, Wifi, Wind, Utensils, Refrigerator,
  Microwave, WashingMachine, Trees, Car, Bike, Fish, Camera, MessageCircle,
  MapPin, Users, BedDouble, Coffee,
};

const FALLBACK_IMAGES: Record<string, string> = {
  hero: heroLake, journey: journeyBoat, bedroom, exterior, rooftop,
  sunrise, kayak, bbq, campfire,
};

const contentQuery = () => {
  return queryOptions({
    queryKey: ["site-content-public"],
    queryFn: async () => {
      // called client-side; wrap the RPC
      const mod = await import("@/lib/content.functions");
      return await mod.getSiteContent();
    },
    staleTime: 60_000,
  });
};

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(contentQuery());
  },
  head: () => ({ meta: [] }),
  component: LakeLeafLanding,
});

type ContentBundle = Awaited<ReturnType<typeof getSiteContent>>;

function useContent() {
  return useSuspenseQuery(contentQuery()).data;
}

function image(bundle: ContentBundle, slot: string) {
  return bundle.media[slot]?.url ?? FALLBACK_IMAGES[slot] ?? "";
}

function whatsappUrl(c: any) {
  const num = (c.whatsapp_number ?? "8801000000000").replace(/\D/g, "");
  const msg = encodeURIComponent(c.whatsapp_message ?? "Hi Lake Leaf, I'd like to plan a stay.");
  return `https://wa.me/${num}?text=${msg}`;
}

/* ---------- Sections ---------- */

function Nav({ bundle }: { bundle: ContentBundle }) {
  const c: any = bundle.content.contact;
  const wa = whatsappUrl(c);
  const [open, setOpen] = useState(false);
  const links = [
    ["Journey", "#journey"], ["Stay", "#stay"], ["Amenities", "#amenities"],
    ["Experiences", "#experiences"], ["Gallery", "#gallery"],
    ["Availability", "#availability"], ["FAQ", "#faq"],
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="container-page flex items-center justify-between h-16">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
          {bundle.media.logo?.url
            ? <img src={bundle.media.logo.url} alt={c.brand ?? "Lake Leaf"} className="h-8 w-auto object-contain" />
            : <Leaf className="h-5 w-5" strokeWidth={1.75} />}
          <span>{c.brand ?? "Lake Leaf"}</span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-foreground/80">
          {links.map(([l, h]) => <a key={h} href={h} className="hover:text-primary transition-colors">{l}</a>)}
        </nav>
        <a href={wa} target="_blank" rel="noreferrer"
          className="hidden md:inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary-glow transition-colors">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          <div className="w-5 h-0.5 bg-foreground mb-1.5" /><div className="w-5 h-0.5 bg-foreground mb-1.5" /><div className="w-5 h-0.5 bg-foreground" />
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container-page py-4 flex flex-col gap-4">
            {links.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="text-foreground/80">{l}</a>)}
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm w-fit">
              <MessageCircle className="h-4 w-4" /> Plan your stay
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero({ bundle }: { bundle: ContentBundle }) {
  const h: any = bundle.content.hero;
  const c: any = bundle.content.contact;
  const wa = whatsappUrl(c);
  return (
    <section id="top" className="relative min-h-[100svh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <img src={image(bundle, "hero")} alt="Lake Leaf Nature Stay" className="h-full w-full object-cover animate-slow-zoom" width={1920} height={1280} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      </div>
      <div className="relative container-page pb-16 pt-32 md:pb-24 text-primary-foreground">
        <div className="max-w-3xl animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur px-3 py-1 text-[11px] tracking-[0.22em] uppercase">
            <MapPin className="h-3 w-3" /> {h.eyebrow}
          </div>
          <h1 className="mt-6 font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02] font-medium">
            {h.title_prefix} <em className="italic text-[color:var(--sand)]">{h.title_italic}</em> {h.title_suffix}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/85 max-w-xl">{h.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary-glow transition-colors shadow-[var(--shadow-elegant)]">
              <MessageCircle className="h-4 w-4" /> {h.primary_cta}
            </a>
            <a href="#availability" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur px-6 py-3 font-medium hover:bg-white/20 transition-colors">
              {h.secondary_cta}
            </a>
          </div>
        </div>
      </div>
      <a href="#journey" aria-label="Scroll to journey" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 animate-float-y">
        <ChevronDown className="h-6 w-6" />
      </a>
      <a href={wa} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-ember text-ember-foreground grid place-items-center shadow-[var(--shadow-elegant)] hover:scale-105 transition-transform">
        <MessageCircle className="h-6 w-6" />
      </a>
    </section>
  );
}

function Journey({ bundle }: { bundle: ContentBundle }) {
  const j: any = bundle.content.journey;
  const stepIcons = [Car, Sailboat, Leaf];
  return (
    <section id="journey" className="py-24 md:py-32">
      <div className="container-page grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="eyebrow">{j.eyebrow}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-medium">{j.title}</h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{j.body}</p>
          <div className="mt-8 grid grid-cols-3 gap-6">
            {(j.steps as any[]).map((s, i) => {
              const Icon = stepIcons[i] ?? Leaf;
              return (
                <div key={i} className="flex flex-col items-start gap-2">
                  <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm text-muted-foreground"><span className="text-primary font-semibold">0{i + 1}.</span> {s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl bg-accent/40 -rotate-2" />
          <img src={image(bundle, "journey")} alt="Wooden boat crossing Kaptai Lake" width={1400} height={1000} loading="lazy"
            className="relative rounded-3xl shadow-[var(--shadow-elegant)] object-cover aspect-[4/3] w-full" />
        </div>
      </div>
    </section>
  );
}

function WhyChoose({ bundle }: { bundle: ContentBundle }) {
  const w: any = bundle.content.why_choose;
  return (
    <section className="py-24 md:py-32 bg-secondary/40">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">{w.eyebrow}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-medium">{w.title}</h2>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(w.cards as any[]).map((card, i) => {
            const Icon = ICONS[card.icon] ?? Leaf;
            return (
              <div key={i} className="group rounded-2xl bg-card border border-border/60 p-7 hover:shadow-[var(--shadow-soft)] hover:-translate-y-1 transition-all">
                <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                <h3 className="mt-5 text-xl font-semibold">{card.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{card.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Accommodation({ bundle }: { bundle: ContentBundle }) {
  const a: any = bundle.content.accommodation;
  return (
    <section id="stay" className="py-24 md:py-32">
      <div className="container-page grid lg:grid-cols-5 gap-12 items-center">
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          <img src={image(bundle, "bedroom")} alt="Bedroom" width={1200} height={1500} loading="lazy" className="rounded-2xl object-cover aspect-[4/5] w-full row-span-2" />
          <img src={image(bundle, "exterior")} alt="Cottage exterior" width={1400} height={1000} loading="lazy" className="rounded-2xl object-cover aspect-[4/3] w-full" />
          <img src={image(bundle, "rooftop")} alt="Rooftop deck" width={1400} height={1000} loading="lazy" className="rounded-2xl object-cover aspect-[4/3] w-full" />
        </div>
        <div className="lg:col-span-2">
          <p className="eyebrow">{a.eyebrow}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-medium">{a.title}</h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">{a.body}</p>
          <ul className="mt-8 space-y-3">
            {(a.features as any[]).map((f, i) => {
              const Icon = ICONS[f.icon] ?? Leaf;
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 h-8 w-8 rounded-full bg-secondary grid place-items-center text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="text-foreground/90">{f.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Amenities({ bundle }: { bundle: ContentBundle }) {
  const a: any = bundle.content.amenities;
  return (
    <section id="amenities" className="py-24 md:py-32 bg-secondary/40">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">{a.eyebrow}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-medium">{a.title}</h2>
        </div>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(a.groups as any[]).map((g, gi) => (
            <div key={gi} className="rounded-2xl bg-card border border-border/60 p-7">
              <h3 className="text-xs tracking-[0.22em] uppercase text-primary font-semibold">{g.title}</h3>
              <ul className="mt-5 space-y-3">
                {(g.items as any[]).map((it, i) => {
                  const Icon = ICONS[it.icon] ?? Leaf;
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm text-foreground/85">
                      <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} /> {it.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Experiences({ bundle }: { bundle: ContentBundle }) {
  const e: any = bundle.content.experiences;
  return (
    <section id="experiences" className="py-24 md:py-32">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">{e.eyebrow}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-medium">{e.title}</h2>
        </div>
        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {(e.items as any[]).map((it, i) => (
            <article key={i} className={`relative overflow-hidden rounded-3xl group ${i % 3 === 0 ? "md:row-span-2" : ""}`}>
              <img src={image(bundle, it.slot)} alt={it.title} loading="lazy"
                className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${i % 3 === 0 ? "aspect-[4/5] md:aspect-auto md:h-full" : "aspect-[4/3]"}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                <h3 className="text-2xl font-display font-medium">{it.title}</h3>
                <p className="mt-2 text-white/85 max-w-md">{it.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery({ bundle }: { bundle: ContentBundle }) {
  const g: any = bundle.content.gallery;
  const fallbackShots = [
    image(bundle, "hero"), image(bundle, "bedroom"), image(bundle, "rooftop"),
    image(bundle, "kayak"), image(bundle, "sunrise"), image(bundle, "campfire"),
    image(bundle, "bbq"), image(bundle, "exterior"),
  ];
  const dbShots = bundle.gallery.map((x) => x.url);
  const allShots = dbShots.length > 0 ? dbShots : fallbackShots;
  const preview = allShots.slice(0, 8);
  const spans = ["col-span-2 row-span-2 aspect-square","aspect-[4/5]","aspect-[4/3]","aspect-[4/3]","col-span-2 aspect-[16/9]","aspect-[4/5]","aspect-[4/3]","col-span-2 aspect-[16/9]"];
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <section id="gallery" className="py-24 md:py-32 bg-secondary/40">
      <div className="container-page">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-xl">
            <p className="eyebrow">{g.eyebrow}</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-medium">{g.title}</h2>
          </div>
          <p className="text-muted-foreground max-w-sm">{g.subtitle}</p>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 auto-rows-[140px] md:auto-rows-[180px] gap-3">
          {preview.map((src, i) => (
            <button key={i} onClick={() => setLightbox(i)} className={`group overflow-hidden rounded-xl ${spans[i] ?? "aspect-[4/3]"}`}>
              <img src={src} alt="Lake Leaf gallery" loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition duration-500" />
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link to="/gallery" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-secondary transition">
            View all photos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {lightbox !== null && (
        <Lightbox images={allShots} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
      )}
    </section>
  );
}

export function Lightbox({ images, index, onClose, onIndex }: {
  images: string[]; index: number; onClose: () => void; onIndex: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndex]);
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 grid place-items-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2" onClick={onClose} aria-label="Close"><X className="h-6 w-6" /></button>
      <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2" onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + images.length) % images.length); }} aria-label="Previous"><ChevronLeft className="h-8 w-8" /></button>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2" onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % images.length); }} aria-label="Next"><ChevronRight className="h-8 w-8" /></button>
      <img src={images[index]} alt="" className="max-h-[90vh] max-w-[92vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">{index + 1} / {images.length}</div>
    </div>
  );
}


function Nearby({ bundle }: { bundle: ContentBundle }) {
  const n: any = bundle.content.nearby;
  return (
    <section className="py-24 md:py-32">
      <div className="container-page grid lg:grid-cols-3 gap-12">
        <div>
          <p className="eyebrow">{n.eyebrow}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-medium">{n.title}</h2>
          <p className="mt-6 text-muted-foreground">{n.subtitle}</p>
        </div>
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {(n.spots as any[]).map((s, i) => (
            <div key={i} className="rounded-2xl border border-border p-6 hover:bg-secondary/60 transition-colors">
              <div className="flex items-center gap-2 text-primary text-xs tracking-widest uppercase font-semibold">
                <MapPin className="h-3.5 w-3.5" /> Spot 0{i + 1}
              </div>
              <h3 className="mt-3 text-xl font-semibold">{s.name}</h3>
              <p className="mt-2 text-muted-foreground text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Availability({ bundle }: { bundle: ContentBundle }) {
  const av: any = bundle.content.availability;
  const c: any = bundle.content.contact;
  const wa = whatsappUrl(c);
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const view = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = view.toLocaleString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstWeekday = view.getDay();

  const reservedDays = useMemo(() => {
    const seed = view.getFullYear() * 12 + view.getMonth();
    const set = new Set<number>();
    for (let i = 0; i < 8; i++) set.add(((seed * 7 + i * 11) % daysInMonth) + 1);
    return set;
  }, [view, daysInMonth]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const isPast = (d: number) => monthOffset === 0 && d < today.getDate();

  return (
    <section id="availability" className="py-24 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "radial-gradient(600px 400px at 20% 20%, var(--primary-glow), transparent 60%)" }} />
      <div className="container-page grid lg:grid-cols-2 gap-12 relative">
        <div>
          <p className="text-xs tracking-[0.22em] uppercase font-semibold text-[color:var(--sand)]">{av.eyebrow}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-medium">{av.title}</h2>
          <p className="mt-6 text-primary-foreground/80 max-w-md leading-relaxed">{av.body}</p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[color:var(--sand)]" /> Available</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-ember" /> Reserved</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-white/50" /> Past</span>
          </div>
          <a href={wa} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-ember text-ember-foreground px-6 py-3 font-medium hover:brightness-110 transition">
            <MessageCircle className="h-4 w-4" /> {av.cta}
          </a>
        </div>
        <div className="rounded-3xl bg-background/10 backdrop-blur border border-white/15 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <button onClick={() => setMonthOffset((m) => m - 1)} className="h-9 w-9 rounded-full border border-white/25 grid place-items-center hover:bg-white/10"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="font-display text-xl">{monthName}</h3>
            <button onClick={() => setMonthOffset((m) => m + 1)} className="h-9 w-9 rounded-full border border-white/25 grid place-items-center hover:bg-white/10"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-widest text-primary-foreground/60">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const reserved = reservedDays.has(d);
              const past = isPast(d);
              const isToday = monthOffset === 0 && d === today.getDate();
              return (
                <div key={i} className={[
                  "aspect-square rounded-lg text-sm grid place-items-center font-medium border transition-colors",
                  past ? "text-white/25 border-white/10"
                    : reserved ? "bg-ember text-ember-foreground border-transparent"
                    : "bg-[color:var(--sand)]/90 text-[color:var(--bark)] border-transparent hover:brightness-105",
                  isToday ? "ring-2 ring-white" : "",
                ].join(" ")}>{d}</div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials({ bundle }: { bundle: ContentBundle }) {
  const t: any = bundle.content.testimonials;
  return (
    <section className="py-24 md:py-32 bg-secondary/40">
      <div className="container-page">
        <p className="eyebrow">{t.eyebrow}</p>
        <div className="mt-4 grid md:grid-cols-3 gap-6">
          {(t.items as any[]).map((item, i) => (
            <figure key={i} className="rounded-2xl bg-card border border-border/60 p-7">
              <div className="flex gap-1 text-ember">
                {[0, 1, 2, 3, 4].map((n) => <Star key={n} className="h-4 w-4 fill-current" strokeWidth={0} />)}
              </div>
              <blockquote className="mt-4 text-lg font-display leading-snug">"{item.text}"</blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">— {item.who}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ({ bundle }: { bundle: ContentBundle }) {
  const f: any = bundle.content.faq;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="container-page grid lg:grid-cols-3 gap-12">
        <div>
          <p className="eyebrow">{f.eyebrow}</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-medium">{f.title}</h2>
        </div>
        <div className="lg:col-span-2 divide-y divide-border border-y border-border">
          {(f.items as any[]).map((item, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-4 py-5 text-left">
                <span className="text-lg font-medium">{item.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === i ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
              </button>
              {open === i && <p className="pb-6 pr-8 text-muted-foreground leading-relaxed">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactCTA({ bundle }: { bundle: ContentBundle }) {
  const cc: any = bundle.content.contact_cta;
  const c: any = bundle.content.contact;
  const wa = whatsappUrl(c);
  return (
    <section id="contact" className="relative py-28 overflow-hidden">
      <img src={image(bundle, "sunrise")} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-primary/85" />
      <div className="relative container-page text-center text-primary-foreground">
        <p className="text-xs tracking-[0.22em] uppercase font-semibold text-[color:var(--sand)]">{cc.eyebrow}</p>
        <h2 className="mt-4 font-display text-4xl md:text-6xl font-medium max-w-3xl mx-auto">{cc.title}</h2>
        <p className="mt-6 text-primary-foreground/85 max-w-xl mx-auto">{cc.body}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-ember text-ember-foreground px-7 py-3.5 font-medium hover:brightness-110">
            <MessageCircle className="h-4 w-4" /> {cc.cta}
          </a>
          <a href="#availability" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur px-7 py-3.5 font-medium hover:bg-white/20">
            View Availability
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer({ bundle }: { bundle: ContentBundle }) {
  const c: any = bundle.content.contact;
  return (
    <footer className="bg-background border-t border-border">
      <div className="container-page py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-xl text-primary font-semibold">
            {bundle.media.logo?.url
              ? <img src={bundle.media.logo.url} alt={c.brand} className="h-8 w-auto object-contain" />
              : <Leaf className="h-5 w-5" strokeWidth={1.75} />}
            {c.brand}
          </div>
          <p className="mt-4 text-muted-foreground max-w-sm">{c.tagline}</p>
        </div>
        <div>
          <p className="text-xs tracking-[0.22em] uppercase font-semibold text-primary">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a href="#journey" className="hover:text-primary">The Journey</a></li>
            <li><a href="#stay" className="hover:text-primary">The Stay</a></li>
            <li><a href="#gallery" className="hover:text-primary">Gallery</a></li>
            <li><a href="#availability" className="hover:text-primary">Availability</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.22em] uppercase font-semibold text-primary">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp the host</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {c.location}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-5 flex flex-wrap justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {c.brand}. All rights reserved.</span>
          <span>{c.footer_note}</span>
        </div>
      </div>
    </footer>
  );
}

function LakeLeafLanding() {
  const bundle = useContent();
  return (
    <div className="bg-background text-foreground">
      <Nav bundle={bundle} />
      <main>
        <Hero bundle={bundle} />
        <Journey bundle={bundle} />
        <WhyChoose bundle={bundle} />
        <Accommodation bundle={bundle} />
        <Amenities bundle={bundle} />
        <Experiences bundle={bundle} />
        <Gallery bundle={bundle} />
        <Nearby bundle={bundle} />
        <Availability bundle={bundle} />
        <Testimonials bundle={bundle} />
        <FAQ bundle={bundle} />
        <ContactCTA bundle={bundle} />
      </main>
      <Footer bundle={bundle} />
    </div>
  );
}
