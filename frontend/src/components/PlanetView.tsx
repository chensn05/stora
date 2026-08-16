import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { PLANET_MAP } from '../data/planets'
import { api } from '../api'
import type { Diary } from '../types'
import { Guardian } from './Guardian'
import { DiaryEditor } from './DiaryEditor'
import { GuardianCharacter } from './GuardianCharacter'
import { PlanetLife, type LifeEntity } from './PlanetLife'
import { generatePlanetTexture, generateRingTexture } from '../utils/textures'
import { useStackedLayout, guardianSize, chatPanelWidth, chatPanelHeight } from '../utils/responsive'

/** 3D planet close-up view with auto-rotation. */
function PlanetSphere({ planetId, diaryTitles }: { planetId: string; diaryTitles: { id: number; title: string }[] }) {
  const config = PLANET_MAP[planetId]
  const meshRef = useRef<THREE.Mesh>(null)
  
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
    if (meshRef.current) meshRef.current.rotation.y += 0.003
  })

  if (!config) return null

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          map={texture}
          emissive={config.glowColor}
          emissiveIntensity={0.2}
          roughness={config.textureType === 'gas' ? 0.3 : 0.8}
          metalness={0.2}
        />
      </mesh>

      {/* atmospheric glow */}
      <mesh scale={1.08}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color={config.glowColor}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh scale={1.2}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial
          color={config.glowColor}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* saturn ring */}
      {config.hasRing && ringTexture && (
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <ringGeometry args={[2.8, 4.5, 128]} />
          <meshBasicMaterial
            map={ringTexture}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* guardian */}
      <Guardian planet={config} position={[2.3, 1, 0.5]} />
      {/* Life entities on planet surface */}
      <PlanetLife
        planetId={planetId}
        diaryCount={diaryTitles.length}
        radius={2}
        diaryTitles={diaryTitles}
        onSelectEntity={(e) => {
          // dispatch custom event for UI to catch
          window.dispatchEvent(new CustomEvent('lifeEntityClick', { detail: e }))
        }}
      />
    </group>
  )
}
export default function PlanetView({
  planetId,
  onBack,
}: {
  planetId: string
  onBack: () => void
}) {
  const config = PLANET_MAP[planetId]
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)

  useEffect(() => {
    const handler = (e: any) => setSelectedEntity(e.detail)
    window.addEventListener('lifeEntityClick', handler)
    return () => window.removeEventListener('lifeEntityClick', handler)
  }, [])

  const loadDiaries = useCallback(async () => {
    const res = await api.listDiaries(planetId)
    if (res?.diaries) setDiaries(res.diaries)
    setLoading(false)
  }, [planetId])

  useEffect(() => {
    setLoading(true)
    loadDiaries()
  }, [loadDiaries])

  if (!config) return null

  const handleSave = async (data: {
    title: string
    content: string
    mood: string
    visibility: string
  }) => {
    try {
      const res = await api.createDiary({
        planet: planetId,
        ...data,
      })
      if (res?.id || res?.ok) {
        setShowEditor(false)
        await loadDiaries()
      } else {
        // Even if response is unclear, try refreshing
        setShowEditor(false)
        await loadDiaries()
      }
    } catch (e) {
      setShowEditor(false)
      await loadDiaries()
    }
  }

  const handleDelete = async (id: number) => {
    await api.deleteDiary(id)
    loadDiaries()
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: useStackedLayout() ? 'column' : 'row', background: '#000010' }}>
      {/* 3D planet view - left side */}
      <div style={{ flex: useStackedLayout() ? '1 1 40%' : '1 1 50%', position: 'relative' }}>
        <Canvas camera={{ position: [0, 1, 7], fov: 45 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
          <color attach="background" args={['#000010']} />
          <ambientLight intensity={0.15} />
          <pointLight position={[5, 5, 5]} intensity={1.5} color={config.glowColor} />
          <PlanetSphere planetId={planetId} diaryTitles={diaries.map(d => ({ id: d.id, title: d.title || d.content.slice(0, 20) }))} />
          <OrbitControls enablePan={false} minDistance={4} maxDistance={12} autoRotate autoRotateSpeed={0.3} />
        </Canvas>

        {/* planet info overlay */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: '#fff',
          maxWidth: '300px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              display: 'inline-block',
              width: '12px', height: '12px',
              borderRadius: '50%',
              background: config.color,
              boxShadow: `0 0 12px ${config.glowColor}`,
            }} />
            <h2 style={{ margin: 0, fontSize: '44px', fontWeight: 400, letterSpacing: '4px', fontFamily: '"Ma Shan Zheng", cursive', textShadow: '0 0 16px rgba(100,150,255,0.4)' }}>{config.name}</h2>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#8899bb' }}>
            <span style={{ color: config.guideColor }}>「{config.elementName}」</span>
            {' · '}
            <span>{config.state}</span>
          </div>
          <p style={{ marginTop: '10px', fontSize: '13px', color: '#aabbcc', lineHeight: 1.6 }}>
            {config.stateDesc}
          </p>
        </div>

        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            backdropFilter: 'blur(10px)',
            zIndex: 20,
          }}
        >
          ← 返回星系
        </button>

        <GuardianCharacter planetId={planetId} elementName={config.elementName} state={config.state} />

        {/* Life entity popup */}
        {selectedEntity && (
          <div style={{
            position: 'absolute',
            bottom: '180px',
            left: '20px',
            background: 'rgba(15,15,35,0.96)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: `1px solid ${config.glowColor}40`,
            padding: '14px 18px',
            maxWidth: '280px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 15,
            animation: 'popupIn 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>
                {selectedEntity.type === 'tree' ? '🌳' : selectedEntity.type === 'flower' ? '🌸' : selectedEntity.type === 'grass' ? '🌱' : selectedEntity.type === 'crystal' ? '💎' : selectedEntity.type === 'flame' ? '🔥' : '🐾'}
              </span>
              <span style={{ color: config.glowColor, fontSize: '13px', fontWeight: 500 }}>
                {selectedEntity.type === 'tree' ? '树苗' : selectedEntity.type === 'flower' ? '花朵' : selectedEntity.type === 'grass' ? '草丛' : selectedEntity.type === 'crystal' ? '水晶' : selectedEntity.type === 'flame' ? '火焰' : '小生灵'}
              </span>
              <span style={{ color: '#556677', fontSize: '11px' }}>· 由此日记生长</span>
            </div>
            <p style={{ color: '#aabbcc', fontSize: '13px', lineHeight: 1.5, margin: '0 0 8px' }}>
              {selectedEntity.diaryTitle}
            </p>
            <button
              onClick={() => setSelectedEntity(null)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: '#667788',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              关闭
            </button>
          </div>
        )}

        <style>{`
          @keyframes popupIn {
            0% { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>

      {/* diary list - right side */}
      <div style={{
        flex: useStackedLayout() ? '1 1 60%' : '1 1 50%',
        padding: useStackedLayout() ? '16px' : '24px',
        overflowY: 'auto',
        background: 'rgba(10,10,30,0.8)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 400, margin: 0 }}>
            星球内核 · {diaries.length} 篇日记
          </h3>
          <button
            onClick={() => setShowEditor(!showEditor)}
            style={{
              background: config.glowColor,
              border: 'none',
              color: '#000',
              padding: '8px 20px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {showEditor ? '取消' : `写入${config.name}`}
          </button>
        </div>

        {showEditor && (
          <DiaryEditor onSave={handleSave} planetName={config.name} planetState={config.state} />
        )}

        {loading ? (
          <p style={{ color: '#667788' }}>加载中...</p>
        ) : diaries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#556677',
          }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>∅</p>
            <p>这颗星球还是空的</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>点击「写入{config.name}」开始记录</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {diaries.map((d) => (
              <div
                key={d.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {d.title && (
                      <h4 style={{ color: '#ddeeff', fontSize: '15px', margin: '0 0 6px' }}>{d.title}</h4>
                    )}
                    <p style={{ color: '#aabbcc', fontSize: '14px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {d.content}
                    </p>
                    {d.mood && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '8px',
                        fontSize: '16px',
                        color: config.guideColor,
                        background: `${config.glowColor}15`,
                        padding: '4px 12px',
                        borderRadius: '16px',
                        lineHeight: 1,
                      }}>
                        {d.mood}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(d.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#556677',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '4px',
                    }}
                  >
                    删除
                  </button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#556677' }}>
                  {new Date(d.createdAt).toLocaleString('zh-CN')}
                  {' · '}
                  {d.visibility === 'private' ? '私密' : d.visibility === 'friends' ? '好友可见' : '公开'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
