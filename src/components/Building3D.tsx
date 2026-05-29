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
  rooms: number;
  bathrooms: number;
  area: number;
  price: number;
  status: "available" | "reserved" | "sold";
  orientation: string;
};

// Generate apartments grid
const FLOORS = 8;
const COLS = 6;

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
  const orientations = ["Jug", "Sjever", "Istok", "Zapad", "JI", "JZ"];
  let n = 1;
  for (let f = 0; f < FLOORS; f++) {
    for (let c = 0; c < COLS; c++) {
      const rand = (f * 13 + c * 7) % 10;
      const status: Apartment["status"] =
        rand < 6 ? "available" : rand < 8 ? "reserved" : "sold";
      const rooms = 1 + ((f + c) % 4);
      apts.push({
        id: `A-${f}-${c}`,
        number: `${String(n).padStart(3, "0")}`,
        floor: f + 1,
        rooms,
        bathrooms: rooms > 2 ? 2 : 1,
        area: 35 + rooms * 18 + ((c * 3) % 10),
        price: 80000 + rooms * 35000 + f * 4500,
        status,
        orientation: orientations[(f + c) % orientations.length],
      });
      n++;
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
          opacity={hovered ? 0.95 : 0.78}
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
        <Html distanceFactor={10} position={[0, size[1] / 2 + 0.2, 0]} center>
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
  const aptW = 1.2;
  const aptH = 0.9;
  const aptD = 1.0;
  const gap = 0.05;
  const baseY = 0.5;

  const buildingWidth = COLS * (aptW + gap);
  const buildingHeight = FLOORS * (aptH + gap);

  return (
    <group position={[0, -buildingHeight / 2, 0]}>
      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#e7e5e4" />
      </mesh>

      {/* Base / podium (brick) */}
      <mesh position={[0, baseY / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[buildingWidth + 2, baseY, aptD + 1.5]} />
        <meshStandardMaterial color="#9a3412" roughness={0.85} />
      </mesh>

      {/* Apartment grid */}
      {apartments.map((apt) => {
        const floorIdx = apt.floor - 1;
        const colIdx = parseInt(apt.id.split("-")[2]);
        const x = (colIdx - (COLS - 1) / 2) * (aptW + gap);
        const y = baseY + floorIdx * (aptH + gap) + aptH / 2;
        return (
          <ApartmentBox
            key={apt.id}
            apt={apt}
            position={[x, y, 0]}
            size={[aptW, aptH, aptD]}
            onSelect={onSelect}
          />
        );
      })}

      {/* Roof */}
      <mesh
        position={[0, baseY + buildingHeight + 0.1, 0]}
        castShadow
      >
        <boxGeometry args={[buildingWidth + 0.3, 0.2, aptD + 0.3]} />
        <meshStandardMaterial color="#44403c" />
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
    <div className="relative w-full h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-stone-200">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Rezidencija Vista
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interaktivni 3D prikaz · Kliknite na stan za detalje
          </p>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-2" />
            Slobodno: {stats.available}
          </Badge>
          <Badge variant="secondary" className="bg-background/80 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
            Rezervirano: {stats.reserved}
          </Badge>
          <Badge variant="secondary" className="bg-background/80 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-red-400 mr-2" />
            Prodano: {stats.sold}
          </Badge>
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur px-4 py-2 rounded-full text-xs text-muted-foreground shadow-md border border-border">
        Povucite za rotaciju · Skrolajte za zoom · Kliknite stan za detalje
      </div>

      <Canvas
        shadows
        camera={{ position: [8, 4, 10], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 15, 8]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-8, 6, -5]} intensity={0.4} />

          <Building apartments={apartments} onSelect={setSelected} />

          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
            minDistance={6}
            maxDistance={25}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate
            autoRotateSpeed={0.4}
          />
        </Suspense>
      </Canvas>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <DialogTitle className="text-2xl">
                      Stan {selected.number}
                    </DialogTitle>
                    <DialogDescription>
                      {selected.floor}. kat · Orijentacija {selected.orientation}
                    </DialogDescription>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: STATUS_COLORS[selected.status],
                      color: "#1f2937",
                    }}
                  >
                    {STATUS_LABEL[selected.status]}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="rounded-lg border border-border p-3 text-center">
                  <Maximize2 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-semibold">{selected.area}</div>
                  <div className="text-xs text-muted-foreground">m²</div>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <BedDouble className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-semibold">{selected.rooms}</div>
                  <div className="text-xs text-muted-foreground">sobe</div>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <Bath className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-semibold">
                    {selected.bathrooms}
                  </div>
                  <div className="text-xs text-muted-foreground">kupaonice</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                Rezidencija Vista · Zgrada A
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground">Cijena</div>
                  <div className="text-2xl font-bold">
                    {formatPrice(selected.price)}
                  </div>
                </div>
                <Button
                  disabled={selected.status === "sold"}
                  onClick={() => setSelected(null)}
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
