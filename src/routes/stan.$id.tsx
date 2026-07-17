import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Apartment } from "@/components/Building3D";
import { Building2, BedDouble, Bath, Maximize2, MapPin, Check, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, CustomLoader } from "@/components/Building3D";
import { Walkthrough } from "@/components/Walkthrough";

export const Route = createFileRoute("/stan/$id")({
  component: StanDetalji,
});

function StanDetalji() {
  const { id } = Route.useParams();
  const [stan, setStan] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [tourMode, setTourMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    supabase
      .from("apartments")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setStan(data as Apartment);
        }
        setLoading(false);
      });

    // POZADINSKO UČITAVANJE (PRELOADING)
    // Ovo "krišom" skida 36MB model u pozadini dok korisnik čita tekst o stanu.
    // Kada klikne na 3D Turu, model je već na disku i učitava se instant!
    fetch('/Apartman_final_compressed.glb').catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center opacity-50">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-800 tracking-widest uppercase">Učitavanje podataka...</p>
        </div>
      </div>
    );
  }

  if (!stan) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center flex-col gap-6">
        <h1 className="text-3xl font-bold text-slate-800">Stan nije pronađen</h1>
        <Button asChild>
          <Link href="/">Nazad na početnu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <CustomLoader forceActive={isTransitioning} />
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 bg-white border-b border-slate-100 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-wide uppercase text-slate-900">Rezidencija Vista</span>
        </Link>
        <Button asChild variant="outline" className="rounded-full gap-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            Nazad na početnu
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
                  <Button onClick={() => alert("Uskoro: Zakazivanje razgledanja!")} variant="outline" className="w-full h-14 text-base rounded-xl font-bold bg-white hover:bg-slate-50 border-2">
                    Zakaži Razgledanje
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
              <h3 className="text-xl font-bold mb-4">Kontaktirajte Agenta</h3>
              <p className="text-slate-400 text-sm mb-6">Naš tim je tu da odgovori na sva vaša pitanja vezana za ovaj stan.</p>
              <div className="space-y-4">
                <input type="text" placeholder="Ime i prezime" className="w-full bg-slate-800 border-none rounded-xl h-12 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-white/20" />
                <input type="text" placeholder="Broj telefona" className="w-full bg-slate-800 border-none rounded-xl h-12 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-white/20" />
                <Button onClick={() => alert("Upit poslan!")} className="w-full h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-200 font-bold">Pošalji Upit</Button>
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
    </div>
  );
}
