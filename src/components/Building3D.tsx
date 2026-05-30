import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { useMemo, useState, Suspense } from "react";
import * as THREE from "three";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BedDouble, Bath, Maximize2, MapPin } from "lucide-react";

export type Apartment = {
  id: string;
  number: string;
  floor: number;
  unitOnFloor: number;
  side: "front" | "back";
  rooms: number;
  bathrooms: number;
  area: number;
  price: number;
  status: "available" | "reserved" | "sold";
  orientation: string;
};

// Building dimensions
const FLOORS = 6;
const UNITS_PER_SIDE = 4; // 4 apartments on front + 4 on back = 8 per floor
const APTS_PER_FLOOR = UNITS_PER_SIDE * 2;

const STATUS_COLORS: Record<Apartment["status"], string> = {
  available: "#86efac",
  reserved: "#fcd34d",
  sold: "#fca5a5",
};

const STATUS_LABEL: Record<Apartment["status"], string> = {
  available: "Slobodan",
  reserved: "Rezerviran",
  sold: "Prodan",
};

function generateApartments(): Apartment[] {
  const apts: Apartment[] = [];
  let n = 1;
  for (let f = 0; f < FLOORS; f++) {
    for (let side of ["front", "back"] as const) {
      for (let u = 0; u < UNITS_PER_SIDE; u++) {
        const rand = (f * 17 + u * 11 + (side === "front" ? 0 : 5)) % 10;
        const status: Apartment["status"] =
          rand < 6 ? "available" : rand < 8 ? "reserved" : "sold";
        const rooms = 1 + ((f + u + (side === "back" ? 1 : 0)) % 4);
        apts.push({
          id: `A-${f}-${side}-${u}`,
          number: `${String(n).padStart(3, "0")}`,
          floor: f + 1,
          unitOnFloor: u + 1,
          side,
          rooms,
          bathrooms: rooms > 2 ? 2 : 1,
          area: 38 + rooms * 17 + ((u * 4) % 10),
          price: 85000 + rooms * 38000 + f * 5200,
          status,
          orientation:
            side === "front"
              ? ["Jug", "Jugoistok", "Jugozapad", "Jug"][u]
              : ["Sjever", "Sjeveroistok", "Sjeverozapad", "Sjever"][u],
        });
        n++;
      }
    }
  }
  return apts;
}

type ApartmentBoxProps = {
  apt: Apartment;
  position: [number, number, number];
  size: [number, number, number];
  onSelect: (a: Apartment) => void;
};

function ApartmentBox({ apt, position, size, onSelect }: ApartmentBoxProps) {
  const [hovered, setHovered] = useState(false);
  const color = STATUS_COLORS[apt.status];

  return (
    <group position={position}>
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
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.6 : 0}
          transparent
          opacity={hovered ? 0.95 : 0.82}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* window frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color="#1f2937" />
      </lineSegments>
      {hovered && (
        <Html distanceFactor={10} position={[0, size[1] / 2 + 0.25, 0]} center>
          <div className="pointer-events-none rounded-md bg-background/95 px-2 py-1 text-xs font-medium shadow-lg border border-border whitespace-nowrap">
            Stan {apt.number} · {apt.area} m²
          </div>
        </Html>
      )}
    </group>
  );
}

type BuildingProps = {
  apartments: Apartment[];
  onSelect: (a: Apartment) => void;
};

function Building({ apartments, onSelect }: BuildingProps) {
  // apartment unit dimensions
  const aptW = 1.4;
  const aptH = 1.0;
  const aptD = 0.25; // thin slab on facade
  const gap = 0.06;
  const baseY = 0.6;

  // building shell dimensions
  const buildingWidth = UNITS_PER_SIDE * (aptW + gap) + 0.4;
  const buildingHeight = FLOORS * (aptH + gap) + 0.3;
  const buildingDepth = 3.2; // front to back

  return (
    <group position={[0, -buildingHeight / 2 - baseY / 2, 0]}>
      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <circleGeometry args={[18, 48]} />
        <meshStandardMaterial color="#d6d3d1" />
      </mesh>

      {/* Walkway */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, buildingDepth / 2 + 1.5]}
        receiveShadow
      >
        <planeGeometry args={[buildingWidth, 3]} />
        <meshStandardMaterial color="#a8a29e" />
      </mesh>

      {/* Podium / base */}
      <mesh position={[0, baseY / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[buildingWidth + 0.6, baseY, buildingDepth + 0.4]} />
        <meshStandardMaterial color="#78716c" roughness={0.85} />
      </mesh>

      {/* Building shell (inner walls) */}
      <mesh
        position={[0, baseY + buildingHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[buildingWidth, buildingHeight, buildingDepth]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.7} />
      </mesh>

      {/* Apartment grid - front facade */}
      {apartments
        .filter((a) => a.side === "front")
        .map((apt) => {
          const floorIdx = apt.floor - 1;
          const u = apt.unitOnFloor - 1;
          const x = (u - (UNITS_PER_SIDE - 1) / 2) * (aptW + gap);
          const y = baseY + floorIdx * (aptH + gap) + aptH / 2 + 0.1;
          const z = buildingDepth / 2 + aptD / 2 + 0.001;
          return (
            <ApartmentBox
              key={apt.id}
              apt={apt}
              position={[x, y, z]}
              size={[aptW, aptH, aptD]}
              onSelect={onSelect}
            />
          );
        })}

      {/* Apartment grid - back facade */}
      {apartments
        .filter((a) => a.side === "back")
        .map((apt) => {
          const floorIdx = apt.floor - 1;
          const u = apt.unitOnFloor - 1;
          const x = -(u - (UNITS_PER_SIDE - 1) / 2) * (aptW + gap);
          const y = baseY + floorIdx * (aptH + gap) + aptH / 2 + 0.1;
          const z = -buildingDepth / 2 - aptD / 2 - 0.001;
          return (
            <ApartmentBox
              key={apt.id}
              apt={apt}
              position={[x, y, z]}
              size={[aptW, aptH, aptD]}
              onSelect={onSelect}
            />
          );
        })}

      {/* Floor dividers (horizontal bands) */}
      {Array.from({ length: FLOORS + 1 }).map((_, i) => (
        <mesh
          key={`band-${i}`}
          position={[0, baseY + i * (aptH + gap) + 0.05, 0]}
        >
          <boxGeometry args={[buildingWidth + 0.1, 0.06, buildingDepth + 0.1]} />
          <meshStandardMaterial color="#44403c" />
        </mesh>
      ))}

      {/* Roof */}
      <mesh
        position={[0, baseY + buildingHeight + 0.15, 0]}
        castShadow
      >
        <boxGeometry args={[buildingWidth + 0.4, 0.3, buildingDepth + 0.4]} />
        <meshStandardMaterial color="#292524" />
      </mesh>

      {/* Rooftop detail */}
      <mesh position={[0, baseY + buildingHeight + 0.45, 0]} castShadow>
        <boxGeometry args={[1.2, 0.3, 1.2]} />
        <meshStandardMaterial color="#57534e" />
      </mesh>

      {/* Entrance */}
      <mesh position={[0, baseY + 0.4, buildingDepth / 2 + 0.02]}>
        <boxGeometry args={[0.9, 0.8, 0.05]} />
        <meshStandardMaterial color="#1c1917" metalness={0.6} roughness={0.3} />
      </mesh>
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
  const apartments = useMemo(generateApartments, []);
  const [selected, setSelected] = useState<Apartment | null>(null);

  const stats = useMemo(() => {
    return {
      total: apartments.length,
      available: apartments.filter((a) => a.status === "available").length,
      reserved: apartments.filter((a) => a.status === "reserved").length,
      sold: apartments.filter((a) => a.status === "sold").length,
    };
  }, [apartments]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-stone-200">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-6 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
            Rezidencija Vista
          </h1>
          <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5">
            Interaktivni 3D · {FLOORS} spratova · {APTS_PER_FLOOR} stanova po spratu
          </p>
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

      {/* Hint */}
      <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/85 backdrop-blur px-3 py-1.5 rounded-full text-[10px] sm:text-xs text-muted-foreground shadow-md border border-border text-center whitespace-nowrap">
        Prevuci za rotaciju · Štipni za zoom · Tap na stan
      </div>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [7, 4, 9], fov: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.65} />
          <directionalLight
            position={[10, 15, 8]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-8, 6, -5]} intensity={0.4} />

          <Building apartments={apartments} onSelect={setSelected} />

          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minDistance={5}
            maxDistance={20}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate
            autoRotateSpeed={0.45}
            makeDefault
          />
        </Suspense>
      </Canvas>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-xl p-5 sm:p-6">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-left">
                    <DialogTitle className="text-xl sm:text-2xl">
                      Stan {selected.number}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      {selected.floor}. sprat · {selected.side === "front" ? "Prednja" : "Zadnja"} strana · {selected.orientation}
                    </DialogDescription>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: STATUS_COLORS[selected.status],
                      color: "#1f2937",
                    }}
                    className="shrink-0"
                  >
                    {STATUS_LABEL[selected.status]}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 my-4">
                <div className="rounded-lg border border-border p-2 sm:p-3 text-center">
                  <Maximize2 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-base sm:text-lg font-semibold">{selected.area}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">m²</div>
                </div>
                <div className="rounded-lg border border-border p-2 sm:p-3 text-center">
                  <BedDouble className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-base sm:text-lg font-semibold">{selected.rooms}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">sobe</div>
                </div>
                <div className="rounded-lg border border-border p-2 sm:p-3 text-center">
                  <Bath className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-base sm:text-lg font-semibold">
                    {selected.bathrooms}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">kupatila</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                Rezidencija Vista · Zgrada A
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Cijena</div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {formatPrice(selected.price)}
                  </div>
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
