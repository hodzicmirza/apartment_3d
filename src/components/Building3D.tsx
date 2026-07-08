import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { useEffect, useMemo, useState, Suspense } from "react";
import * as THREE from "three";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BedDouble, Bath, Maximize2, MapPin, Settings, Sparkles } from "lucide-react";

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

type ApartmentBoxProps = {
  apt: Apartment;
  position: [number, number, number];
  size: [number, number, number];
  onSelect: (a: Apartment) => void;
};

function ApartmentUnit({ apt, position, size, onSelect }: ApartmentBoxProps) {
  const [hovered, setHovered] = useState(false);
  const [w, h, d] = size;
  const color = STATUS_COLORS[apt.status];

  return (
    <group position={position}>
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
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.9 : 0.25}
          transparent
          opacity={hovered ? 0.92 : 0.78}
          roughness={0.15}
          metalness={0.2}
          transmission={0.35}
          thickness={0.4}
        />
      </mesh>
      {/* Window frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w * 0.82, h * 0.65, d * 1.02)]} />
        <lineBasicMaterial color="#1f2937" linewidth={2} />
      </lineSegments>
      {/* Window cross bar */}
      <mesh position={[0, 0, d * 0.55]}>
        <boxGeometry args={[w * 0.82, 0.02, 0.015]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0, d * 0.55]}>
        <boxGeometry args={[0.02, h * 0.65, 0.015]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      {/* Balcony slab */}
      <mesh position={[0, -h * 0.4, d * 0.7]} castShadow>
        <boxGeometry args={[w * 0.95, 0.05, d * 1.4]} />
        <meshStandardMaterial color="#e7e5e4" roughness={0.85} />
      </mesh>
      {/* Balcony railing */}
      <mesh position={[0, -h * 0.28, d * 1.35]}>
        <boxGeometry args={[w * 0.95, 0.22, 0.02]} />
        <meshPhysicalMaterial
          color="#93c5fd"
          transparent
          opacity={0.35}
          roughness={0.05}
          transmission={0.9}
          thickness={0.2}
        />
      </mesh>
      {/* Railing posts */}
      {[-w * 0.45, 0, w * 0.45].map((x, i) => (
        <mesh key={i} position={[x, -h * 0.28, d * 1.35]}>
          <boxGeometry args={[0.025, 0.24, 0.025]} />
          <meshStandardMaterial color="#1f2937" metalness={0.6} />
        </mesh>
      ))}

      {hovered && (
        <Html distanceFactor={10} position={[0, h * 0.55, 0]} center>
          <div className="pointer-events-none rounded-md bg-background/95 px-2 py-1 text-xs font-medium shadow-lg border border-border whitespace-nowrap">
            Stan {apt.number} · {Number(apt.area).toFixed(0)} m²
          </div>
        </Html>
      )}
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.8, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.5, 1.4, 10]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
    </group>
  );
}

function Building({ apartments, onSelect }: { apartments: Apartment[]; onSelect: (a: Apartment) => void }) {
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial color="#cbd5c0" roughness={0.95} />
      </mesh>
      {/* Walkway front */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, buildingDepth / 2 + 1.8]} receiveShadow>
        <planeGeometry args={[buildingWidth * 0.6, 3.4]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.9} />
      </mesh>
      {/* Trees */}
      <Tree position={[-buildingWidth / 2 - 1.2, 0, buildingDepth / 2 + 0.6]} />
      <Tree position={[buildingWidth / 2 + 1.2, 0, buildingDepth / 2 + 0.6]} />
      <Tree position={[-buildingWidth / 2 - 1.6, 0, -buildingDepth / 2 - 0.5]} />
      <Tree position={[buildingWidth / 2 + 1.6, 0, -buildingDepth / 2 - 0.5]} />

      {/* Brick podium base */}
      <mesh position={[0, baseY / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[buildingWidth + 0.8, baseY, buildingDepth + 0.6]} />
        <meshStandardMaterial color="#9a3412" roughness={0.9} />
      </mesh>
      {/* Podium trim */}
      <mesh position={[0, baseY + 0.03, 0]}>
        <boxGeometry args={[buildingWidth + 0.9, 0.08, buildingDepth + 0.7]} />
        <meshStandardMaterial color="#292524" roughness={0.6} />
      </mesh>

      {/* Building main mass */}
      <mesh position={[0, baseY + buildingHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[buildingWidth, buildingHeight, buildingDepth]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.85} />
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
          <meshStandardMaterial color="#e7e2d5" roughness={0.8} />
        </mesh>
      ))}

      {/* Horizontal floor bands */}
      {Array.from({ length: FLOORS + 1 }).map((_, i) => (
        <mesh key={`band-${i}`} position={[0, baseY + i * (aptH + gap) + 0.02, 0]}>
          <boxGeometry args={[buildingWidth + 0.15, 0.05, buildingDepth + 0.15]} />
          <meshStandardMaterial color="#d6d3d1" roughness={0.7} />
        </mesh>
      ))}

      {/* Apartment windows: front */}
      {apartments
        .filter((a) => a.side === "front")
        .map((apt) => {
          const floorIdx = apt.floor - 1;
          const u = apt.unit_on_floor - 1;
          const x = (u - (UNITS_PER_SIDE - 1) / 2) * (aptW + gap);
          const y = baseY + floorIdx * (aptH + gap) + aptH / 2 + 0.15;
          const z = buildingDepth / 2 + aptD / 2;
          return (
            <ApartmentUnit
              key={apt.id}
              apt={apt}
              position={[x, y, z]}
              size={[aptW, aptH, aptD]}
              onSelect={onSelect}
            />
          );
        })}

      {/* Apartment windows: back */}
      {apartments
        .filter((a) => a.side === "back")
        .map((apt) => {
          const floorIdx = apt.floor - 1;
          const u = apt.unit_on_floor - 1;
          const x = -(u - (UNITS_PER_SIDE - 1) / 2) * (aptW + gap);
          const y = baseY + floorIdx * (aptH + gap) + aptH / 2 + 0.15;
          const z = -buildingDepth / 2 - aptD / 2;
          return (
            <group key={apt.id} rotation={[0, Math.PI, 0]}>
              <ApartmentUnit
                apt={apt}
                position={[-x, y, -z]}
                size={[aptW, aptH, aptD]}
                onSelect={onSelect}
              />
            </group>
          );
        })}

      {/* Roof */}
      <mesh position={[0, baseY + buildingHeight + 0.12, 0]} castShadow>
        <boxGeometry args={[buildingWidth + 0.3, 0.24, buildingDepth + 0.3]} />
        <meshStandardMaterial color="#374151" roughness={0.7} />
      </mesh>
      {/* Rooftop machinery */}
      <mesh position={[-0.6, baseY + buildingHeight + 0.45, 0]} castShadow>
        <boxGeometry args={[0.9, 0.4, 0.9]} />
        <meshStandardMaterial color="#57534e" metalness={0.5} />
      </mesh>
      <mesh position={[0.8, baseY + buildingHeight + 0.35, 0.4]} castShadow>
        <boxGeometry args={[0.6, 0.25, 0.6]} />
        <meshStandardMaterial color="#57534e" metalness={0.5} />
      </mesh>

      {/* Entrance canopy */}
      <mesh position={[0, baseY + 0.85, buildingDepth / 2 + 0.35]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.7]} />
        <meshStandardMaterial color="#1c1917" metalness={0.4} />
      </mesh>
      {/* Entrance doors */}
      <mesh position={[0, baseY + 0.42, buildingDepth / 2 + 0.02]}>
        <boxGeometry args={[1.1, 0.85, 0.04]} />
        <meshPhysicalMaterial
          color="#0f172a"
          metalness={0.6}
          roughness={0.15}
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
            metalness={0.3}
            roughness={0.1}
            transmission={0.6}
            thickness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(p);
}

export function Building3D() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Apartment | null>(null);

  useEffect(() => {
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
      setApartments((data as any) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("apartments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "apartments" },
        () => load()
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: apartments.length,
      available: apartments.filter((a) => a.status === "available").length,
      reserved: apartments.filter((a) => a.status === "reserved").length,
      sold: apartments.filter((a) => a.status === "sold").length,
    }),
    [apartments]
  );

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-stone-200">
      <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-6 pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <div className="pointer-events-auto">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
              Rezidencija Vista
            </h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5">
              {FLOORS} spratova · {APTS_PER_FLOOR} stanova po spratu · {stats.total} ukupno
            </p>
          </div>
          <Link
            to="/admin"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur border border-border px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-background transition"
          >
            <Settings className="w-3.5 h-3.5" />
            Admin
          </Link>
        </div>
        <div className="pointer-events-auto flex flex-wrap gap-1.5 mt-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[10px] sm:text-xs px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
            Slobodno {stats.available}
          </Badge>
          <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[10px] sm:text-xs px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            Rezervirano {stats.reserved}
          </Badge>
          <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[10px] sm:text-xs px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />
            Prodano {stats.sold}
          </Badge>
        </div>
      </div>

      <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/85 backdrop-blur px-3 py-1.5 rounded-full text-[10px] sm:text-xs text-muted-foreground shadow-md border border-border text-center whitespace-nowrap">
        Prevuci za rotaciju · Štipni za zoom · Tap na stan
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <div className="text-sm text-muted-foreground">Učitavam stanove…</div>
        </div>
      )}

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [8, 5, 10], fov: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[10, 15, 8]}
            intensity={1.4}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-8, 6, -5]} intensity={0.35} color="#fef3c7" />

          <Building apartments={apartments} onSelect={setSelected} />

          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
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

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-xl p-5 sm:p-6 max-h-[90dvh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-left">
                    <DialogTitle className="text-xl sm:text-2xl">
                      {selected.title || `Stan ${selected.number}`}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      {selected.floor}. sprat · {selected.side === "front" ? "Prednja" : "Zadnja"} strana · {selected.orientation}
                    </DialogDescription>
                  </div>
                  <Badge
                    style={{ backgroundColor: STATUS_COLORS[selected.status], color: "#111827" }}
                    className="shrink-0"
                  >
                    {STATUS_LABEL[selected.status]}
                  </Badge>
                </div>
              </DialogHeader>

              {selected.image_url && (
                <img
                  src={selected.image_url}
                  alt={selected.title || selected.number}
                  className="w-full h-40 sm:h-48 object-cover rounded-lg my-2"
                />
              )}

              {selected.description && (
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2 sm:gap-3 my-4">
                <div className="rounded-lg border border-border p-2 sm:p-3 text-center">
                  <Maximize2 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-base sm:text-lg font-semibold">{Number(selected.area).toFixed(0)}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">m²</div>
                </div>
                <div className="rounded-lg border border-border p-2 sm:p-3 text-center">
                  <BedDouble className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-base sm:text-lg font-semibold">{selected.rooms}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">sobe</div>
                </div>
                <div className="rounded-lg border border-border p-2 sm:p-3 text-center">
                  <Bath className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-base sm:text-lg font-semibold">{selected.bathrooms}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">kupatila</div>
                </div>
              </div>

              {selected.features?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selected.features.map((f) => (
                    <Badge key={f} variant="outline" className="text-[10px]">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {f}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                Rezidencija Vista · Zgrada A
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Cijena</div>
                  <div className="text-xl sm:text-2xl font-bold">{formatPrice(Number(selected.price))}</div>
                </div>
                <Button
                  disabled={selected.status === "sold"}
                  onClick={() => setSelected(null)}
                  className="shrink-0"
                >
                  {selected.status === "sold" ? "Nedostupno" : "Kontaktiraj"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
