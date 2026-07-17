import * as THREE from 'three'
import React, { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { KTX2Loader } from 'three-stdlib'

// Inicijalizujemo KTX2 dekoder jednom globalno
const ktx2Loader = new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/')

export function Apartman1() {
  const { gl } = useThree()

  // Konektovanje KTX2 dekodera na tvoju grafičku kartu mora se odraditi PRIJE učitavanja modela
  useMemo(() => {
    ktx2Loader.detectSupport(gl)
  }, [gl])

  // Učitavanje modela
  const { scene } = useGLTF('/Apartman_final_kompresija_4_compressed.glb', true, true, (loader) => {
    loader.setKTX2Loader(ktx2Loader)
  })

  // Optimizovana vizuelna scena
  const visualScene = useMemo(() => {
    const visual = scene.clone(true)
    visual.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (mesh.material) {
          const mat = mesh.material as any
          mesh.material = new THREE.MeshLambertMaterial({
            color: mat.color, map: mat.map, transparent: mat.transparent, opacity: mat.opacity
          })
        }
      }
    })
    return visual
  }, [scene])

  // 🔥 Ručno izvlačenje SVAKOG MESH-a iz GLB fajla i pretvaranje u savršen Trimesh kolajder
  const colliders = useMemo(() => {
    const items: JSX.Element[] = []
    
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (!mesh.visible) return // Ignorišemo nevidljive objekte
        
        // 1. Izračunaj APSOLUTNU poziciju, rotaciju i skalu u svijetu
        // Ovo rješava sve probleme sa offsetima koje je napravio kompresor!
        const position = new THREE.Vector3()
        const quaternion = new THREE.Quaternion()
        const scale = new THREE.Vector3()
        mesh.matrixWorld.decompose(position, quaternion, scale)
        
        // 2. Kreiramo izolovan trimesh kolajder za taj specifični objekat
        items.push(
          <RigidBody 
            key={mesh.uuid} 
            type="fixed" 
            colliders="trimesh" 
            position={position}
            quaternion={quaternion}
          >
            <mesh geometry={mesh.geometry} scale={scale}>
              <meshBasicMaterial visible={false} />
            </mesh>
          </RigidBody>
        )
      }
    })
    
    return items
  }, [scene])

  return (
    <group dispose={null}>
      {/* Prikaz samog stana */}
      <primitive object={visualScene} />

      {/* Individualni kolajderi izvučeni direktno iz matrice */}
      {colliders}

      {/* Ogroman nevidljivi pod na dubini -0.5m za svaki slučaj, kao sigurnosna mreža */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider position={[0, -0.5, 0]} args={[500, 0.5, 500]} />
      </RigidBody>
    </group>
  )
}
