import * as THREE from 'three'
import { useMemo, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { KTX2Loader } from 'three-stdlib'
import { RigidBody, CuboidCollider, MeshCollider } from '@react-three/rapier'

const MODEL_URL = 'https://files.hodzicmirza.com/Apartman_FINALNA_VERZIJA_1-optimized.glb'

// Kreiranje KTX2 loadera na nivou modula kako bi radio i za prefetch/preload
const ktx2Loader = new KTX2Loader()
ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r154/examples/jsm/libs/basis/')



interface Apartman1Props {
  isDesktop?: boolean;
}

export function Apartman1({ isDesktop = true }: Apartman1Props) {
  const { gl } = useThree()

  // Inicijalizacija GLTF modela sa Draco i KTX2 dekoderima
  const { scene } = useGLTF(
    MODEL_URL,
    'https://www.gstatic.com/draco/versioned/decoders/1.5.5/',
    true,
    (loader) => {
      ktx2Loader.detectSupport(gl)
      loader.setKTX2Loader(ktx2Loader)
    }
  )

  // Konverzija u MeshLambertMaterial radi bržeg renderovanja + sjene samo na desktopu
  const visualScene = useMemo(() => {
    const materialCache = new Map<any, THREE.MeshLambertMaterial>()

    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        
        // Zidovi, podovi i plafoni ne trebaju bacati sjenu, samo primati!
        if (isDesktop) {
          const nameLower = (mesh.name || '').toLowerCase()
          const isStructure = nameLower.includes('wall') || 
                              nameLower.includes('floor') || 
                              nameLower.includes('ceiling') || 
                              nameLower.includes('plafon') || 
                              nameLower.includes('zid') || 
                              nameLower.includes('pod') ||
                              nameLower.includes('glass') ||
                              nameLower.includes('staklo')
          mesh.castShadow = !isStructure
          mesh.receiveShadow = true
        } else {
          mesh.castShadow = false
          mesh.receiveShadow = false
        }
        
        if (mesh.material) {
          const convertMaterial = (m: any) => {
            if (materialCache.has(m)) {
              return materialCache.get(m)!
            }
            const newMat = new THREE.MeshLambertMaterial({
              color: m.color,
              map: m.map,
              transparent: m.transparent,
              opacity: m.opacity
            })
            materialCache.set(m, newMat)
            return newMat
          }

          const mat = mesh.material as any
          if (Array.isArray(mat)) {
            mesh.material = mat.map(convertMaterial)
          } else {
            mesh.material = convertMaterial(mat)
          }
        }
      }
    })
    return scene
  }, [scene, isDesktop])

  // Generisanje kolizija - trimesh za zidove/podove, cuboid za namještaj, preskakanje dekoracija i plafona
  const colliders = useMemo(() => {
    const items: any[] = []
    scene.updateMatrixWorld(true)

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (!mesh.visible) return

        // 1. Filtriranje dekorativnih i sitnih objekata (nema potrebe za kolajderima)
        const name = (mesh.name || '').toLowerCase()

        // Preskačemo plafone, tavan, krov, tepihe, kvake, šarke, zavjese, svjetla, utičnice, vješalice, jastuke i sitni dekor
        const skipKeywords = [
          'ceiling', 'plafon', 'tavan', 'roof', 'krov', 'top_',
          'carpet', 'tepih', 'curtain', 'zavjes', 'light', 'svjet', 'lamp',
          'socket', 'uticn', 'switch', 'prekidac', 'handle', 'kvak', 'latch',
          'pillow', 'jastuk', 'blanket', 'pokrivac', 'dekor', 'vaza', 'vase',
          'book', 'knjig', 'clutter', 'picture', 'slika', 'mirror', 'ogled',
          'hanger', 'vjesa', 'throw', 'towel', 'peskir', 'faucet', 'mixer',
          'joint', 'rubber', 'leg', 'radiaotr-power', 'radiator-logo', 'radiator-end'
        ]

        if (skipKeywords.some(key => name.includes(key))) {
          return
        }

        // Izračunaj svjetske transformacije
        const position = new THREE.Vector3()
        const quaternion = new THREE.Quaternion()
        const scale = new THREE.Vector3()
        mesh.matrixWorld.decompose(position, quaternion, scale)

        // Validacija geometrije
        if (!mesh.geometry) return
        if (!mesh.geometry.boundingBox) {
          mesh.geometry.computeBoundingBox()
        }
        const localBox = mesh.geometry.boundingBox!

        const size = new THREE.Vector3()
        localBox.getSize(size)

        const absScaleX = Math.abs(scale.x)
        const absScaleY = Math.abs(scale.y)
        const absScaleZ = Math.abs(scale.z)

        const worldSize = new THREE.Vector3(
          size.x * absScaleX,
          size.y * absScaleY,
          size.z * absScaleZ
        )

        // 2. Klasifikacija kolajdera
        // Zidovi, podovi i staklene pregrade moraju biti Trimesh kako bi igrač prolazio kroz otvore/vrata
        const trimeshKeywords = [
          'floor', 'pod', 'wall', 'zid', 'plane', 'door', 'fixed_door',
          'frame', 'stok', 'window', 'prozor', 'glass', 'staklo', 'shower_tray', 'shower_wall'
        ]

        // Ako je naziv 'cube' i dimenzije odgovaraju zidu (visina preko 1.8m ili širina/dužina preko 2.0m),
        // tretiramo ga kao Trimesh da bi se očuvale rupe za vrata.
        const isWallLikeCube = name.includes('cube') && (worldSize.y > 1.8 || worldSize.x > 2.0 || worldSize.z > 2.0)
        const isTrimesh = trimeshKeywords.some(key => name.includes(key)) || isWallLikeCube

        if (isTrimesh) {
          // Detektuj plafon i preskoči ga
          // Ako je u pitanju horizontalni ravan objekat (Y skala je tanka) i visoko je pozicioniran, to je plafon/tavan
          const worldYSize = worldSize.y
          const worldMinY = position.y + localBox.min.y * scale.y
          const worldMaxY = position.y + localBox.max.y * scale.y
          
          if (Math.min(worldMinY, worldMaxY) > 2.2 && worldYSize < 0.2) {
            return
          }

          // Rješenje za negativne skale (mirroring) u Rapieru:
          // Kloniramo geometriju i na nju direktno primjenjujemo transformacionu skalu stana,
          // a u Rapier proslijeđujemo skalu [1, 1, 1] da izbjegnemo invertovanje normala trimesha.
          const tempGeom = mesh.geometry.clone()
          const scaleMatrix = new THREE.Matrix4().makeScale(scale.x, scale.y, scale.z)
          tempGeom.applyMatrix4(scaleMatrix)

          items.push(
            <MeshCollider key={mesh.uuid} type="trimesh">
              <mesh
                geometry={tempGeom}
                position={[position.x, position.y, position.z]}
                quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}
                scale={[1, 1, 1]}
              >
                <meshBasicMaterial visible={false} />
              </mesh>
            </MeshCollider>
          )
        } else {
          // Skaliranje veličine bounding boxa prema apsolutnoj svjetskoj skali objekta (sprječava negativne extents)

          const diagonal = worldSize.length()
          // Preskačemo sve minijaturne elemente manje od 15cm
          if (diagonal < 0.15) return

          // Bounding box center za namještaj u svjetskom prostoru
          const localCenter = new THREE.Vector3()
          localBox.getCenter(localCenter)
          
          // Primijenjujemo originalni scale i rotaciju na centar da se ispravno pozicionira u svijetu
          localCenter.multiply(scale).applyQuaternion(quaternion)
          const worldCenter = position.clone().add(localCenter)
          const halfExtents: [number, number, number] = [worldSize.x / 2, worldSize.y / 2, worldSize.z / 2]

          items.push(
            <CuboidCollider
              key={mesh.uuid}
              position={[worldCenter.x, worldCenter.y, worldCenter.z]}
              quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}
              args={halfExtents}
            />
          )
        }
      }
    })
    return items
  }, [scene])

  return (
    <group dispose={null}>
      {/* Prikaz optimizovane geometrije stana */}
      <primitive object={visualScene} />

      {/* Jedan optimizovani compound fiksni rigid body za sve kolajdere */}
      <RigidBody type="fixed" colliders={false}>
        {colliders}
      </RigidBody>

      {/* Sigurnosna mreža na dubini -0.5m za svaki slučaj */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider position={[0, -0.5, 0]} args={[500, 0.5, 500]} />
      </RigidBody>
    </group>
  )
}

