import { useState, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { PLANETS, FIVE_PLANETS } from '../data/planets'
import type { PlanetConfig } from '../types'
import { Guardian } from './Guardian'
import { generatePlanetTexture, generateRingTexture, generateStarField } from '../utils/textures'
import { FontMaterialPicker } from './FontMaterialPicker'
import { titleFontSize, titleLetterSpacing } from '../utils/responsive'

const starFieldTex = typeof window !== 'undefined' ? generateStarField() : null

/** A single orbiting planet in the solar system. */
function OrbitingPlanet({
  config,
  onSelect,
}: {
  config: PlanetConfig
  onSelect: (id: string) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const texture = useMemo(
    () => generatePlanetTexture({
      baseColor: config.color,
      glowColor: config.glowColor,
      type: config.textureType,
      seed: config.id.charCodeAt(0) * 100,
    }),
    [config]
  )

  const ringTexture = useMemo(
    () => config.hasRing ? generateRingTexture(config.color, config.glowColor) : null,
    [config]
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      const angle = t * config.orbitSpeed * 0.3
      groupRef.current.position.x = Math.cos(angle) * config.orbitRadius
      groupRef.current.position.z = Math.sin(angle) * config.orbitRadius
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += config.rotationSpeed
      const targetScale = hovered ? 1.25 : 1
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      )
    }
  })

  return (
    <group ref={groupRef}>
      {/* planet body with texture */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(config.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[config.size, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          emissive={config.glowColor}
          emissiveIntensity={hovered ? 0.4 : 0.15}
          roughness={config.textureType === 'gas' ? 0.3 : 0.8}
          metalness={0.2}
        />
      </mesh>

      {/* atmospheric glow */}
      <mesh scale={1.12}>
        <sphereGeometry args={[config.size, 32, 32]} />
        <meshBasicMaterial
          color={config.glowColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* outer glow halo */}
      <mesh scale={1.3}>
        <sphereGeometry args={[config.size, 16, 16]} />
        <meshBasicMaterial
          color={config.glowColor}
          transparent
          opacity={hovered ? 0.08 : 0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* saturn ring */}
      {config.hasRing && ringTexture && (
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <ringGeometry args={[config.size * 1.4, config.size * 2.2, 128]} />
          <meshBasicMaterial
            map={ringTexture}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* guardian companion */}
      <Guardian planet={config} position={[config.size + 0.15, config.size * 0.5, 0]} />

      {/* label */}
      <Text
        position={[0, config.size + 0.35, 0]}
        fontSize={0.2}
        color={hovered ? '#ffffff' : '#99aabb'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {config.name}
      </Text>

      {/* hover info */}
      {hovered && (
        <Text
          position={[0, config.size + 0.6, 0]}
          fontSize={0.14}
          color={config.glowColor}
          anchorX="center"
          anchorY="middle"
        >
          {`「${config.elementName}」· ${config.state}`}
        </Text>
      )}
    </group>
  )
}

/** Orbit ring lines. */
function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    }
    return pts
  }, [radius])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#2a2a4a" transparent opacity={0.4} />
    </line>
  )
}

/** The sun at the center. */
function Sun() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y += 0.003
  })

  const texture = useMemo(() => generatePlanetTexture({
    baseColor: '#ffcc44',
    glowColor: '#ff8800',
    type: 'gas',
    seed: 777,
  }), [])

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.9, 64, 64]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      {/* corona */}
      <mesh scale={1.2}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.2} side={THREE.BackSide} />
      </mesh>
      <mesh scale={1.5}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#ffddaa" intensity={3} distance={60} decay={0.5} />
      <pointLight color="#ffaa66" intensity={1.5} distance={30} />
    </group>
  )
}

/** Background sphere with starfield texture. */
function SpaceBackground() {
  const tex = useMemo(() => starFieldTex, [])
  if (!tex) return null
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[80, 32, 32]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} />
    </mesh>
  )
}

export default function SolarSystem({ onSelect }: { onSelect: (planetId: string) => void }) {
  const [fontPickerOpen, setFontPickerOpen] = useState(false)
  const [titleImageUrl, setTitleImageUrl] = useState<string | null>(null)
  const [popupPlanet, setPopupPlanet] = useState<PlanetConfig | null>(null)

  const allPlanets = [...FIVE_PLANETS, PLANETS.find(p => p.id === 'earth')!]

  return (
    <div style={{ width: '100%', height: '100%', background: '#000005' }}>
      <Canvas
        camera={{ position: [0, 10, 22], fov: 50 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={['#000005']} />
        <ambientLight intensity={0.08} />
        <hemisphereLight args={['#334466', '#000000', 0.15]} />

        <SpaceBackground />
        <Stars radius={100} depth={60} count={5000} factor={5} fade speed={0.3} />

        <Sun />

        {PLANETS.map((p) => (
          <OrbitRing key={`orbit-${p.id}`} radius={p.orbitRadius} />
        ))}

        {PLANETS.map((p) => (
          <OrbitingPlanet key={p.id} config={p} onSelect={onSelect} />
        ))}

        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={40}
          autoRotate
          autoRotateSpeed={0.2}
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.2}
        />
      </Canvas>

      {/* UI overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '24px',
        pointerEvents: 'none',
        textAlign: 'center',
      }}>
        <h1 className="stora-title" style={{
          color: '#fff',
          fontSize: titleFontSize(),
          fontWeight: 400,
          letterSpacing: titleLetterSpacing(),
          textShadow: '0 0 12px rgba(100,180,255,0.5)',
          margin: 0,
          fontFamily: '"Ma Shan Zheng", cursive',
          paddingLeft: '4px',
        }}>
          {titleImageUrl ? (
            <img src={titleImageUrl} alt="Stora" style={{ maxHeight: '72px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 20px rgba(100,150,255,0.5))' }} />
          ) : (
            <>Stora</>
          )}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
          <p className="stora-subtitle" style={{
            color: '#778899',
            fontSize: '14px',
            letterSpacing: '3px',
            fontFamily: '"Liu Jian Mao Cao", cursive',
            margin: 0,
          }}>
            点击行星 · 记录此刻的你
          </p>
          <button
            className="stora-material-btn" onClick={() => setFontPickerOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#8899bb',
              padding: '4px 12px',
              borderRadius: '14px',
              cursor: 'pointer',
              fontSize: '11px',
              pointerEvents: 'auto',
              backdropFilter: 'blur(10px)',
            }}
          >
            🎨 材质标题
          </button>
        </div>
      </div>

      {/* planet legend with popup */}
      <div style={{
        position: 'absolute',
        bottom: "24px",
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '600px',
        zIndex: 10,
      }}>
        {allPlanets.map((p) => (
          <div key={p.id} style={{ position: 'relative' }}>
            <div
              onClick={() => {
                if (popupPlanet?.id === p.id) {
                  // second click on same planet = enter
                  onSelect(p.id)
                } else {
                  setPopupPlanet(p)
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: popupPlanet?.id === p.id ? `${p.glowColor}20` : 'rgba(10,10,30,0.6)',
                backdropFilter: 'blur(10px)',
                border: popupPlanet?.id === p.id ? `1px solid ${p.glowColor}` : `1px solid ${p.color}40`,
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                color: popupPlanet?.id === p.id ? '#fff' : '#aabbcc',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (popupPlanet?.id !== p.id) {
                  e.currentTarget.style.borderColor = p.glowColor
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseOut={(e) => {
                if (popupPlanet?.id !== p.id) {
                  e.currentTarget.style.borderColor = `${p.color}40`
                  e.currentTarget.style.color = '#aabbcc'
                }
              }}
            >
              <span style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: p.color,
                boxShadow: `0 0 8px ${p.glowColor}`,
              }} />
              {p.name}
              <span style={{ color: p.glowColor, fontSize: '10px' }}>{p.elementName}</span>
            </div>

            {/* Popup card */}
            {popupPlanet?.id === p.id && (
              <div style={{
                position: 'absolute',
                bottom: '44px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '240px',
                background: 'rgba(15,15,35,0.96)',
                backdropFilter: 'blur(20px)',
                borderRadius: '14px',
                border: `1px solid ${p.glowColor}30`,
                padding: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                animation: 'popupIn 0.2s ease-out',
              }}>
                {/* tail */}
                <div style={{
                  position: 'absolute',
                  bottom: '-7px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderTop: `7px solid rgba(15,15,35,0.96)`,
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    width: '12px', height: '12px',
                    borderRadius: '50%',
                    background: p.color,
                    boxShadow: `0 0 10px ${p.glowColor}`,
                  }} />
                  <span style={{
                    fontSize: '17px',
                    fontWeight: 500,
                    color: '#ddeeff',
                    fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
                  }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: p.glowColor,
                    background: `${p.glowColor}20`,
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    {p.elementName}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#8899bb',
                  }}>
                    · {p.state}
                  </span>
                </div>

                <p className="stora-subtitle" style={{
                  fontSize: '13px',
                  color: '#99aabb',
                  lineHeight: 1.6,
                  margin: '0 0 12px',
                }}>
                  {p.stateDesc}
                </p>

                <button
                  onClick={() => onSelect(p.id)}
                  style={{
                    width: '100%',
                    background: `${p.glowColor}30`,
                    border: `1px solid ${p.glowColor}50`,
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  前往{p.name} →
                </button>
              </div>
            )}
          </div>
        ))}

        <style>{`
          @keyframes popupIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(8px); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </div>

      {/* Font material picker modal */}
      {fontPickerOpen && (
        <FontMaterialPicker
          onGenerated={(url) => setTitleImageUrl(url)}
          onClose={() => setFontPickerOpen(false)}
        />
      )}
    </div>
  )
}
