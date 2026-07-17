import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Prijava · Rezidencija Vista" },
      { name: "description", content: "Prijava za administratore Rezidencije Vista." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Nalog kreiran. Prijavljujem…");
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Try to claim admin (only works if no admin exists yet)
      await supabase.rpc("claim_first_admin");
      toast.success("Prijavljeni ste.");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message ?? "Greška pri prijavi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-gradient-to-b from-sky-200 to-stone-200">
      <div className="w-full max-w-sm bg-background rounded-xl border border-border p-6 shadow-lg">
        <Link to="/" className="text-xs text-muted-foreground hover:underline">
          ← Nazad na zgradu
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {mode === "signin" ? "Prijava" : "Registracija"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pristup admin panelu za upravljanje stanovima.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Molim sačekajte…" : mode === "signin" ? "Prijavi se" : "Registruj se"}
          </Button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-xs text-muted-foreground hover:underline w-full text-center"
        >
          {mode === "signin" ? "Nemate nalog? Registrujte se" : "Već imate nalog? Prijavite se"}
        </button>
        <p className="mt-4 text-[11px] text-muted-foreground text-center">
          Prvi registrovani korisnik automatski postaje administrator.
        </p>
      </div>
    </div>
  );
}
