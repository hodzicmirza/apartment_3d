import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, LogOut, Home } from "lucide-react";
import type { Apartment } from "@/components/Building3D";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Rezidencija Vista" },
      { name: "description", content: "Upravljanje stanovima u Rezidenciji Vista." },
    ],
  }),
  component: AdminPage,
});

type FormState = Partial<Apartment> & { features_text?: string };

const STATUS_LABEL: Record<string, string> = {
  available: "Slobodan",
  reserved: "Rezerviran",
  sold: "Prodan",
};
const STATUS_COLOR: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-200",
  reserved: "bg-amber-100 text-amber-800 border-amber-200",
  sold: "bg-red-100 text-red-800 border-red-200",
};

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/auth" });
        return;
      }
      // Try to claim first admin (no-op if admin exists)
      await supabase.rpc("claim_first_admin");
      const { data } = await supabase.rpc("has_role", {
        _user_id: sess.session.user.id,
        _role: "admin",
      });
      setIsAdmin(Boolean(data));
      setChecking(false);
      load();
    })();
  }, [navigate]);

  async function load() {
    const { data, error } = await supabase
      .from("apartments")
      .select("*")
      .order("floor")
      .order("side")
      .order("unit_on_floor");
    if (error) toast.error(error.message);
    else setApartments((data as any) ?? []);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const payload: any = {
      number: editing.number,
      title: editing.title || null,
      description: editing.description || null,
      floor: Number(editing.floor),
      unit_on_floor: Number(editing.unit_on_floor),
      side: editing.side,
      rooms: Number(editing.rooms),
      bathrooms: Number(editing.bathrooms),
      area: Number(editing.area),
      price: Number(editing.price),
      status: editing.status,
      orientation: editing.orientation || null,
      image_url: editing.image_url || null,
      features: (editing.features_text ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("apartments").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("apartments").insert(payload));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Sačuvano");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Obrisati stan?")) return;
    const { error } = await supabase.from("apartments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Obrisano");
      load();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (checking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Provjeravam pristup…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Nemate admin pristup</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Administrator već postoji za ovaj projekat.
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Nazad</Link>
            </Button>
            <Button onClick={signOut}>Odjava</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-muted/30">
      <header className="sticky top-0 z-10 bg-background border-b border-border p-3 sm:p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-semibold">Admin · Stanovi</h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              {apartments.length} stanova
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <Home className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() =>
                setEditing({
                  number: "",
                  floor: 1,
                  unit_on_floor: 1,
                  side: "front",
                  rooms: 2,
                  bathrooms: 1,
                  area: 60,
                  price: 100000,
                  status: "available",
                  features_text: "",
                })
              }
            >
              <Plus className="w-4 h-4 mr-1" /> Novi
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-2">
        {apartments.map((a) => (
          <div
            key={a.id}
            className="bg-background border border-border rounded-lg p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">Stan {a.number}</span>
                <Badge variant="outline" className={STATUS_COLOR[a.status]}>
                  {STATUS_LABEL[a.status]}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {a.floor}. sprat · {a.side === "front" ? "prednji" : "zadnji"} · {a.rooms} sobe ·{" "}
                {Number(a.area).toFixed(0)} m² ·{" "}
                {new Intl.NumberFormat("bs-BA", {
                  style: "currency",
                  currency: "BAM",
                  maximumFractionDigits: 0,
                }).format(Number(a.price))}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  setEditing({
                    ...a,
                    features_text: (a.features ?? []).join(", "),
                  })
                }
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(a.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-1.5rem)] max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Uredi stan" : "Novi stan"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Broj">
                <Input
                  value={editing.number ?? ""}
                  onChange={(e) => setEditing({ ...editing, number: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Slobodan</SelectItem>
                    <SelectItem value="reserved">Rezerviran</SelectItem>
                    <SelectItem value="sold">Prodan</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Naslov" full>
                <Input
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </Field>
              <Field label="Opis" full>
                <Textarea
                  rows={2}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </Field>
              <Field label="Sprat">
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={editing.floor ?? 1}
                  onChange={(e) => setEditing({ ...editing, floor: Number(e.target.value) })}
                />
              </Field>
              <Field label="Broj na spratu">
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={editing.unit_on_floor ?? 1}
                  onChange={(e) =>
                    setEditing({ ...editing, unit_on_floor: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Strana">
                <Select
                  value={editing.side}
                  onValueChange={(v) => setEditing({ ...editing, side: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front">Prednja</SelectItem>
                    <SelectItem value="back">Zadnja</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Orijentacija">
                <Input
                  value={editing.orientation ?? ""}
                  onChange={(e) => setEditing({ ...editing, orientation: e.target.value })}
                />
              </Field>
              <Field label="Sobe">
                <Input
                  type="number"
                  value={editing.rooms ?? 1}
                  onChange={(e) => setEditing({ ...editing, rooms: Number(e.target.value) })}
                />
              </Field>
              <Field label="Kupatila">
                <Input
                  type="number"
                  value={editing.bathrooms ?? 1}
                  onChange={(e) => setEditing({ ...editing, bathrooms: Number(e.target.value) })}
                />
              </Field>
              <Field label="Površina (m²)">
                <Input
                  type="number"
                  value={editing.area ?? 0}
                  onChange={(e) => setEditing({ ...editing, area: Number(e.target.value) })}
                />
              </Field>
              <Field label="Cijena (KM)">
                <Input
                  type="number"
                  value={editing.price ?? 0}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                />
              </Field>
              <Field label="Slika (URL)" full>
                <Input
                  value={editing.image_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                />
              </Field>
              <Field label="Karakteristike (odvojene zarezima)" full>
                <Input
                  placeholder="Balkon, Parking, Klima"
                  value={editing.features_text ?? ""}
                  onChange={(e) => setEditing({ ...editing, features_text: e.target.value })}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Otkaži
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Čuvam…" : "Sačuvaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
