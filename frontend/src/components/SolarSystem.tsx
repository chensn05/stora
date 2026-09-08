import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { PLANETS, FIVE_PLANETS } from '../data/planets'
import type { PlanetConfig } from '../types'
import { FontMaterialPicker } from './FontMaterialPicker'
import { titleFontSize, titleLetterSpacing, isSmallMobile } from '../utils/responsive'

// ---------- Texture helpers ----------
const texLoader = new THREE.TextureLoader()
function useTexture(url: string) {
  return useMemo(() => {
    const t = texLoader.load(url)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [url])
}

const TEX = {
  mercury: '/textures/2k_mercury.jpg',
  venus: '/textures/2k_venus_surface.jpg',
  earth: '/textures/2k_earth_daymap.jpg',
  earthNight: '/textures/2k_earth_nightmap.jpg',
  mars: '/textures/2k_mars.jpg',
  jupiter: '/textures/2k_jupiter.jpg',
  saturn: '/textures/2k_saturn.jpg',
  saturnRing: '/textures/2k_saturn_ring_alpha.png',
  sun: '/textures/2k_sun.jpg',
  milkyWay: '/textures/2k_stars_milky_way.jpg',
}

// ---------- Earth day/night shader ----------
const earthVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const earthFrag = /* glsl */ `
  uniform sampler2D dayTex;
  uniform sampler2D nightTex;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    float d = dot(normalize(vNormalW), normalize(uSunDir));
    float m = smoothstep(-0.08, 0.25, d);
    vec3 day = texture2D(dayTex, vUv).rgb;
    vec3 night = texture2D(nightTex, vUv).rgb * vec3(1.1, 1.1, 1.35);
    gl_FragColor = vec4(mix(night, day, m), 1.0);
  }
`

function EarthMesh({ size, onSelect, id, hovered, setHovered, meshRef }: any) {
  const dayTex = useTexture(TEX.earth)
  const nightTex = useTexture(TEX.earthNight)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)

  const uniforms = useMemo(() => ({
    dayTex: { value: dayTex },
    nightTex: { value: nightTex },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
  }), [dayTex, nightTex])

  useFrame(() => {
    if (groupRef.current && matRef.current) {
      // sun at origin; direction from earth to sun
      const dir = groupRef.current.getWorldPosition(new THREE.Vector3()).negate().normalize()
      matRef.current.uniforms.uSunDir.value.copy(dir)
    }
    if (meshRef?.current) meshRef.current.rotation.y += 0.002
  })

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(id) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[size, 64, 64]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={earthVert}
          fragmentShader={earthFrag}
          uniforms={uniforms}
        />
      </mesh>
      <AtmosphereGlow color="#6ab4ff" size={size} intensity={hovered ? 1.6 : 1.0} />
    </group>
  )
}

// ---------- Atmosphere fresnel glow ----------
const atmoVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const atmoFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vViewDir), normalize(vNormal))), 2.5);
    gl_FragColor = vec4(uColor * f * uIntensity, f * 0.55 * uIntensity);
  }
`

function AtmosphereGlow({ color, size, intensity = 1.0 }: { color: string; size: number; intensity?: number }) {
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
  }), [color, intensity])
  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[size, 32, 32]} />
      <shaderMaterial
        vertexShader={atmoVert}
        fragmentShader={atmoFrag}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ---------- Sun ----------
function Sun() {
  const ref = useRef<THREE.Mesh>(null)
  const tex = useTexture(TEX.sun)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ref.current) {
      ref.current.rotation.y += 0.001
      const s = 1 + Math.sin(t * 1.5) * 0.008
      ref.current.scale.setScalar(s)
    }
  })
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.9, 64, 64]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      <mesh scale={1.25}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color="#ffaa33" transparent opacity={0.16} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={1.7}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial color="#ff7722" transparent opacity={0.07} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color="#ffe4b3" intensity={3} distance={80} decay={0.4} />
      <pointLight color="#ffaa66" intensity={1.2} distance={30} />
    </group>
  )
}

// ---------- Milky way sky ----------
function SkySphere() {
  const tex = useTexture(TEX.milkyWay)
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[90, 48, 48]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} />
    </mesh>
  )
}

// ---------- Meteor ----------
function Meteor() {
  const ref = useRef<THREE.Group>(null)
  const [active, setActive] = useState(false)
  const data = useRef({ t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), next: 5 + Math.random() * 15 })

  useFrame((_, dt) => {
    if (!active) {
      data.current.next -= dt
      if (data.current.next <= 0) {
        const a = Math.random() * Math.PI * 2
        const y = 6 + Math.random() * 10
        data.current.from.set(Math.cos(a) * 30, y, Math.sin(a) * 30)
        data.current.to.set(Math.cos(a + 0.6 + Math.random()) * 30, y - 4 - Math.random() * 5, Math.sin(a + 0.6 + Math.random()) * 30)
        data.current.t = 0
        setActive(true)
      }
      return
    }
    data.current.t += dt / 1.2
    const t = data.current.t
    if (ref.current) {
      ref.current.position.lerpVectors(data.current.from, data.current.to, t)
      const fade = t > 0.7 ? (1 - t) / 0.3 : 1
      ref.current.children.forEach((c: any) => {
        if (c.material) c.material.opacity = fade * (c.userData.baseOpacity ?? 1)
      })
    }
    if (t >= 1) {
      setActive(false)
      data.current.next = 12 + Math.random() * 25
    }
  })

  if (!active) return null
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffeecc" transparent opacity={1} userData={{ baseOpacity: 1 }} />
      </mesh>
      <mesh position={[0.15, 0.06, 0]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial color="#ffcc88" transparent opacity={0.7} userData={{ baseOpacity: 0.7 }} />
      </mesh>
      <mesh position={[0.3, 0.12, 0]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color="#ffaa66" transparent opacity={0.4} userData={{ baseOpacity: 0.4 }} />
      </mesh>
    </group>
  )
}

// ---------- Planet ----------
function Planet({
  config,
  speed,
  paused,
  showLabel,
  onSelect,
  registerRef,
}: {
  config: PlanetConfig
  speed: number
  paused: boolean
  showLabel: boolean
  onSelect: (id: string) => void
  registerRef: (id: string, obj: THREE.Group | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const angle = useRef(Math.random() * Math.PI * 2)

  const texUrl = (TEX as any)[config.id] as string
  const tex = useTexture(texUrl)
  const ringTex = useTexture(TEX.saturnRing)

  useEffect(() => {
    registerRef(config.id, groupRef.current)
    return () => registerRef(config.id, null)
  }, [config.id, registerRef])

  useFrame((_, dt) => {
    if (!paused) angle.current += dt * config.orbitSpeed * 0.3 * speed
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle.current) * config.orbitRadius
      groupRef.current.position.z = Math.sin(angle.current) * config.orbitRadius
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * config.rotationSpeed * (paused ? 0 : 1) * Math.max(speed, 1)
      const target = hovered ? 1.18 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15)
    }
  })

  if (config.id === 'earth') {
    return (
      <group ref={groupRef}>
        <EarthMesh size={config.size} onSelect={onSelect} id={config.id} hovered={hovered} setHovered={setHovered} meshRef={meshRef} />
        {showLabel && (
          <Text position={[0, config.size + 0.32, 0]} fontSize={0.19} color={hovered ? '#ffffff' : '#99aabb'} anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#000000">
            {config.name}
          </Text>
        )}
      </group>
    )
  }

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(config.id) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[config.size, 64, 64]} />
        <meshStandardMaterial map={tex} roughness={0.85} metalness={0.05} />
      </mesh>

      {config.id === 'saturn' && (
        <mesh rotation={[Math.PI / 2.25, 0.15, 0]}>
          <ringGeometry args={[config.size * 1.25, config.size * 2.3, 96]} />
          <meshBasicMaterial map={ringTex} transparent side={THREE.DoubleSide} opacity={0.95} depthWrite={false} />
        </mesh>
      )}

      <AtmosphereGlow
        color={config.glowColor}
        size={config.size}
        intensity={hovered ? 1.8 : 0.7}
      />

      {showLabel && (
        <Text position={[0, config.size + 0.32, 0]} fontSize={0.19} color={hovered ? '#ffffff' : '#99aabb'} anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#000000">
          {config.name}
        </Text>
      )}
    </group>
  )
}

// ---------- Orbit ring ----------
function OrbitRing({ radius }: { radius: number }) {
  const geom = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [radius])
  return (
    <line geometry={geom}>
      <lineBasicMaterial color="#3a4a6a" transparent opacity={0.45} />
    </line>
  )
}

// ---------- Camera rig (fly-to + tracking) ----------
function CameraRig({
  flyTo,
  tracking,
  planetRefs,
  controlsRef,
  homePos,
  onArrive,
}: {
  flyTo: { id: string } | null
  tracking: string | null
  planetRefs: React.MutableRefObject<Map<string, THREE.Group>>
  controlsRef: any
  homePos: THREE.Vector3
  onArrive: () => void
}) {
  const { camera } = useThree()
  const anim = useRef<{
    active: boolean
    t: number
    from: THREE.Vector3
    to: THREE.Vector3
    fromT: THREE.Vector3
    toT: THREE.Vector3
  }>({ active: false, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), fromT: new THREE.Vector3(), toT: new THREE.Vector3() })

  useEffect(() => {
    if (!flyTo) return
    const ctrl = controlsRef.current
    if (!ctrl) return
    let target: THREE.Vector3
    if (flyTo.id === 'home') {
      target = homePos.clone()
      anim.current.toT.set(0, 0, 0)
    } else {
      const obj = planetRefs.current.get(flyTo.id)
      if (!obj) return
      const p = obj.getWorldPosition(new THREE.Vector3())
      const size = (obj.children[0] as any)?.geometry?.parameters?.radius ?? 0.5
      const dir = camera.position.clone().sub(p).normalize()
      if (dir.lengthSq() < 0.5) dir.set(0.5, 0.6, 1).normalize()
      target = p.clone().add(dir.multiplyScalar(size * 6 + 1.2))
      anim.current.toT.copy(p)
    }
    anim.current.from.copy(camera.position)
    anim.current.to.copy(target)
    anim.current.fromT.copy(ctrl.target)
    anim.current.t = 0
    anim.current.active = true
  }, [flyTo])

  useFrame((_, dt) => {
    const ctrl = controlsRef.current
    if (anim.current.active && ctrl) {
      anim.current.t += dt / 1.6
      const t = Math.min(anim.current.t, 1)
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      // if tracking a moving planet, re-aim at its live position
      if (flyTo && flyTo.id !== 'home') {
        const obj = planetRefs.current.get(flyTo.id)
        if (obj) anim.current.toT.copy(obj.getWorldPosition(new THREE.Vector3()))
      }
      camera.position.lerpVectors(anim.current.from, anim.current.to, e)
      ctrl.target.lerpVectors(anim.current.fromT, anim.current.toT, e)
      ctrl.update()
      if (t >= 1) {
        anim.current.active = false
        onArrive()
      }
    } else if (tracking && ctrl) {
      const obj = planetRefs.current.get(tracking)
      if (obj) {
        const p = obj.getWorldPosition(new THREE.Vector3())
        ctrl.target.lerp(p, 0.15)
        ctrl.update()
      }
    }
  })
  return null
}

// ---------- Main ----------
export default function SolarSystem({ onSelect }: { onSelect: (planetId: string) => void }) {
  const [fontPickerOpen, setFontPickerOpen] = useState(false)
  const [titleImageUrl, setTitleImageUrl] = useState<string | null>(null)
  const [speed, setSpeed] = useState(1)
  const [paused, setPaused] = useState(false)
  const [showOrbits, setShowOrbits] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [flyTo, setFlyTo] = useState<{ id: string } | null>(null)
  const [tracking, setTracking] = useState<string | null>(null)
  const [infoPlanet, setInfoPlanet] = useState<PlanetConfig | null>(null)

  const planetRefs = useRef<Map<string, THREE.Group>>(new Map())
  const controlsRef = useRef<any>(null)
  const homePos = useMemo(() => new THREE.Vector3(0, 9, 20), [])

  const allPlanets = [...FIVE_PLANETS, PLANETS.find(p => p.id === 'earth')!]

  const registerRef = useCallback((id: string, obj: THREE.Group | null) => {
    if (obj) planetRefs.current.set(id, obj)
    else planetRefs.current.delete(id)
  }, [])

  const handlePlanetClick = useCallback((id: string) => {
    if (tracking === id) {
      // already tracking → enter planet
      onSelect(id)
      return
    }
    setFlyTo({ id })
    setTracking(id)
    setInfoPlanet(null)
  }, [tracking, onSelect])

  const handleArrive = useCallback(() => {
    if (tracking) {
      const cfg = PLANETS.find(p => p.id === tracking)
      if (cfg) setInfoPlanet(cfg)
    }
  }, [tracking])

  const goHome = useCallback(() => {
    setTracking(null)
    setInfoPlanet(null)
    setFlyTo({ id: 'home' })
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', background: '#000005', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 9, 20], fov: 50 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={['#000005']} />
        <ambientLight intensity={0.08} />
        <hemisphereLight args={['#334466', '#000000', 0.12]} />

        <SkySphere />
        <Meteor />
        <Sun />

        {showOrbits && PLANETS.map((p) => (
          <OrbitRing key={`orbit-${p.id}`} radius={p.orbitRadius} />
        ))}

        {PLANETS.map((p) => (
          <Planet
            key={p.id}
            config={p}
            speed={speed}
            paused={paused}
            showLabel={showLabels}
            onSelect={handlePlanetClick}
            registerRef={registerRef}
          />
        ))}

        <CameraRig
          flyTo={flyTo}
          tracking={tracking}
          planetRefs={planetRefs}
          controlsRef={controlsRef}
          homePos={homePos}
          onArrive={handleArrive}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={2}
          maxDistance={45}
          autoRotate={!tracking}
          autoRotateSpeed={0.15}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.15}
        />

        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Title overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: isSmallMobile() ? '14px' : '24px',
        pointerEvents: 'none',
        textAlign: 'center',
        zIndex: 5,
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
            fontSize: isSmallMobile() ? '12px' : '14px',
            letterSpacing: '3px',
            fontFamily: '"Liu Jian Mao Cao", cursive',
            margin: 0,
          }}>
            点击行星 · 飞向它
          </p>
          <button
            className="stora-material-btn"
            onClick={() => setFontPickerOpen(true)}
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

      {/* Tracking info popup */}
      {infoPlanet && (
        <div style={{
          position: 'absolute',
          top: isSmallMobile() ? '86px' : '110px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(12,12,32,0.85)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${infoPlanet.glowColor}40`,
          borderRadius: '14px',
          padding: '14px 20px',
          textAlign: 'center',
          zIndex: 8,
          animation: 'popupIn 0.3s ease-out',
          maxWidth: '88vw',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: infoPlanet.color, boxShadow: `0 0 10px ${infoPlanet.glowColor}` }} />
            <span style={{ color: '#ddeeff', fontSize: '18px', fontFamily: '"Ma Shan Zheng", cursive' }}>{infoPlanet.name}</span>
            <span style={{ color: infoPlanet.glowColor, fontSize: '12px', background: `${infoPlanet.glowColor}20`, padding: '2px 8px', borderRadius: '10px' }}>{infoPlanet.elementName}</span>
            <span style={{ color: '#8899bb', fontSize: '12px' }}>· {infoPlanet.state}</span>
          </div>
          <p style={{ color: '#99aabb', fontSize: '12px', margin: '8px 0 12px', lineHeight: 1.6 }}>
            {infoPlanet.stateDesc}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => onSelect(infoPlanet.id)}
              style={{
                background: `${infoPlanet.glowColor}30`,
                border: `1px solid ${infoPlanet.glowColor}60`,
                color: '#fff',
                padding: '8px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              进入{infoPlanet.name} →
            </button>
            <button
              onClick={goHome}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#aabbcc',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              返回全景
            </button>
          </div>
        </div>
      )}

      {/* Bottom control bar */}
      <div style={{
        position: 'absolute',
        bottom: isSmallMobile() ? '14px' : '22px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        zIndex: 10,
        maxWidth: '96vw',
      }}>
        {/* planet nav row */}
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {allPlanets.map((p) => (
            <div
              key={p.id}
              onClick={() => handlePlanetClick(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: isSmallMobile() ? '5px 10px' : '7px 13px',
                background: tracking === p.id ? `${p.glowColor}25` : 'rgba(10,10,30,0.65)',
                backdropFilter: 'blur(10px)',
                border: tracking === p.id ? `1px solid ${p.glowColor}` : `1px solid ${p.color}35`,
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: isSmallMobile() ? '11px' : '12px',
                color: tracking === p.id ? '#fff' : '#aabbcc',
                transition: 'all 0.2s',
              }}
            >
              <span style={{
                width: '7px', height: '7px',
                borderRadius: '50%',
                background: p.color,
                boxShadow: `0 0 8px ${p.glowColor}`,
              }} />
              {p.name}
              <span style={{ color: p.glowColor, fontSize: '10px' }}>{p.elementName}</span>
            </div>
          ))}
        </div>

        {/* controls row */}
        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <CtrlBtn active={showOrbits} onClick={() => setShowOrbits(v => !v)} label="轨道" />
          <CtrlBtn active={showLabels} onClick={() => setShowLabels(v => !v)} label="标记" />
          <span style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
          {[0.25, 1, 5, 20].map((s) => (
            <CtrlBtn key={s} active={speed === s && !paused} onClick={() => { setSpeed(s); setPaused(false) }} label={`${s}×`} />
          ))}
          <CtrlBtn active={paused} onClick={() => setPaused(v => !v)} label={paused ? '▶' : '⏸'} />
          {tracking && (
            <>
              <span style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
              <CtrlBtn active={false} onClick={goHome} label="返回全景" />
            </>
          )}
        </div>
      </div>

      {/* Font material picker modal */}
      {fontPickerOpen && (
        <FontMaterialPicker
          onGenerated={(url) => setTitleImageUrl(url)}
          onClose={() => setFontPickerOpen(false)}
        />
      )}

      <style>{`
        @keyframes popupIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

function CtrlBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(100,150,255,0.25)' : 'rgba(10,10,30,0.65)',
        border: active ? '1px solid rgba(100,150,255,0.6)' : '1px solid rgba(255,255,255,0.12)',
        color: active ? '#fff' : '#8899bb',
        padding: '5px 12px',
        borderRadius: '14px',
        cursor: 'pointer',
        fontSize: '12px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}
