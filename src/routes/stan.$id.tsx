import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Apartment, apartmentsData } from "@/data/apartments";
import { Building2, BedDouble, Bath, Maximize2, MapPin, Check, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/components/Building3D";
import { Walkthrough } from "@/components/Walkthrough";
import { toast } from "sonner";
import { VistaLoader } from "@/components/VistaLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/stan/$id")({
  component: StanDetalji,
});

function StanDetalji() {
  const { id } = Route.useParams();
  const [stan, setStan] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [tourMode, setTourMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // States za Zakaži razgledanje modal
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [viewingName, setViewingName] = useState("");
  const [viewingPhone, setViewingPhone] = useState("");
  const [viewingEmail, setViewingEmail] = useState("");
  const [viewingDateTime, setViewingDateTime] = useState("");
  const [viewingMessage, setViewingMessage] = useState("");
  const [viewingSending, setViewingSending] = useState(false);

  // States za Kontakt agenta formu
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentMessage, setAgentMessage] = useState("");
  const [agentSending, setAgentSending] = useState(false);

  // Prevent scroll when loading
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  useEffect(() => {
    const found = apartmentsData.find((a) => a.id === id);
    if (found) {
      setStan(found);
    }
    
    // Simulate premium loader duration
    const t = setTimeout(() => {
      setLoading(false);
    }, 900);

    // POZADINSKO UČITAVANJE (PRELOADING)
    fetch('https://files.hodzicmirza.com/Apartman_FINALNA_VERZIJA_1-optimized.glb').catch(() => { });

    return () => clearTimeout(t);
  }, [id]);

  // Submit funkcija za zakazivanje razgledanja
  async function handleScheduleViewing() {
    if (!viewingName || !viewingPhone || !viewingDateTime) {
      toast.error("Molimo vas da unesete ime, broj telefona i datum.");
      return;
    }
    setViewingSending(true);

    const payload = {
      apartment_id: stan?.id || null,
      name: viewingName,
      phone: viewingPhone,
      email: viewingEmail || null,
      message: `Zahtjev za razgledanje stana. Datum i vrijeme: ${viewingDateTime}. Dodatna poruka: ${viewingMessage || 'Nema dodatne poruke.'}`,
    };

    // Save directly to localStorage (Fully static project requirement)
    const localInquiries = JSON.parse(localStorage.getItem("local_inquiries") || "[]");
    localInquiries.push({ 
      ...payload, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString() 
    });
    localStorage.setItem("local_inquiries", JSON.stringify(localInquiries));

    // Simulate short submission
    await new Promise((r) => setTimeout(r, 400));
    setViewingSending(false);

    toast.success("Zahtjev za razgledanje je uspješno poslan!");
    setShowViewingModal(false);
    
    // Resetuj formu
    setViewingName("");
    setViewingPhone("");
    setViewingEmail("");
    setViewingDateTime("");
    setViewingMessage("");
  }

  // Submit funkcija za slanje upita agentu
  async function handleSendInquiry() {
    if (!agentName || !agentPhone) {
      toast.error("Molimo vas da unesete ime i broj telefona.");
      return;
    }
    setAgentSending(true);

    const payload = {
      apartment_id: stan?.id || null,
      name: agentName,
      phone: agentPhone,
      email: agentEmail || null,
      message: agentMessage || "Zanimaju me dodatne informacije o ovom stanu.",
    };

    // Save directly to localStorage (Fully static project requirement)
    const localInquiries = JSON.parse(localStorage.getItem("local_inquiries") || "[]");
    localInquiries.push({ 
      ...payload, 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString() 
    });
    localStorage.setItem("local_inquiries", JSON.stringify(localInquiries));

    // Simulate short submission
    await new Promise((r) => setTimeout(r, 400));
    setAgentSending(false);

    toast.success("Upit je uspješno poslan agentu!");
    
    // Resetuj formu
    setAgentName("");
    setAgentPhone("");
    setAgentEmail("");
    setAgentMessage("");
  }

  if (loading) {
    return <VistaLoader loading={true} />;
  }

  if (!stan) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center flex-col gap-6">
        <h1 className="text-3xl font-bold text-slate-800">Stan nije pronađen</h1>
        <Button asChild>
          <Link to="/">Nazad na početnu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <VistaLoader loading={isTransitioning} />
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5 bg-white border-b border-slate-100 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xs sm:text-base md:text-lg tracking-wide uppercase text-slate-900 whitespace-nowrap">
            Rezidencija Vista
          </span>
        </Link>
        <Button asChild variant="outline" className="rounded-full gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10">
          <Link to="/">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Nazad na početnu</span>
            <span className="inline sm:hidden">Nazad</span>
          </Link>
        </Button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold tracking-widest uppercase mb-4">
            <MapPin className="w-3 h-3" />
            Rezidencija Vista
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            {stan.title || `Stan ${stan.number}`}
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            {stan.floor}. sprat · {stan.orientation}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="w-full aspect-video rounded-3xl overflow-hidden bg-slate-100 ring-1 ring-slate-900/5">
                {stan.image_url ? (
                  <img src={stan.image_url} alt="Stan" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">Nema slike</div>
                )}
              </div>
              {/* Fake thumbnails for premium look */}
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-32 aspect-video rounded-xl bg-slate-200 shrink-0 border-2 border-transparent hover:border-slate-900 transition-colors cursor-pointer overflow-hidden">
                    {stan.image_url && <img src={stan.image_url} alt="Stan" className="w-full h-full object-cover opacity-80 hover:opacity-100" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">O nekretnini</h2>
              <div className="prose prose-slate prose-lg">
                <p className="text-slate-600 leading-relaxed">
                  {stan.description || "Ovaj stan nudi vrhunski komfor i moderan dizajn. Opremljen je najkvalitetnijim materijalima i spreman je da postane vaš novi dom iz snova. Veliki prozori obezbjeđuju mnogo prirodne svjetlosti."}
                </p>
              </div>
            </section>

            {/* Features */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pogodnosti objekta</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...(stan.features || []), "Smart Home Ready", "Video Nadzor", "Podno Grijanje", "Klima Uređaj", "Lift"].slice(0, 6).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-2xl ring-1 ring-slate-900/5 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-slate-700" />
                    </div>
                    <span className="font-medium text-slate-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:sticky lg:top-32 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5">
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Ukupna cijena</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{formatPrice(stan.price)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <Maximize2 className="w-5 h-5 text-slate-400 mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{Number(stan.area).toFixed(0)}<span className="text-base font-normal text-slate-500 ml-1">m²</span></p>
                    <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Površina</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <BedDouble className="w-5 h-5 text-slate-400 mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{stan.rooms}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Sobe</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <Button
                    onClick={() => {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setTourMode(true);
                        setIsTransitioning(false);
                      }, 800);
                    }}
                    className="w-full h-14 text-base rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-amber-500/50 hover:border-amber-400 hover:translate-y-[-2px] transition-all"
                  >
                    <Eye className="w-5 h-5" />
                    Započni 3D Turu
                  </Button>
                  <Button 
                    onClick={() => setShowViewingModal(true)} 
                    variant="outline" 
                    className="w-full h-14 text-base rounded-xl font-bold bg-white hover:bg-slate-50 border-2 cursor-pointer"
                  >
                    Zakaži Razgledanje
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
              <h3 className="text-xl font-bold mb-4">Kontaktirajte Agenta</h3>
              <p className="text-slate-400 text-sm mb-6">Naš tim je tu da odgovori na sva vaša pitanja vezana za ovaj stan.</p>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Ime i prezime" 
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-slate-800 border-none rounded-xl h-12 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-white/20" 
                />
                <input 
                  type="text" 
                  placeholder="Broj telefona" 
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  className="w-full bg-slate-800 border-none rounded-xl h-12 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-white/20" 
                />
                <input 
                  type="email" 
                  placeholder="E-mail (opcionalno)" 
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                  className="w-full bg-slate-800 border-none rounded-xl h-12 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-white/20" 
                />
                <textarea 
                  placeholder="Vaša poruka (opcionalno)" 
                  rows={3}
                  value={agentMessage}
                  onChange={(e) => setAgentMessage(e.target.value)}
                  className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-white/20 resize-none text-sm" 
                />
                <Button 
                  onClick={handleSendInquiry} 
                  disabled={agentSending}
                  className="w-full h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-200 font-bold cursor-pointer disabled:opacity-50"
                >
                  {agentSending ? "Slanje..." : "Pošalji Upit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 mt-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Building2 className="w-8 h-8 text-white mx-auto mb-6 opacity-50" />
          <p className="text-slate-500 text-sm">© 2026 Rezidencija Vista. Sva prava zadržana.</p>
        </div>
      </footer>

      {tourMode && (
        <Walkthrough onClose={() => {
          setIsTransitioning(true);
          setTimeout(() => {
            setTourMode(false);
            setIsTransitioning(false);
          }, 800);
        }} />
      )}

      {/* Modal za zakazivanje razgledanja */}
      <Dialog open={showViewingModal} onOpenChange={setShowViewingModal}>
        <DialogContent className="max-w-md w-[calc(100vw-1.5rem)] rounded-3xl bg-white text-slate-900 border border-slate-100 p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">Zakaži razgledanje</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Unesite vaše kontakt podatke i željeni termin za obilazak stana.</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="viewing-name" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ime i prezime</Label>
              <Input
                id="viewing-name"
                placeholder="Npr. Mirza Hodžić"
                value={viewingName}
                onChange={(e) => setViewingName(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-slate-900 text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="viewing-phone" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Broj telefona</Label>
              <Input
                id="viewing-phone"
                placeholder="Npr. +387 61 123 456"
                value={viewingPhone}
                onChange={(e) => setViewingPhone(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-slate-900 text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="viewing-email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">E-mail (opcionalno)</Label>
              <Input
                id="viewing-email"
                type="email"
                placeholder="Npr. mirza@example.com"
                value={viewingEmail}
                onChange={(e) => setViewingEmail(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-slate-900 text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="viewing-datetime" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Datum i vrijeme obilaska</Label>
              <Input
                id="viewing-datetime"
                type="datetime-local"
                value={viewingDateTime}
                onChange={(e) => setViewingDateTime(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus-visible:ring-slate-900 text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="viewing-message" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dodatna napomena (opcionalno)</Label>
              <textarea
                id="viewing-message"
                placeholder="Npr. Želim pogledati i parking mjesta..."
                rows={2}
                value={viewingMessage}
                onChange={(e) => setViewingMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 px-4 text-slate-950 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowViewingModal(false)} className="rounded-xl h-12 flex-1 cursor-pointer">
              Otkaži
            </Button>
            <Button onClick={handleScheduleViewing} disabled={viewingSending} className="rounded-xl h-12 bg-slate-900 text-white hover:bg-slate-800 flex-1 cursor-pointer disabled:opacity-50">
              {viewingSending ? "Slanje..." : "Zakaži Obilazak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
