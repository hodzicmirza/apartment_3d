import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Building2, Maximize2, MapPin, CheckCircle2, ChevronRight, BedDouble, Bath } from "lucide-react";
import { motion } from "framer-motion";
import { apartmentsData } from "@/data/apartments";
const LocationMap = lazy(() => import("@/components/LocationMap"));
const Building3D = lazy(() =>
  import("@/components/Building3D").then((m) => ({ default: m.Building3D })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rezidencija Vista · Interaktivni 3D prikaz zgrade" },
      {
        name: "description",
        content:
          "Istražite stanove u 3D prikazu zgrade. Kliknite na stan za detalje, cijenu i dostupnost.",
      },
      { property: "og:title", content: "Rezidencija Vista · Interaktivni 3D prikaz zgrade" },
      {
        property: "og:description",
        content:
          "Istražite stanove u 3D prikazu zgrade. Kliknite na stan za detalje, cijenu i dostupnost.",
      },
    ],
  }),
  component: Index,
});

function StaticLoader() {
  const [progress, setProgress] = useState(15);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 85 ? prev : prev + 5));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full z-[10] flex flex-col items-center justify-center bg-gradient-to-b from-sky-300 via-sky-100 to-stone-200">
      <div className="flex flex-col items-center animate-pulse">
        <Building2 className="w-16 h-16 text-slate-800 mb-6" />
        <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-slate-800 mb-3">Rezidencija Vista</h2>
        <div className="w-48 sm:w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-slate-800 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">{progress}% UČITANO</p>
      </div>
    </div>
  );
}

function LandingPage({ isSSR = false }: { isSSR?: boolean }) {
  const [featuredApartments, setFeaturedApartments] = useState<any[]>([]);

  useEffect(() => {
    const available = apartmentsData.filter((a) => a.status === "available").slice(0, 3);
    setFeaturedApartments(available);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <Building2 className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-sm sm:text-lg tracking-wide uppercase">Rezidencija Vista</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a href="#" className="text-white transition-colors">Početna</a>
          <a href="#proces" className="hover:text-white transition-colors">O Nama</a>
          <a href="#kontakt" className="hover:text-white transition-colors">Kontakt</a>
        </div>
        <a href="#stanovi" className="inline-block px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-full border border-neutral-700 hover:bg-neutral-800 transition-colors text-xs sm:text-sm font-medium shrink-0">
          <span className="hidden sm:inline">Pogledaj sve stanove</span>
          <span className="inline sm:hidden">Stanovi</span>
        </a>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start pt-16 md:pt-24 px-4 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-widest uppercase mb-8">
          <Building2 className="w-3.5 h-3.5" />
          Kupi Svoj San
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-16 text-center max-w-4xl leading-tight">
          Vaš novi dom počinje ovdje.
        </h1>

        <div className="w-full max-w-[1320px] overflow-hidden shadow-2xl bg-gradient-to-b from-sky-300 via-sky-100 to-stone-200 relative aspect-[4/5] md:aspect-[16/9] rounded-2xl ring-1 ring-white/10 z-[10]">
           {isSSR ? (
             <StaticLoader />
           ) : (
             <Suspense fallback={<StaticLoader />}>
               <Building3D />
             </Suspense>
           )}
        </div>
      </main>

      {/* Premium Content Sections */}
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
          className="bg-white text-slate-900 w-full pt-24 pb-32 px-6"
        >
          <div className="max-w-6xl mx-auto space-y-32">
            
            {/* Izdvojeni stanovi */}
            <motion.section 
              id="stanovi"
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Izdvojeni stanovi</h2>
                <p className="text-slate-500 max-w-2xl text-lg">Pogledajte najtraženije stanove u našoj ponudi. Rezervišite svoj na vrijeme.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {featuredApartments.length > 0 ? (
                  featuredApartments.map((a) => (
                    <Link
                      key={a.id}
                      to="/stan/$id"
                      params={{ id: a.id }}
                      className="group block bg-slate-50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-900/5 hover:-translate-y-1"
                    >
                      <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden">
                        <img
                          src={
                            a.image_url ||
                            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                          }
                          alt={a.title || `Stan ${a.number}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-900">
                          {a.status === "available"
                            ? "Slobodno"
                            : a.status === "reserved"
                              ? "Rezervisano"
                              : "Prodano"}
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold group-hover:text-amber-500 transition-colors">
                            {a.title || `Stan ${a.number}`}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium">
                            {a.floor}. sprat · {a.side === "front" ? "Prednja strana" : "Zadnja strana"}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400 uppercase font-semibold">Kvadratura</span>
                            <span className="font-bold text-slate-900">{Number(a.area).toFixed(0)} m²</span>
                          </div>
                          <div className="flex flex-col border-l border-slate-200 pl-4">
                            <span className="text-xs text-slate-400 uppercase font-semibold">Sobe</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              <BedDouble className="w-3 h-3 text-slate-400" /> {a.rooms}
                            </span>
                          </div>
                          <div className="flex flex-col border-l border-slate-200 pl-4">
                            <span className="text-xs text-slate-400 uppercase font-semibold">Kupatila</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              <Bath className="w-3 h-3 text-slate-400" /> {a.bathrooms}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-slate-400">
                    Učitavanje izdvojenih stanova...
                  </div>
                )}
              </div>
            </motion.section>
            
            {/* Stats Section */}
            <motion.section 
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
            >
              {[
                { value: "45", label: "Luksuznih stanova" },
                { value: "21", label: "Parking mjesta" },
                { value: "2026", label: "Godina izgradnje" },
                { value: "7", label: "Zelenih krovova" }
              ].map((stat, i) => (
                <div key={i} className="text-center md:text-left space-y-2">
                  <div className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">{stat.value}</div>
                  <div className="text-sm md:text-base font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </motion.section>

            {/* Feature Section */}
            <motion.section 
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="grid md:grid-cols-2 gap-16 items-center"
            >
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                  Savršena kombinacija lokacije i funkcionalnosti.
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed max-w-md">
                  Rezidencija Vista predstavlja vrhunac modernog stanovanja. Smještena u mirnom dijelu grada, a ipak na dohvat svih ključnih sadržaja, nudi neusporediv kvalitet gradnje i pažljivo osmišljene tlocrte.
                </p>
                <a href="#proces" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors">
                  Saznajte više <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <div className="relative aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 ring-1 ring-slate-900/5 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-sky-100 to-stone-100 opacity-50 mix-blend-multiply" />
                <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" alt="Lokacija" className="w-full h-full object-cover" />
              </div>
            </motion.section>

            {/* Steps Section */}
            <motion.section 
              id="proces"
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="text-center space-y-16"
            >
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="inline-block px-4 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold tracking-widest uppercase">Proces</div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Jednostavno do ključeva vašeg novog doma</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { title: "Pregledajte ponudu", desc: "Istražite 3D modele i pronađite savršen raspored." },
                  { title: "Kontaktirajte nas", desc: "Zakažite termin za sastanak sa našim agentom." },
                  { title: "Preuzmite ključeve", desc: "Završite papirologiju i uselite se u svoj novi dom." }
                ].map((step, i) => (
                  <div key={i} className="text-left bg-slate-50 p-8 rounded-3xl">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-slate-900 font-black text-xl border border-slate-100">
                      {i + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-slate-500 font-medium">{step.desc}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Lokacija Map */}
            <motion.section 
              variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Pronađite nas</h2>
                <p className="text-slate-500 text-lg">44°08'01.1"N 18°07'25.9"E</p>
              </div>
              <div className="w-full h-[400px] rounded-3xl overflow-hidden ring-1 ring-slate-900/5 shadow-xl bg-slate-100 z-0 relative grayscale">
                {isSSR ? null : (
                  <Suspense fallback={<div className="w-full h-full bg-slate-200 animate-pulse" />}>
                    <LocationMap />
                  </Suspense>
                )}
              </div>
            </motion.section>

          </div>
        </motion.div>

      {/* Footer */}
        <footer id="kontakt" className="bg-[#050505] pt-20 pb-10 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Imate pitanja?<br/>Tu smo za vas.</h2>
              <a href="mailto:info@rezidencija-vista.ba" className="inline-block px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-colors">
                Kontaktirajte Nas
              </a>
            </div>
            <div className="flex flex-col md:items-end justify-end text-neutral-400 space-y-2 text-sm font-medium">
              <a href="#" className="hover:text-white transition-colors">info@rezidencija-vista.ba</a>
              <p>+387 61 123 456</p>
            </div>
          </div>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-neutral-500 text-xs font-medium">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Building2 className="w-4 h-4" />
              <span>Rezidencija Vista © 2026</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privatnost</a>
              <a href="#" className="hover:text-white transition-colors">Uslovi</a>
            </div>
          </div>
        </footer>
    </div>
  );
}

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <LandingPage isSSR={true} />;
  }

  return <LandingPage />;
}
