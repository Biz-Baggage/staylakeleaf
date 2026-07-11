import { useMemo, useState, useRef, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin } from "@/lib/admin.functions";
import {
  listBookings, upsertBooking, deleteBooking,
  type Booking, type BookingStatus,
} from "@/lib/bookings.functions";
import {
  getSiteContent, saveContentSection, resetContentSection,
  saveMediaSlot, deleteMediaSlot,
  addGalleryImage, updateGalleryImage, deleteGalleryImage,
} from "@/lib/content.functions";
import { DEFAULT_CONTENT, SECTION_KEYS, SECTION_LABELS, MEDIA_SLOTS } from "@/lib/site-content-defaults";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Leaf, LogOut, Loader2, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Upload, RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Lake Leaf" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

function AdminPage() {
  const navigate = useNavigate();
  const checkAdminFn = useServerFn(checkAdmin);
  const { data: adminCheck, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkAdminFn(),
    staleTime: 60_000,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/40 px-4">
        <div className="max-w-md text-center bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-display">Not an admin</h1>
          <p className="mt-2 text-muted-foreground text-sm">Your account is signed in but doesn't have admin access.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={signOut}>Sign out</Button>
            <Button asChild><Link to="/">Back to site</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-30">
        <div className="container-page h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg text-primary">
            <Leaf className="h-5 w-5" /> Lake Leaf
            <span className="text-muted-foreground text-sm font-sans">/ admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/">View site</Link></Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1.5" /> Sign out</Button>
          </div>
        </div>
      </header>
      <main className="container-page py-8">
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Images</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>
          <TabsContent value="bookings"><BookingsPanel /></TabsContent>
          <TabsContent value="content"><ContentPanel /></TabsContent>
          <TabsContent value="media"><MediaPanel /></TabsContent>
          <TabsContent value="gallery"><GalleryPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ================= BOOKINGS ================= */

type FormState = {
  id?: string;
  guest_name: string;
  total_guests: number;
  check_in: string;
  check_out: string;
  phone: string;
  notes: string;
  status: BookingStatus;
};

const emptyForm = (dateStr?: string): FormState => {
  const start = dateStr ?? new Date().toISOString().slice(0, 10);
  const next = new Date(new Date(start).getTime() + 86400000).toISOString().slice(0, 10);
  return { guest_name: "", total_guests: 2, check_in: start, check_out: next, phone: "", notes: "", status: "confirmed" };
};

function BookingsPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listBookings);
  const upsertFn = useServerFn(upsertBooking);
  const deleteFn = useServerFn(deleteBooking);

  const { data: bookings = [], isLoading } = useQuery({ queryKey: ["bookings"], queryFn: () => listFn() });

  const [monthOffset, setMonthOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const today = useMemo(() => new Date(), []);
  const view = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthLabel = view.toLocaleString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstWeekday = view.getDay();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(view.getFullYear(), view.getMonth(), d).toISOString().slice(0, 10);
    cells.push(iso);
  }

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const start = new Date(b.check_in);
      const end = new Date(b.check_out);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        const arr = map.get(key) ?? [];
        arr.push(b);
        map.set(key, arr);
      }
    }
    return map;
  }, [bookings]);

  const openNew = (dayIso?: string) => { setForm(emptyForm(dayIso)); setDialogOpen(true); };
  const openEdit = (b: Booking) => {
    setForm({
      id: b.id, guest_name: b.guest_name, total_guests: b.total_guests,
      check_in: b.check_in, check_out: b.check_out,
      phone: b.phone ?? "", notes: b.notes ?? "", status: b.status,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => { await upsertFn({ data: form }); },
    onSuccess: () => { toast.success(form.id ? "Booking updated" : "Booking added"); qc.invalidateQueries({ queryKey: ["bookings"] }); setDialogOpen(false); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await deleteFn({ data: { id } }); },
    onSuccess: () => { toast.success("Booking removed"); qc.invalidateQueries({ queryKey: ["bookings"] }); setDialogOpen(false); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Availability & bookings</h2>
          <p className="text-sm text-muted-foreground mt-1">Add each reservation so the public availability calendar stays accurate.</p>
        </div>
        <Button onClick={() => openNew()}><Plus className="h-4 w-4 mr-1.5" /> New booking</Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={() => setMonthOffset((m) => m - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <h3 className="font-display text-lg">{monthLabel}</h3>
          <Button variant="outline" size="icon" onClick={() => setMonthOffset((m) => m + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs uppercase tracking-widest text-muted-foreground text-center mb-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} className="min-h-[80px]" />;
            const day = Number(iso.slice(8, 10));
            const dayBookings = bookingsByDay.get(iso) ?? [];
            return (
              <button key={i} onClick={() => (dayBookings[0] ? openEdit(dayBookings[0]) : openNew(iso))}
                className="min-h-[80px] rounded-md border border-border p-1.5 text-left hover:border-primary transition-colors bg-background">
                <div className="text-xs font-semibold text-muted-foreground">{day}</div>
                <div className="mt-1 space-y-0.5">
                  {dayBookings.slice(0, 3).map((b) => (
                    <div key={b.id} className={`text-[10px] leading-tight truncate rounded px-1 py-0.5 ${
                      b.status === "cancelled" || b.status === "declined" ? "bg-muted text-muted-foreground line-through"
                        : b.status === "confirmed" ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"
                    }`}>{b.guest_name} ({b.total_guests})</div>
                  ))}
                  {dayBookings.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayBookings.length - 3} more</div>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-lg mb-3">All bookings</h3>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {bookings.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{b.guest_name}</p>
                    <Badge variant={b.status === "cancelled" || b.status === "declined" ? "outline" : b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{b.check_in} → {b.check_out} · {b.total_guests} guest{b.total_guests !== 1 ? "s" : ""}{b.phone ? ` · ${b.phone}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this booking?")) deleteMutation.mutate(b.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit booking" : "New booking"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Guest name</Label><Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} maxLength={200} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Check-in</Label><Input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} /></div>
              <div><Label>Check-out</Label><Input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Total guests</Label><Input type="number" min={1} value={form.total_guests} onChange={(e) => setForm({ ...form, total_guests: Number(e.target.value) })} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as BookingStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Phone (optional)</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter className="gap-2">
            {form.id && (
              <Button variant="outline" onClick={() => { if (confirm("Delete this booking?")) deleteMutation.mutate(form.id!); }} disabled={deleteMutation.isPending}>
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
              </Button>
            )}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {form.id ? "Save changes" : "Add booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= CONTENT EDITOR ================= */

function ContentPanel() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSiteContent);
  const saveFn = useServerFn(saveContentSection);
  const resetFn = useServerFn(resetContentSection);

  const { data: bundle, isLoading } = useQuery({ queryKey: ["site-content-admin"], queryFn: () => getFn() });
  const [section, setSection] = useState<string>(SECTION_KEYS[0]);
  const [draft, setDraft] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bundle) return;
    const current = bundle.content[section] ?? (DEFAULT_CONTENT as any)[section] ?? {};
    setDraft(JSON.stringify(current, null, 2));
    setError(null);
  }, [section, bundle]);

  const saveMut = useMutation({
    mutationFn: async () => {
      let parsed: any;
      try { parsed = JSON.parse(draft); } catch (e) { throw new Error("Invalid JSON: " + (e as Error).message); }
      await saveFn({ data: { section, data: parsed } });
    },
    onSuccess: () => { toast.success("Section saved"); qc.invalidateQueries({ queryKey: ["site-content-admin"] }); qc.invalidateQueries({ queryKey: ["site-content-public"] }); },
    onError: (e) => { const m = e instanceof Error ? e.message : "Save failed"; setError(m); toast.error(m); },
  });

  const resetMut = useMutation({
    mutationFn: async () => { await resetFn({ data: { section } }); },
    onSuccess: () => {
      toast.success("Reset to default");
      const def = (DEFAULT_CONTENT as any)[section] ?? {};
      setDraft(JSON.stringify(def, null, 2));
      qc.invalidateQueries({ queryKey: ["site-content-admin"] });
      qc.invalidateQueries({ queryKey: ["site-content-public"] });
    },
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl">Site content</h2>
        <p className="text-sm text-muted-foreground mt-1">Every section on the landing page. Edit the text, save, and it goes live.</p>
      </div>
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="min-w-[240px]">
            <Label>Section</Label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SECTION_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>{SECTION_LABELS[k] ?? k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { if (confirm("Reset this section to defaults?")) resetMut.mutate(); }} disabled={resetMut.isPending}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
            </Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />} Save section
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Section fields (JSON) — edit strings between the quotes</Label>
          <Textarea value={draft} onChange={(e) => { setDraft(e.target.value); setError(null); }} rows={22} className="font-mono text-xs mt-1" spellCheck={false} />
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
      </Card>
    </div>
  );
}

/* ================= MEDIA UPLOADER ================= */

function uploadToBucket(file: File, prefix: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return supabase.storage.from("site-media").upload(path, file, { cacheControl: "3600", upsert: false }).then((res) => {
    if (res.error) throw new Error(res.error.message);
    return `/api/public/media/${path}`;
  });
}

function MediaPanel() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSiteContent);
  const saveFn = useServerFn(saveMediaSlot);
  const delFn = useServerFn(deleteMediaSlot);

  const { data: bundle, isLoading } = useQuery({ queryKey: ["site-content-admin"], queryFn: () => getFn() });

  const uploadMut = useMutation({
    mutationFn: async ({ slot, file }: { slot: string; file: File }) => {
      const url = await uploadToBucket(file, slot);
      await saveFn({ data: { slot, url } });
    },
    onSuccess: () => { toast.success("Image updated"); qc.invalidateQueries({ queryKey: ["site-content-admin"] }); qc.invalidateQueries({ queryKey: ["site-content-public"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
  });
  const delMut = useMutation({
    mutationFn: async (slot: string) => { await delFn({ data: { slot } }); },
    onSuccess: () => { toast.success("Image removed"); qc.invalidateQueries({ queryKey: ["site-content-admin"] }); qc.invalidateQueries({ queryKey: ["site-content-public"] }); },
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl">Site images</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload a new photo for any named slot. Falls back to the built-in image if empty.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MEDIA_SLOTS.map((s) => {
          const current = bundle?.media[s.slot];
          return <MediaSlotCard key={s.slot} slot={s.slot} label={s.label} url={current?.url}
            onUpload={(file) => uploadMut.mutate({ slot: s.slot, file })}
            onDelete={() => { if (confirm("Remove this image? Falls back to default.")) delMut.mutate(s.slot); }}
            uploading={uploadMut.isPending} />;
        })}
      </div>
    </div>
  );
}

function MediaSlotCard({ slot, label, url, onUpload, onDelete, uploading }: {
  slot: string; label: string; url?: string; onUpload: (f: File) => void; onDelete: () => void; uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] bg-secondary/60 grid place-items-center relative">
        {url ? <img src={url} alt={label} className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">No custom image</span>}
      </div>
      <div className="p-4 space-y-2">
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">slot: {slot}</p>
        </div>
        <div className="flex gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = "";
          }} />
          <Button size="sm" variant="outline" className="flex-1" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
          </Button>
          {url && <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>}
        </div>
      </div>
    </Card>
  );
}

/* ================= GALLERY MANAGER ================= */

function GalleryPanel() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSiteContent);
  const addFn = useServerFn(addGalleryImage);
  const updFn = useServerFn(updateGalleryImage);
  const delFn = useServerFn(deleteGalleryImage);

  const { data: bundle, isLoading } = useQuery({ queryKey: ["site-content-admin"], queryFn: () => getFn() });
  const gallery = bundle?.gallery ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        const url = await uploadToBucket(file, "gallery");
        await addFn({ data: { url } });
      }
    },
    onSuccess: () => { toast.success("Added to gallery"); qc.invalidateQueries({ queryKey: ["site-content-admin"] }); qc.invalidateQueries({ queryKey: ["site-content-public"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => { await delFn({ data: { id } }); },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["site-content-admin"] }); qc.invalidateQueries({ queryKey: ["site-content-public"] }); },
  });

  const moveMut = useMutation({
    mutationFn: async ({ id, sort_order }: { id: string; sort_order: number }) => { await updFn({ data: { id, sort_order } }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["site-content-admin"] }); qc.invalidateQueries({ queryKey: ["site-content-public"] }); },
  });

  const move = (idx: number, dir: -1 | 1) => {
    const target = gallery[idx + dir]; const item = gallery[idx];
    if (!target || !item) return;
    moveMut.mutate({ id: item.id, sort_order: target.sort_order });
    moveMut.mutate({ id: target.id, sort_order: item.sort_order });
  };

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Gallery</h2>
          <p className="text-sm text-muted-foreground mt-1">Photos shown in the Gallery section and on /gallery. Drag order with the arrows.</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
          const files = Array.from(e.target.files ?? []); if (files.length) uploadMut.mutate(files); e.target.value = "";
        }} />
        <Button onClick={() => inputRef.current?.click()} disabled={uploadMut.isPending}>
          {uploadMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />} Add photos
        </Button>
      </div>

      {gallery.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No photos yet. The public gallery falls back to the built-in shots until you add your own.</Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((g, i) => (
            <Card key={g.id} className="overflow-hidden group relative">
              <img src={g.url} alt={g.caption ?? ""} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-end p-2 gap-1">
                <Button size="icon" variant="secondary" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="secondary" onClick={() => move(i, 1)} disabled={i === gallery.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="destructive" className="ml-auto" onClick={() => { if (confirm("Remove photo?")) delMut.mutate(g.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
