import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, useKeyboardControls } from "@react-three/drei";
import { RigidBody, CapsuleCollider, RapierRigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface PlayerProps {
  isMobile: boolean;
  moveState: { x: number; z: number };
  onUnlock?: () => void;
}

// Spawn pozicija karaktera (podesivo)
const SPAWN_X = 4.0;
const SPAWN_Y = 1.5; // Podesiva spawn visina
const SPAWN_Z = 3.0;

export function Player({ isMobile, moveState, onUnlock }: PlayerProps) {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();
  const bodyRef = useRef<RapierRigidBody>(null);

  // Inicijalni spawn i podešavanje kamere
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.setTranslation({ x: SPAWN_X, y: SPAWN_Y, z: SPAWN_Z }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);

      // Kamera na visini očiju karaktera (offset +0.6)
      camera.position.set(SPAWN_X, SPAWN_Y + 0.6, SPAWN_Z);
      camera.rotation.set(0, 0, 0);
      camera.rotation.order = "YXZ";
    }
  }, [camera]);

  // Touch kontrole za kameru na mobilnim uređajima (drag za gledanje)
  useEffect(() => {
    if (!isMobile) return;

    let isPointerDown = false;
    let previousPointerPosition = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      // Ignoriši dodire na D-Pad dugmad
      const target = e.target as HTMLElement;
      if (target.closest(".dpad-btn")) return;

      isPointerDown = true;
      previousPointerPosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;

      const deltaX = e.clientX - previousPointerPosition.x;
      const deltaY = e.clientY - previousPointerPosition.y;

      // Podešavanje osjetljivosti okretanja
      camera.rotation.y -= deltaX * 0.004;
      camera.rotation.x -= deltaY * 0.004;

      // Sprečavanje prevrtanja kamere (limitiranje vertikalne rotacije)
      camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camera.rotation.x));

      previousPointerPosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isPointerDown = false;
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [camera, isMobile]);

  // Okvir kretanja i fizike
  useFrame(() => {
    if (!bodyRef.current) return;

    let inputX = 0;
    let inputZ = 0;

    if (!isMobile) {
      const keys = getKeys();
      inputZ = (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0);
      inputX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    } else {
      // Korištenje stanja mobilnog D-Pada
      inputX = moveState.x;
      inputZ = moveState.z;
    }

    const speed = 2.0;
    const moveDirection = new THREE.Vector3(inputX, 0, inputZ).normalize().multiplyScalar(speed);

    // Rotiranje kretanja prema Y (Yaw) rotaciji kamere
    const euler = new THREE.Euler(0, camera.rotation.y, 0, "YXZ");
    moveDirection.applyEuler(euler);

    const currentVel = bodyRef.current.linvel();
    bodyRef.current.setLinvel(
      { x: moveDirection.x, y: currentVel.y, z: moveDirection.z },
      true
    );

    // Kamera prati poziciju rigid body-ja igrača
    const pos = bodyRef.current.translation();
    camera.position.set(pos.x, pos.y + 0.6, pos.z);
  });

  return (
    <>
      {/* PointerLock na desktopu */}
      {!isMobile && (
        <PointerLockControls
          selector="#start-tour-btn"
          onUnlock={onUnlock}
          makeDefault
        />
      )}

      {/* Kapsula igrača */}
      <RigidBody
        ref={bodyRef}
        type="dynamic"
        colliders={false}
        enabledRotations={[false, false, false]}
        mass={1}
        canSleep={false}
      >
        <CapsuleCollider args={[0.55, 0.15]} />
      </RigidBody>
    </>
  );
}
