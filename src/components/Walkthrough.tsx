import { Canvas } from "@react-three/fiber";
import { Environment, PerformanceMonitor, useProgress, KeyboardControls, ContactShadows } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import { Apartman1 } from "./Apartman1";
import { Player } from "./Player";
import { Loader } from "./Loader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
];

export function Walkthrough({ onClose }: { onClose: () => void }) {
  const [dpr, setDpr] = useState(1);
  const [moveState, setMoveState] = useState({ x: 0, z: 0 });
  const [hasStarted, setHasStarted] = useState(false);
  
  const { progress } = useProgress();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isMobile, setIsMobile] = useState(false);

  // Detekcija širine ekrana za responzivnost i optimizacija DPR
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, 1.5));
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Postavljanje učitavanja kada je progress 100% (sa 1.5s odgode za učitavanje u GPU/kompilaciju)
  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Timeout za učitavanje (30 sekundi)
  useEffect(() => {
    if (!isLoaded && !error) {
      const timer = setTimeout(() => {
        setError("Učitavanje modela je potrajalo duže od očekivanog. Provjerite konekciju i pokušajte ponovo.");
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, error]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-hidden select-none font-sans">
      {/* Loader sa animiranim progress barom (Privremeno onemogućen po zahtjevu) */}
      {/*
      <AnimatePresence>
        {!isLoaded && (
          <Loader progress={progress} error={error} onRetry={handleRetry} />
        )}
      </AnimatePresence>
      */}

      {/* ESC Baner sa uputstvom na vrhu/dnu */}
      {hasStarted && !isMobile && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-[#111111]/85 backdrop-blur-md px-6 py-3 rounded-full text-xs text-neutral-400 shadow-2xl border border-white/5 pointer-events-none tracking-wider uppercase">
          Pritisnite <kbd className="bg-white/10 px-2 py-1 rounded border border-white/10 font-mono font-bold text-white text-[10px] mx-1">ESC</kbd> za pauzu i meni
        </div>
      )}

      {/* Mobilni meni gumb */}
      {hasStarted && isMobile && (
        <div className="absolute top-4 right-4 z-20">
          <Button 
            onClick={() => setHasStarted(false)} 
            variant="secondary" 
            className="shadow-xl bg-white/10 backdrop-blur border border-white/10 text-white hover:bg-white/20 px-5 rounded-full cursor-pointer"
          >
            Meni
          </Button>
        </div>
      )}

      {/* Start/Pause meni sa staklenim dizajnom */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm text-white px-6"
            style={{ willChange: "transform, opacity" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="max-w-xl w-full text-center space-y-8 p-8 sm:p-12 rounded-3xl bg-neutral-950/85 border border-white/5 shadow-[0_0_50px_0_rgba(0,0,0,0.5)]"
              style={{ willChange: "transform, opacity" }}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-black tracking-tight leading-none">INTERAKTIVNA TURA</h2>
                <p className="text-neutral-400 text-sm max-w-sm mx-auto">
                  Uđite u apartman i slobodno se krećite kroz sve prostorije u realnom vremenu.
                </p>
              </div>

              {/* Informacije o kontrolama */}
              <div className="py-6 border-t border-b border-white/5">
                {!isMobile ? (
                  <div className="grid grid-cols-2 gap-8 text-xs text-neutral-400 uppercase tracking-wider">
                    <div className="space-y-3">
                      <div className="flex gap-1.5 justify-center font-mono">
                        <kbd className="bg-white/10 px-3 py-2 rounded-lg border border-white/10 text-white font-bold">W</kbd>
                        <kbd className="bg-white/10 px-3 py-2 rounded-lg border border-white/10 text-white font-bold">A</kbd>
                        <kbd className="bg-white/10 px-3 py-2 rounded-lg border border-white/10 text-white font-bold">S</kbd>
                        <kbd className="bg-white/10 px-3 py-2 rounded-lg border border-white/10 text-white font-bold">D</kbd>
                      </div>
                      <span>Kretanje kroz prostor</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-center font-mono">
                        <kbd className="bg-white/10 px-6 py-2 rounded-lg border border-white/10 text-white font-bold">MIŠ</kbd>
                      </div>
                      <span>Gledanje uokolo</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Koristite virtuelni <span className="text-white font-semibold">D-Pad</span> u donjem lijevom uglu za kretanje, a <span className="text-white font-semibold">prevucite prst</span> po ekranu za okretanje kamere.
                  </p>
                )}
              </div>

              {/* Akciona dugmad */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  id="start-tour-btn"
                  disabled={!isLoaded}
                  whileHover={isLoaded ? { scale: 1.05 } : {}}
                  whileTap={isLoaded ? { scale: 0.95 } : {}}
                  onClick={() => isLoaded && setHasStarted(true)}
                  className={`w-full sm:w-auto px-8 py-4 font-bold rounded-full text-base shadow-2xl transition-all ${
                    isLoaded 
                      ? "bg-white text-black hover:bg-neutral-200 cursor-pointer" 
                      : "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
                  }`}
                >
                  {isLoaded ? "Započni turu" : "Učitavanje..."}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-full text-base hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Nazad na zgradu
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* D-Pad kontrole za mobilne uređaje */}
      {hasStarted && isMobile && (
        <div className="absolute bottom-8 right-8 z-20 flex flex-col items-center gap-1.5 select-none opacity-85">
          <button
            className="dpad-btn w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:bg-white/30 transition-all shadow-2xl text-white pointer-events-auto cursor-pointer"
            style={{ minWidth: '40px', minHeight: '40px' }}
            onPointerDown={() => setMoveState(p => ({ ...p, z: -1 }))}
            onPointerUp={() => setMoveState(p => ({ ...p, z: 0 }))}
            onPointerLeave={() => setMoveState(p => ({ ...p, z: 0 }))}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          
          <div className="flex gap-6">
            <button
              className="dpad-btn w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:bg-white/30 transition-all shadow-2xl text-white pointer-events-auto cursor-pointer"
              style={{ minWidth: '40px', minHeight: '40px' }}
              onPointerDown={() => setMoveState(p => ({ ...p, x: -1 }))}
              onPointerUp={() => setMoveState(p => ({ ...p, x: 0 }))}
              onPointerLeave={() => setMoveState(p => ({ ...p, x: 0 }))}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              className="dpad-btn w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:bg-white/30 transition-all shadow-2xl text-white pointer-events-auto cursor-pointer"
              style={{ minWidth: '40px', minHeight: '40px' }}
              onPointerDown={() => setMoveState(p => ({ ...p, x: 1 }))}
              onPointerUp={() => setMoveState(p => ({ ...p, x: 0 }))}
              onPointerLeave={() => setMoveState(p => ({ ...p, x: 0 }))}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <button
            className="dpad-btn w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:bg-white/30 transition-all shadow-2xl text-white pointer-events-auto cursor-pointer"
            style={{ minWidth: '40px', minHeight: '40px' }}
            onPointerDown={() => setMoveState(p => ({ ...p, z: 1 }))}
            onPointerUp={() => setMoveState(p => ({ ...p, z: 0 }))}
            onPointerLeave={() => setMoveState(p => ({ ...p, z: 0 }))}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* R3F Canvas */}
      <KeyboardControls map={keyboardMap}>
        <Canvas
          dpr={dpr}
          shadows={true}
          camera={{ position: [5, 1.5, 3], fov: isMobile ? 85 : 75, near: 0.1, far: 30 }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.85
          }}
          style={{ touchAction: "none" }}
        >
          <color attach="background" args={["#0c0c0c"]} />
          
          <Suspense fallback={null}>
            {/* Dinamički nadzor rezolucije ekrana */}
            <PerformanceMonitor 
              onIncline={() => setDpr(1.0)} 
              onDecline={() => setDpr(0.5)} 
            />

            {/* Osvjetljenje i ambijent */}
            <Environment preset="sunset" background backgroundRotation={[0, Math.PI / 1.5, 0]} environmentRotation={[0, Math.PI / 1.5, 0]} />
            <ambientLight intensity={0.12} />
            <directionalLight 
              position={[5, 10, 5]} 
              intensity={0.45} 
              castShadow={true} 
              shadow-mapSize-width={512}
              shadow-mapSize-height={512}
              shadow-camera-near={1}
              shadow-camera-far={25}
              shadow-camera-left={-10}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
              shadow-bias={-0.0005}
            />
            <directionalLight position={[-5, 5, -5]} intensity={0.1} />

            {/* Fizikalni svijet stana i igrača */}
            <Physics>
              <Apartman1 isDesktop={true} />
              <Player 
                isMobile={isMobile} 
                moveState={moveState} 
                onUnlock={() => setHasStarted(false)} 
              />
            </Physics>

            {/* Meke kontaktne sjene ispod objekata pri tlu */}
            <ContactShadows 
              resolution={1024} 
              scale={50} 
              blur={2.0} 
              opacity={0.6} 
              far={1.5} 
              color="#000000" 
              position={[0, 0.01, 0]} 
            />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
