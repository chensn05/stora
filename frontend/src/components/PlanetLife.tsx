import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Random seeded by diary id for stable position */
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** Surface position on sphere */
function surfacePos(radius: number, theta: number, phi: number): [number, number, number] {
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}

interface LifeEntity {
  id: number
  type: 'tree' | 'flower' | 'grass' | 'crystal' | 'flame' | 'animal'
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  diaryId: number
  diaryTitle: string
}

/** Generate life entities based on planet element and diary count */
export function generateLifeEntities(
  planetId: string,
  diaryCount: number,
  radius: number,
  diaryTitles: { id: number; title: string }[] = []
): LifeEntity[] {
  if (diaryCount === 0) return []

  // Element-based life types
  const ELEMENT_LIFE: Record<string, LifeEntity['type'][]> = {
    mercury: ['crystal', 'grass', 'animal'],     // 水: 水晶、水草、小鱼
    venus: ['flower', 'crystal', 'animal'],       // 金: 花、金属花、蝴蝶
    mars: ['flame', 'flower', 'animal'],           // 火: 火焰花、仙人掌花、蜥蜴
    jupiter: ['tree', 'grass', 'animal'],          // 木: 树、草、小鸟
    saturn: ['tree', 'flower', 'grass'],           // 土: 树、花、草
    earth: ['tree', 'flower', 'grass', 'animal'],  // 中枢: 全部
  }

  const types = ELEMENT_LIFE[planetId] || ELEMENT_LIFE['earth']
  const entities: LifeEntity[] = []
  const maxVisible = Math.min(diaryCount, 30) // cap for performance

  for (let i = 0; i < maxVisible; i++) {
    const seed = (diaryTitles[i]?.id || i + 1) * 137
    const rand = seededRandom(seed)
    const type = types[Math.floor(rand() * types.length)]
    const theta = rand() * Math.PI * 2
    const phi = Math.acos(2 * rand() - 1) // uniform sphere distribution

    const pos = surfacePos(radius * 1.02, theta, phi)
    // Orient to face outward from center
    const normal = new THREE.Vector3(...pos).normalize()
    const up = new THREE.Vector3(0, 1, 0)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal)
    const euler = new THREE.Euler().setFromQuaternion(quaternion)

    entities.push({
      id: i,
      type,
      position: pos,
      rotation: [euler.x, euler.y, euler.z],
      scale: 0.6 + rand() * 0.5,
      diaryId: diaryTitles[i]?.id || i + 1,
      diaryTitle: diaryTitles[i]?.title || `日记 ${i + 1}`,
    })
  }

  return entities
}

/** A single 3D life entity on planet surface */
function LifeMesh({ entity, onClick }: { entity: LifeEntity; onClick: (e: LifeEntity) => void }) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    // Gentle sway
    ref.current.rotation.z = Math.sin(t * 0.5 + entity.id) * 0.03
    // Animals bob up and down
    if (entity.type === 'animal') {
      ref.current.position.y = entity.position[1] + Math.sin(t * 1.5 + entity.id) * 0.02
    }
  })

  const color = useMemo(() => {
    const colors: Record<string, string> = {
      tree: '#4a7a3a',
      flower: '#e87aa0',
      grass: '#6aaa4a',
      crystal: '#80d0ff',
      flame: '#ff6633',
      animal: '#ddbb88',
    }
    return colors[entity.type] || '#88aa66'
  }, [entity.type])

  return (
    <group
      ref={ref}
      position={entity.position}
      rotation={entity.rotation}
      scale={entity.scale}
      onClick={(e) => {
        e.stopPropagation()
        onClick(entity)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {entity.type === 'tree' && (
        <>
          {/* trunk */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.08, 6]} />
            <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
          </mesh>
          {/* leaves */}
          <mesh position={[0, 0.18, 0]}>
            <coneGeometry args={[0.06, 0.12, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} emissive={color} emissiveIntensity={0.1} />
          </mesh>
        </>
      )}

      {entity.type === 'flower' && (
        <>
          {/* stem */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.005, 0.008, 0.08, 4]} />
            <meshStandardMaterial color="#4a7a3a" />
          </mesh>
          {/* petals */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.5} />
          </mesh>
          {/* center */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.01, 6, 4]} />
            <meshStandardMaterial color="#ffdd44" emissive="#ffdd44" emissiveIntensity={0.3} />
          </mesh>
        </>
      )}

      {entity.type === 'grass' && (
        <mesh position={[0, 0.03, 0]}>
          <coneGeometry args={[0.02, 0.06, 4]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      )}

      {entity.type === 'crystal' && (
        <mesh position={[0, 0.05, 0]} rotation={[0.3, 0, 0]}>
          <octahedronGeometry args={[0.04, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
            transparent
            opacity={0.8}
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>
      )}

      {entity.type === 'flame' && (
        <mesh position={[0, 0.05, 0]}>
          <coneGeometry args={[0.02, 0.08, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {entity.type === 'animal' && (
        <group>
          {/* body */}
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {/* head */}
          <mesh position={[0, 0.07, 0.015]}>
            <sphereGeometry args={[0.015, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {/* legs */}
          <mesh position={[-0.012, 0.015, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.02, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.012, 0.015, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.02, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/** Life entities layer on a planet */
export function PlanetLife({
  planetId,
  diaryCount,
  radius,
  diaryTitles,
  onSelectEntity,
}: {
  planetId: string
  diaryCount: number
  radius: number
  diaryTitles: { id: number; title: string }[]
  onSelectEntity: (entity: LifeEntity) => void
}) {
  const entities = useMemo(
    () => generateLifeEntities(planetId, diaryCount, radius, diaryTitles),
    [planetId, diaryCount, radius, diaryTitles]
  )

  if (entities.length === 0) return null

  return (
    <group>
      {entities.map((e) => (
        <LifeMesh key={e.id} entity={e} onClick={onSelectEntity} />
      ))}
    </group>
  )
}

export type { LifeEntity }
