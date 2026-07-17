import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Sky, PerformanceMonitor, useProgress } from "@react-three/drei";
import { useEffect, useMemo, useState, Suspense, memo, useCallback, useRef } from "react";
import * as THREE from "three";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Walkthrough } from "./Walkthrough";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BedDouble, Bath, Maximize2, Minimize2, MapPin, Settings, Sparkles, Eye, Building2 } from "lucide-react";

export type Apartment = {
  id: string;
  number: string;
  title: string | null;
  description: string | null;
  floor: number;
  unit_on_floor: number;
  side: "front" | "back";
  rooms: number;
  bathrooms: number;
  area: number;
  price: number;
  status: "available" | "reserved" | "sold";
  orientation: string | null;
  features: string[];
  image_url: string | null;
};

const FLOORS = 6;
const UNITS_PER_SIDE = 4;
const APTS_PER_FLOOR = UNITS_PER_SIDE * 2;

const STATUS_COLORS: Record<Apartment["status"], string> = {
  available: "#4ade80",
  reserved: "#fbbf24",
  sold: "#f87171",
};

const STATUS_LABEL: Record<Apartment["status"], string> = {
  available: "Slobodan",
  reserved: "Rezerviran",
  sold: "Prodan",
};

type StanJedinicaProps = {
  apt: Apartment;
  position: [number, number, number];
  size: [number, number, number];
  onSelect: (a: Apartment) => void;
};

const stanGeometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
};

const stanMaterials = {
  crossBar: new THREE.MeshLambertMaterial({ color: "#111827" }),
  slab: new THREE.MeshLambertMaterial({ color: "#e7e5e4" }),
  railing: new THREE.MeshLambertMaterial({ color: "#93c5fd", transparent: true, opacity: 0.35 }),
  post: new THREE.MeshLambertMaterial({ color: "#1f2937" }),
};

const StanJedinica = memo(function StanJedinica({
  apt,
  position,
  size,
  onSelect,
}: StanJedinicaProps) {
  const [hovered, setHovered] = useState(false);
  const [w, h, d] = size;
  const color = STATUS_COLORS[apt.status];
  const materialRef = useRef<THREE.MeshLambertMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const baseZ = position[2];

  useFrame(() => {
    if (materialRef.current) {
      const targetIntensity = hovered ? 0.9 : 0.25;
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetIntensity,
        0.1,
      );
      const targetOpacity = hovered ? 0.92 : 0.78;
      materialRef.current.opacity = THREE.MathUtils.lerp(
        materialRef.current.opacity,
        targetOpacity,
        0.1,
      );
    }
    if (groupRef.current) {
      const targetZ = hovered ? baseZ + 0.15 : baseZ;
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        targetZ,
        0.15,
      );
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {/* Glass window */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(apt);
        }}
      >
        <boxGeometry args={[w * 0.82, h * 0.65, d]} />
        <meshLambertMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
          transparent
          opacity={0.78}
        />
      </mesh>
      {/* Window frame */}
      {/* Window cross bar */}
      <mesh
        position={[0, 0, d * 0.55]}
        geometry={stanGeometries.box}
        scale={[w * 0.82, 0.02, 0.015]}
        material={stanMaterials.crossBar}
      />
      <mesh
        position={[0, 0, d * 0.55]}
        geometry={stanGeometries.box}
        scale={[0.02, h * 0.65, 0.015]}
        material={stanMaterials.crossBar}
      />
      {/* Balcony slab */}
      <mesh
        position={[0, -h * 0.4, d * 0.7]}
        geometry={stanGeometries.box}
        scale={[w * 0.95, 0.05, d * 1.4]}
        material={stanMaterials.slab}
      />
      {/* Balcony railing */}
      <mesh
        position={[0, -h * 0.28, d * 1.35]}
        geometry={stanGeometries.box}
        scale={[w * 0.95, 0.22, 0.02]}
        material={stanMaterials.railing}
      />
      {/* Railing posts */}
      {[-w * 0.45, 0, w * 0.45].map((x, i) => (
        <mesh
          key={i}
          position={[x, -h * 0.28, d * 1.35]}
          geometry={stanGeometries.box}
          scale={[0.025, 0.24, 0.025]}
          material={stanMaterials.post}
        />
      ))}

      {hovered && (
        <Html distanceFactor={10} position={[0, h * 0.55, 0]} center>
          <div className="pointer-events-none rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl border border-slate-700 whitespace-nowrap">
            Stan {apt.number} · {Number(apt.area).toFixed(0)} m²
          </div>
        </Html>
      )}
    </group>
  );
});

const Drvo = memo(function Drvo({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.8, 8]} />
        <meshLambertMaterial color="#78350f" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.5, 1.4, 10]} />
        <meshLambertMaterial color="#166534" />
      </mesh>
    </group>
  );
});

export function CustomLoader({ forceActive }: { forceActive?: boolean }) {
  const { active, progress } = useProgress();
  const show = active || forceActive;
  const displayProgress = forceActive ? 100 : progress;

  return (
    <div 
      className={`absolute inset-0 w-full h-full z-[40] flex flex-col items-center justify-center bg-gradient-to-b from-sky-300 via-sky-100 to-stone-200 transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="flex flex-col items-center animate-pulse">
        <Building2 className="w-16 h-16 text-slate-800 mb-6" />
        <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-slate-800 mb-3">Rezidencija Vista</h2>
        <div className="w-48 sm:w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-slate-800 transition-all duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">{Math.round(displayProgress)}% UČITANO</p>
      </div>
    </div>
  );
}

const Zgrada = memo(function Zgrada({
  stanovi,
  onSelect,
}: {
  stanovi: Apartment[];
  onSelect: (a: Apartment) => void;
}) {
  const aptW = 1.4;
  const aptH = 1.0;
  const aptD = 0.18;
  const gap = 0.1;
  const baseY = 0.6;

  const buildingWidth = UNITS_PER_SIDE * (aptW + gap) + 0.4;
  const buildingHeight = FLOORS * (aptH + gap) + 0.3;
  const buildingDepth = 3.4;

  return (
    <group position={[0, -buildingHeight / 2 - baseY / 2, 0]}>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[22, 64]} />
        <meshLambertMaterial color="#cbd5c0" />
      </mesh>
      {/* Walkway front */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, buildingDepth / 2 + 1.8]}>
        <planeGeometry args={[buildingWidth * 0.6, 3.4]} />
        <meshLambertMaterial color="#9ca3af" />
      </mesh>
      {/* Trees */}
      <Drvo position={[-buildingWidth / 2 - 1.2, 0, buildingDepth / 2 + 0.6]} />
      <Drvo position={[buildingWidth / 2 + 1.2, 0, buildingDepth / 2 + 0.6]} />
      <Drvo position={[-buildingWidth / 2 - 1.6, 0, -buildingDepth / 2 - 0.5]} />
      <Drvo position={[buildingWidth / 2 + 1.6, 0, -buildingDepth / 2 - 0.5]} />

      {/* Brick podium base */}
      <mesh position={[0, baseY / 2, 0]}>
        <boxGeometry args={[buildingWidth + 0.8, baseY, buildingDepth + 0.6]} />
        <meshLambertMaterial color="#9a3412" />
      </mesh>
      {/* Podium trim */}
      <mesh position={[0, baseY + 0.03, 0]}>
        <boxGeometry args={[buildingWidth + 0.9, 0.08, buildingDepth + 0.7]} />
        <meshLambertMaterial color="#292524" />
      </mesh>

      {/* Building main mass */}
      <mesh position={[0, baseY + buildingHeight / 2, 0]}>
        <boxGeometry args={[buildingWidth, buildingHeight, buildingDepth]} />
        <meshLambertMaterial color="#f5f0e6" />
      </mesh>

      {/* Corner pilasters */}
      {[
        [-buildingWidth / 2, buildingDepth / 2],
        [buildingWidth / 2, buildingDepth / 2],
        [-buildingWidth / 2, -buildingDepth / 2],
        [buildingWidth / 2, -buildingDepth / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, baseY + buildingHeight / 2, z]}>
          <boxGeometry args={[0.15, buildingHeight, 0.15]} />
          <meshLambertMaterial color="#e7e2d5" />
        </mesh>
      ))}

      {/* Horizontal floor bands */}
      {Array.from({ length: FLOORS + 1 }).map((_, i) => (
        <mesh key={`band-${i}`} position={[0, baseY + i * (aptH + gap) + 0.02, 0]}>
          <boxGeometry args={[buildingWidth + 0.15, 0.05, buildingDepth + 0.15]} />
          <meshLambertMaterial color="#d6d3d1" />
        </mesh>
      ))}

      {/* Apartment windows: front */}
      {stanovi
        .filter((a) => a.side === "front")
        .map((apt) => {
          const floorIdx = apt.floor - 1;
          const u = apt.unit_on_floor - 1;
          const x = (u - (UNITS_PER_SIDE - 1) / 2) * (aptW + gap);
          const y = baseY + floorIdx * (aptH + gap) + aptH / 2 + 0.15;
          const z = buildingDepth / 2 + aptD / 2;
          return (
            <StanJedinica
              key={apt.id}
              apt={apt}
              position={[x, y, z]}
              size={[aptW, aptH, aptD]}
              onSelect={onSelect}
            />
          );
        })}

      {/* Apartment windows: back */}
      {stanovi
        .filter((a) => a.side === "back")
        .map((apt) => {
          const floorIdx = apt.floor - 1;
          const u = apt.unit_on_floor - 1;
          const x = -(u - (UNITS_PER_SIDE - 1) / 2) * (aptW + gap);
          const y = baseY + floorIdx * (aptH + gap) + aptH / 2 + 0.15;
          const z = -buildingDepth / 2 - aptD / 2;
          return (
            <group key={apt.id} rotation={[0, Math.PI, 0]}>
              <StanJedinica
                apt={apt}
                position={[-x, y, -z]}
                size={[aptW, aptH, aptD]}
                onSelect={onSelect}
              />
            </group>
          );
        })}

      {/* Roof */}
      <mesh position={[0, baseY + buildingHeight + 0.12, 0]}>
        <boxGeometry args={[buildingWidth + 0.3, 0.24, buildingDepth + 0.3]} />
        <meshLambertMaterial color="#374151" />
      </mesh>
      {/* Rooftop machinery */}
      <mesh position={[-0.6, baseY + buildingHeight + 0.45, 0]}>
        <boxGeometry args={[0.9, 0.4, 0.9]} />
        <meshLambertMaterial color="#57534e" />
      </mesh>
      <mesh position={[0.8, baseY + buildingHeight + 0.35, 0.4]}>
        <boxGeometry args={[0.6, 0.25, 0.6]} />
        <meshLambertMaterial color="#57534e" />
      </mesh>

      {/* Entrance canopy */}
      <mesh position={[0, baseY + 0.85, buildingDepth / 2 + 0.35]}>
        <boxGeometry args={[1.6, 0.06, 0.7]} />
        <meshLambertMaterial color="#1c1917" />
      </mesh>
      {/* Entrance doors */}
      <mesh position={[0, baseY + 0.42, buildingDepth / 2 + 0.02]}>
        <boxGeometry args={[1.1, 0.85, 0.04]} />
        <meshPhysicalMaterial
          color="#0f172a"

          transmission={0.2}
          thickness={0.2}
        />
      </mesh>
      {/* Ground floor commercial windows */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, baseY + 0.3, buildingDepth / 2 + 0.02]}>
          <boxGeometry args={[1.0, 0.55, 0.03]} />
          <meshPhysicalMaterial
            color="#0ea5e9"
            transparent
            opacity={0.55}

            transmission={0.6}
            thickness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
});

export function formatPrice(p: number) {
  return new Intl.NumberFormat("bs-BA", {
    style: "currency",
    currency: "BAM",
    maximumFractionDigits: 0,
  }).format(p);
}

export function Building3D({ isFullscreen, onToggleFullscreen }: { isFullscreen?: boolean, onToggleFullscreen?: () => void }) {
  const [stanovi, setStanovi] = useState<Apartment[]>([]);
  const [ucitavanje, setUcitavanje] = useState(true);
  const [izabraniStan, setIzabraniStan] = useState<Apartment | null>(null);
  const [dpr, setDpr] = useState(1);
  const [tourMode, setTourMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, 1.5));
    let mounted = true;
    async function load() {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .order("floor", { ascending: true })
        .order("side", { ascending: true })
        .order("unit_on_floor", { ascending: true });
      if (!mounted) return;
      if (error) console.error(error);
      setStanovi((data as any) ?? []);
      setUcitavanje(false);
    }
    load();

    const channel = supabase
      .channel("apartments-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "apartments" },
        (payload) => {
          const updated = payload.new as Apartment;
          setStanovi((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setIzabraniStan((prev) => (prev?.id === updated.id ? updated : prev));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "apartments" },
        (payload) => {
          const inserted = payload.new as Apartment;
          setStanovi((prev) => [...prev, inserted]);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "apartments" },
        (payload) => {
          const deletedId = payload.old.id;
          setStanovi((prev) => prev.filter((a) => a.id !== deletedId));
          setIzabraniStan((prev) => (prev?.id === deletedId ? null : prev));
        },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelect = useCallback((a: Apartment) => {
    window.open(`/stan/${a.id}`, '_blank');
  }, []);

  const statistika = useMemo(
    () => ({
      total: stanovi.length,
      available: stanovi.filter((a) => a.status === "available").length,
      reserved: stanovi.filter((a) => a.status === "reserved").length,
      sold: stanovi.filter((a) => a.status === "sold").length,
    }),
    [stanovi],
  );

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-stone-200">
      <CustomLoader forceActive={isTransitioning} />
      
      {isFullscreen && onToggleFullscreen && (
        <Button 
          onClick={onToggleFullscreen} 
          variant="secondary" 
          className="absolute top-4 right-4 z-[45] gap-2 shadow-md bg-white/90 hover:bg-white text-black"
        >
          <Minimize2 className="w-4 h-4" />
          Zatvori puni ekran
        </Button>
      )}

      <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-6 pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <div className="pointer-events-auto">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
              Rezidencija Vista
            </h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5">
              {FLOORS} spratova · {APTS_PER_FLOOR} stanova po spratu · {statistika.total} ukupno
            </p>
          </div>
        </div>
        <div className="pointer-events-auto flex flex-wrap gap-1.5 mt-2">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur text-[10px] sm:text-xs px-2 py-0.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
            Slobodno {statistika.available}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur text-[10px] sm:text-xs px-2 py-0.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            Rezervirano {statistika.reserved}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur text-[10px] sm:text-xs px-2 py-0.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />
            Prodano {statistika.sold}
          </Badge>
        </div>
      </div>

      <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/85 backdrop-blur px-3 py-1.5 rounded-full text-[10px] sm:text-xs text-muted-foreground shadow-md border border-border text-center whitespace-nowrap">
        Prevuci za rotaciju · Štipni za zoom · Tap na stan
      </div>

      {ucitavanje && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mb-4" />
          <div className="text-sm font-bold text-slate-800 tracking-widest uppercase">Učitavam stanove...</div>
        </div>
      )}

      <Canvas
        dpr={dpr}
        camera={{ position: [8, 5, 10], fov: 50 }}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
        style={{ touchAction: "none" }}
      >
        <color attach="background" args={["#bae6fd"]} />
        <Suspense fallback={null}>
          <PerformanceMonitor onIncline={() => setDpr(1)} onDecline={() => setDpr(0.5)} />
          <Sky distance={450000} sunPosition={[10, 20, 10]} inclination={0} azimuth={0.25} />

          <ambientLight intensity={0.55} />
          <directionalLight
            position={[10, 15, 8]}
            intensity={1.4}

            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-8, 6, -5]} intensity={0.35} color="#fef3c7" />

          <Zgrada stanovi={stanovi} onSelect={handleSelect} />

          <OrbitControls
            enablePan={false}
            enableZoom={!!isFullscreen}
            enableDamping
            dampingFactor={0.08}
            minDistance={5}
            maxDistance={22}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate
            autoRotateSpeed={0.4}
            makeDefault
          />
        </Suspense>
      </Canvas>


      {tourMode && (
        <Walkthrough 
          onClose={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setTourMode(false);
              setIsTransitioning(false);
            }, 800);
          }} 
        />
      )}
    </div>
  );
}
