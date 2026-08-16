import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PlanetConfig } from '../types'

/** Small guardian companion floating next to a planet. */
export function Guardian({ planet, position }: { planet: PlanetConfig; position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  const baseY = position[1]

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const p = planet.id

    // different motion patterns per guardian type
    if (p === 'mercury') {
      // droplet: fast erratic bobbing
      ref.current.position.y = baseY + Math.sin(t * 3) * 0.08
      ref.current.position.x = position[0] + Math.cos(t * 2.5) * 0.06
      ref.current.position.z = position[2] + Math.sin(t * 2) * 0.06
    } else if (p === 'venus') {
      // mirror: slow gentle rotation
      ref.current.position.y = baseY + Math.sin(t * 0.8) * 0.04
      ref.current.rotation.y = t * 0.5
    } else if (p === 'mars') {
      // flame: flickering up-down
      const flicker = Math.sin(t * 5) * 0.05 + Math.sin(t * 7) * 0.03
      ref.current.position.y = baseY + flicker + 0.06
      ref.current.scale.y = 1 + Math.sin(t * 6) * 0.15
    } else if (p === 'jupiter') {
      // seed: slow growth pulsing
      const pulse = 1 + Math.sin(t * 0.6) * 0.1
      ref.current.scale.setScalar(pulse)
      ref.current.position.y = baseY + Math.sin(t * 0.5) * 0.03
    } else if (p === 'saturn') {
      // pot: steady orbit around planet
      const angle = t * 0.3
      ref.current.position.x = position[0] + Math.cos(angle) * 0.12
      ref.current.position.z = position[2] + Math.sin(angle) * 0.12
      ref.current.position.y = baseY
    } else if (p === 'earth') {
      // moon: orbit earth
      const angle = t * 0.4
      ref.current.position.x = position[0] + Math.cos(angle) * 0.15
      ref.current.position.z = position[2] + Math.sin(angle) * 0.15
      ref.current.position.y = baseY + Math.sin(angle) * 0.05
    }
  })

  // build different geometry per guardian type
  const geometry = useMemo(() => {
    switch (planet.guideShape) {
      case 'droplet':
        return new THREE.ConeGeometry(0.04, 0.1, 8)
      case 'mirror':
        return new THREE.OctahedronGeometry(0.05, 0)
      case 'flame':
        return new THREE.ConeGeometry(0.035, 0.09, 6)
      case 'seed':
        return new THREE.SphereGeometry(0.05, 8, 6)
      case 'pot':
        return new THREE.DodecahedronGeometry(0.045, 0)
      case 'moon':
        return new THREE.SphereGeometry(0.04, 8, 6)
      default:
        return new THREE.SphereGeometry(0.04, 8, 6)
    }
  }, [planet.guideShape])

  return (
    <mesh ref={ref} geometry={geometry} position={position}>
      <meshStandardMaterial
        color={planet.guideColor}
        emissive={planet.guideColor}
        emissiveIntensity={0.5}
        transparent
        opacity={0.85}
      />
    </mesh>
  )
}
