import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, PerformanceMonitor, Html, useProgress, PointerLockControls, KeyboardControls, useKeyboardControls, ContactShadows } from "@react-three/drei";
import { Physics, RigidBody, CapsuleCollider, RapierRigidBody } from "@react-three/rapier";
import { Suspense, useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { Apartman1 } from "./Apartman1";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
];

function TourLoader() {
  return null; // Zadržavamo čisti prikaz, samo učitavanje na dugmetu
}

// Touch kontrole za mobitele
function TouchLookControls() {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const previousPosition = useRef({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (!(touch.target as HTMLElement).closest("button") && touchId.current === null) {
          touchId.current = touch.identifier;
          isDragging.current = true;
          previousPosition.current = { x: touch.clientX, y: touch.clientY };
          break;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || touchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId.current) {
          const deltaX = touch.clientX - previousPosition.current.x;
          const deltaY = touch.clientY - previousPosition.current.y;

          camera.rotation.order = "YXZ";
          camera.rotation.y -= deltaX * 0.005;
          camera.rotation.x -= deltaY * 0.005;
          camera.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, camera.rotation.x));

          previousPosition.current = { x: touch.clientX, y: touch.clientY };
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId.current) {
          isDragging.current = false;
          touchId.current = null;
          break;
        }
      }
    };

    gl.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    gl.domElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    gl.domElement.addEventListener('touchend', handleTouchEnd);
    gl.domElement.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      gl.domElement.removeEventListener('touchstart', handleTouchStart);
      gl.domElement.removeEventListener('touchmove', handleTouchMove);
      gl.domElement.removeEventListener('touchend', handleTouchEnd);
      gl.domElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [camera, gl.domElement]);

  return null;
}

function Player({ moveState, onUnlock }: { moveState: { x: number, z: number }, onUnlock: () => void }) {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();
  const bodyRef = useRef<RapierRigidBody>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (bodyRef.current) {
      // Spawn ispred vrata. Visina 1.0.
      const SPAWN_X = 4;
      const SPAWN_Y = 1;
      const SPAWN_Z = 3.0;

      bodyRef.current.setTranslation({ x: SPAWN_X, y: SPAWN_Y, z: SPAWN_Z }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);

      // Kamera je offsetovana za +0.3 gore od centra tijela
      camera.position.set(SPAWN_X, SPAWN_Y + 0.3, SPAWN_Z);
      camera.rotation.set(0, 0, 0);
      camera.rotation.order = "YXZ";
    }
  }, [camera]);

  useFrame(() => {
    if (!bodyRef.current) return;

    const keys = getKeys();
    const speed = 4.0;

    const inputZ = (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0) + moveState.z;
    const inputX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + moveState.x;

    const moveDirection = new THREE.Vector3(inputX, 0, inputZ).normalize().multiplyScalar(speed);

    // Rotacija vektora kretanja prema YAW uglu kamere
    const euler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    moveDirection.applyEuler(euler);

    const currentVel = bodyRef.current.linvel();
    bodyRef.current.setLinvel({ x: moveDirection.x, y: currentVel.y, z: moveDirection.z }, true);

    // Prati poziciju igrača
    const pos = bodyRef.current.translation();
    camera.position.set(pos.x, pos.y + 0.3, pos.z);
  });

  return (
    <>
      {isMobile ? <TouchLookControls /> : <PointerLockControls selector="#start-tour-btn" onUnlock={onUnlock} makeDefault />}
      <RigidBody
        ref={bodyRef}
        type="dynamic"
        colliders={false}
        enabledRotations={[false, false, false]}
        mass={1}
        canSleep={false} // NAJVAŽNIJE: Sprečava Rapier da "uspava" tijelo nakon pada!
      >
        <CapsuleCollider args={[0.1, 0.1]} />
      </RigidBody>
    </>
  );
}

export function Walkthrough({ onClose }: { onClose: () => void }) {
  const [dpr, setDpr] = useState(1);
  const [moveState, setMoveState] = useState({ x: 0, z: 0 });
  const [hasStarted, setHasStarted] = useState(false);
  const { progress } = useProgress();
  const isLoaded = progress === 100;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/85 backdrop-blur px-4 py-2 rounded-full text-xs text-muted-foreground shadow-md border border-border text-center whitespace-nowrap pointer-events-none hidden lg:block">
        Pritisni <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-sans font-medium text-[10px]">ESC</kbd> za pauzu i meni
      </div>

      {hasStarted && isMobile && (
        <div className="absolute top-4 right-4 z-20">
          <Button onClick={() => setHasStarted(false)} variant="secondary" className="shadow-md">
            Meni
          </Button>
        </div>
      )}

      {!hasStarted && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl text-white transition-all duration-500">
          <h2 className="text-2xl font-bold mb-6 text-center">Interaktivna 3D Tura</h2>

          <div className="flex gap-8 mb-8 text-sm text-center opacity-90 hidden lg:flex">
            <div className="flex flex-col items-center">
              <div className="flex gap-1.5 mb-3 font-mono">
                <kbd className="bg-white/20 px-2.5 py-1.5 rounded-md border border-white/10">W</kbd>
                <kbd className="bg-white/20 px-2.5 py-1.5 rounded-md border border-white/10">A</kbd>
                <kbd className="bg-white/20 px-2.5 py-1.5 rounded-md border border-white/10">S</kbd>
                <kbd className="bg-white/20 px-2.5 py-1.5 rounded-md border border-white/10">D</kbd>
              </div>
              <span>Kretanje kroz prostor</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex gap-1.5 mb-3 font-mono">
                <kbd className="bg-white/20 px-4 py-1.5 rounded-md border border-white/10">MIŠ</kbd>
              </div>
              <span>Okretanje glave</span>
            </div>
          </div>

          <div className="lg:hidden mb-8 text-center text-sm opacity-90 max-w-xs">
            Koristite tipke na ekranu za hodanje, a prevucite prstom po ekranu za okretanje kamere.
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button
              id="start-tour-btn"
              size="lg"
              className={`text-lg px-8 py-6 rounded-full shadow-2xl transition-all ${isLoaded ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
              onClick={() => isLoaded && setHasStarted(true)}
              disabled={!isLoaded}
            >
              {isLoaded ? "Započni / Nastavi" : `Učitavanje (${progress.toFixed(0)}%)`}
            </Button>

            <Button
              onClick={onClose}
              variant="secondary"
              size="lg"
              className="text-lg px-8 py-6 rounded-full shadow-2xl transition-transform hover:scale-105 bg-white text-black hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Nazad na Zgradu
            </Button>
          </div>
        </div>
      )}

      {hasStarted && isMobile && (
        <div className="absolute bottom-8 right-8 z-20 grid grid-cols-3 gap-2 opacity-70 select-none">
          <div />
          <Button
            variant="secondary" className="w-14 h-14 p-0 rounded-full shadow-lg"
            onPointerDown={() => setMoveState(p => ({ ...p, z: -1 }))}
            onPointerUp={() => setMoveState(p => ({ ...p, z: 0 }))}
            onPointerLeave={() => setMoveState(p => ({ ...p, z: 0 }))}
          ><ChevronUp className="w-8 h-8" /></Button>
          <div />
          <Button
            variant="secondary" className="w-14 h-14 p-0 rounded-full shadow-lg"
            onPointerDown={() => setMoveState(p => ({ ...p, x: -1 }))}
            onPointerUp={() => setMoveState(p => ({ ...p, x: 0 }))}
            onPointerLeave={() => setMoveState(p => ({ ...p, x: 0 }))}
          ><ChevronLeft className="w-8 h-8" /></Button>
          <Button
            variant="secondary" className="w-14 h-14 p-0 rounded-full shadow-lg"
            onPointerDown={() => setMoveState(p => ({ ...p, z: 1 }))}
            onPointerUp={() => setMoveState(p => ({ ...p, z: 0 }))}
            onPointerLeave={() => setMoveState(p => ({ ...p, z: 0 }))}
          ><ChevronDown className="w-8 h-8" /></Button>
          <Button
            variant="secondary" className="w-14 h-14 p-0 rounded-full shadow-lg"
            onPointerDown={() => setMoveState(p => ({ ...p, x: 1 }))}
            onPointerUp={() => setMoveState(p => ({ ...p, x: 0 }))}
            onPointerLeave={() => setMoveState(p => ({ ...p, x: 0 }))}
          ><ChevronRight className="w-8 h-8" /></Button>
        </div>
      )}

      <KeyboardControls map={keyboardMap}>
        <Canvas
          dpr={dpr}
          camera={{ position: [5, 1.5, 3], fov: isMobile ? 120 : 90 }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0
          }}
          style={{ touchAction: "none" }}
        >
          <color attach="background" args={["#111"]} />
          <Suspense fallback={<TourLoader />}>
            <PerformanceMonitor onIncline={() => setDpr(1)} onDecline={() => setDpr(0.5)} />

            <Environment preset="city" background blur={0.02} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />

            <Physics>
              <Apartman1 />
              <Player moveState={moveState} onUnlock={() => setHasStarted(false)} />
            </Physics>

            <ContactShadows resolution={1024} scale={50} blur={2.5} opacity={0.7} far={2} color="#000000" position={[0, 0.01, 0]} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
