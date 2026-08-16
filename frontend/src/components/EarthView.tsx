import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { PLANETS, FIVE_PLANETS, PLANET_MAP } from '../data/planets'
import { api } from '../api'
import type { Balance, FeedItem } from '../types'
import { Guardian } from './Guardian'
import { GuardianCharacter } from './GuardianCharacter'
import { generatePlanetTexture, generateStarField } from '../utils/textures'

/** Earth 3D sphere. */
function EarthSphere() {
  const config = PLANET_MAP['earth']
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useMemo(() => generatePlanetTexture({
    baseColor: config.color,
    glowColor: config.glowColor,
    type: config.textureType,
    seed: 42,
  }), [config])

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.002
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          map={texture}
          emissive="#1a3a5a"
          emissiveIntensity={0.15}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>
      {/* atmosphere */}
      <mesh scale={1.08}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#87ceeb" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      <mesh scale={1.2}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#4a90d9" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <Guardian planet={config} position={[2.3, 0.8, 0.5]} />
    </group>
  )
}

/** Five elements balance bar chart. */
function BalanceChart({ balance }: { balance: Balance | null }) {
  if (!balance) return null

  const maxCount = Math.max(...Object.values(balance.counts), 1)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <h4 style={{ color: '#ccddee', fontSize: '14px', margin: '0 0 12px', fontWeight: 400 }}>
        五行平衡 · 近30天
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {FIVE_PLANETS.map((p) => {
          const count = balance.counts[p.id] || 0
          const widthPct = (count / maxCount) * 100
          const isDominant = balance.dominant === p.id
          const isWeak = balance.weak === p.id
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '50px',
                fontSize: '13px',
                color: p.glowColor,
                flexShrink: 0,
              }}>
                {p.name}
              </span>
              <div style={{
                flex: 1,
                height: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  background: isDominant
                    ? p.glowColor
                    : isWeak
                    ? '#334455'
                    : p.color,
                  borderRadius: '6px',
                  transition: 'width 0.5s ease',
                  boxShadow: isDominant ? `0 0 8px ${p.glowColor}` : 'none',
                }} />
              </div>
              <span style={{
                width: '24px',
                textAlign: 'right',
                fontSize: '12px',
                color: '#667788',
                flexShrink: 0,
              }}>
                {count}
              </span>
            </div>
          )
        })}
      </div>
      {balance.tip && (
        <div style={{
          marginTop: '12px',
          padding: '10px 12px',
          background: 'rgba(255,200,100,0.08)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#ddcc88',
          lineHeight: 1.5,
        }}>
          💡 {balance.tip}
        </div>
      )}
    </div>
  )
}

/** Friend circle feed item. */
function FeedItemCard({ item, currentUserId }: { item: FeedItem; currentUserId: number }) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(item.liked)
  const [likeCount, setLikeCount] = useState(item.likeCount)

  const planet = PLANET_MAP[item.planet]
  const isOwn = item.userId === currentUserId

  const handleLike = async () => {
    const res = await api.toggleLike(item.id)
    if (res?.liked !== undefined) {
      setLiked(res.liked)
      setLikeCount((c) => (res.liked ? c + 1 : c - 1))
    }
  }

  const loadComments = async () => {
    const res = await api.listComments(item.id)
    if (res?.comments) setComments(res.comments)
  }

  const handleComment = async () => {
    if (!newComment.trim()) return
    const res = await api.addComment(item.id, newComment.trim())
    if (res?.id) {
      setComments([...comments, res])
      setNewComment('')
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{
          display: 'inline-block',
          width: '10px', height: '10px',
          borderRadius: '50%',
          background: planet?.color,
          boxShadow: `0 0 6px ${planet?.glowColor}`,
        }} />
        <span style={{ color: '#bbccee', fontSize: '13px', fontWeight: 500 }}>
          {isOwn ? '我' : item.authorName}
        </span>
        <span style={{ color: '#556677', fontSize: '12px' }}>
          写入{planet?.name}
        </span>
        <span style={{ marginLeft: 'auto', color: '#445566', fontSize: '11px' }}>
          {new Date(item.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* content */}
      {item.title && (
        <h4 style={{ color: '#ddeeff', fontSize: '15px', margin: '0 0 6px' }}>{item.title}</h4>
      )}
      <p style={{
        color: '#aabbcc',
        fontSize: '14px',
        lineHeight: 1.6,
        margin: 0,
        whiteSpace: 'pre-wrap',
        maxHeight: '200px',
        overflow: 'hidden',
      }}>
        {item.content}
      </p>
      {item.mood && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '8px',
          fontSize: '16px',
          color: planet?.guideColor,
          background: `${planet?.glowColor}15`,
          padding: '4px 12px',
          borderRadius: '16px',
          lineHeight: 1,
        }}>
          {item.mood}
        </span>
      )}

      {/* actions */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
        <button
          onClick={handleLike}
          style={{
            background: 'none',
            border: 'none',
            color: liked ? '#ff8866' : '#556677',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          {liked ? '❤' : '♡'} {likeCount}
        </button>
        <button
          onClick={() => {
            setShowComments(!showComments)
            if (!showComments) loadComments()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: showComments ? '#88aabb' : '#556677',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          💬 {item.commentCount}
        </button>
      </div>

      {/* comments */}
      {showComments && (
        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          {comments.map((c) => (
            <div key={c.id} style={{ marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ color: '#bbccee', fontWeight: 500 }}>
                {c.userId === currentUserId ? '我' : c.authorName}：
              </span>
              <span style={{ color: '#99aabb' }}>{c.content}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input
              type="text"
              placeholder="说点什么..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleComment}
              style={{
                background: '#4a90d9',
                border: 'none',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EarthView({
  onBack,
  onSelectPlanet,
}: {
  onBack: () => void
  onSelectPlanet: (planetId: string) => void
}) {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [user, setUser] = useState<{ id: number } | null>(null)
  const [friendEmail, setFriendEmail] = useState('')
  const [friends, setFriends] = useState<any[]>([])
  const [showFriends, setShowFriends] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'balance'>('feed')

  const loadData = useCallback(async () => {
    const [me, bal, fd] = await Promise.all([
      api.whoami(),
      api.getBalance(),
      api.getFeed(),
    ])
    if (me) setUser(me)
    if (bal) setBalance(bal)
    if (fd?.feed) setFeed(fd.feed)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) return
    const res = await api.addFriend(friendEmail.trim())
    if (res?.ok) {
      setFriendEmail('')
      const fr = await api.listFriends()
      if (fr?.friends) setFriends(fr.friends)
      loadData() // refresh feed
    }
  }

  const loadFriends = async () => {
    const res = await api.listFriends()
    if (res?.friends) setFriends(res.friends)
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#000010' }}>
      {/* 3D Earth - left */}
      <div style={{ flex: '1 1 40%', position: 'relative' }}>
        <Canvas camera={{ position: [0, 1, 7], fov: 45 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
          <color attach="background" args={['#000010']} />
          <ambientLight intensity={0.15} />
          <pointLight position={[5, 5, 5]} intensity={1.5} color="#87ceeb" />
          <EarthSphere />
          <OrbitControls enablePan={false} minDistance={4} maxDistance={12} autoRotate autoRotateSpeed={0.3} />
        </Canvas>

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

        <GuardianCharacter planetId="earth" elementName="中枢" state="社区" />

        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: '#fff',
        }}>
          <h2 style={{ margin: 0, fontSize: '44px', fontWeight: 400, letterSpacing: '4px', fontFamily: '"Ma Shan Zheng", cursive', textShadow: '0 0 16px rgba(100,150,255,0.4)' }}>地球</h2>
          <p style={{ fontSize: '13px', color: '#8899bb', marginTop: '4px' }}>
            五行流转的场域 · 社区中枢
          </p>
        </div>
      </div>

      {/* community panel - right */}
      <div style={{
        flex: '1 1 60%',
        padding: '24px',
        overflowY: 'auto',
        background: 'rgba(10,10,30,0.8)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('feed')}
            style={{
              background: activeTab === 'feed' ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: activeTab === 'feed' ? '#88aacc' : '#556677',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            动态
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            style={{
              background: activeTab === 'balance' ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: activeTab === 'balance' ? '#88aacc' : '#556677',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            五行
          </button>
          <button
            onClick={() => {
              setShowFriends(!showFriends)
              if (!showFriends) loadFriends()
            }}
            style={{
              background: showFriends ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: showFriends ? '#88aacc' : '#556677',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: 'auto',
            }}
          >
            好友
          </button>
        </div>

        {/* friends panel */}
        {showFriends && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="输入好友邮箱添加"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddFriend}
                style={{
                  background: '#4a90d9',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                添加
              </button>
            </div>
            {friends.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {friends.map((f) => (
                  <span key={f.id} style={{
                    background: 'rgba(255,255,255,0.06)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#aabbcc',
                  }}>
                    {f.username}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* feed tab */}
        {activeTab === 'feed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {feed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#556677' }}>
                <p style={{ fontSize: '32px' }}>🌌</p>
                <p>还没有动态</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  添加好友后，好友可见的日记会出现在这里
                </p>
              </div>
            ) : (
              feed.map((item) => (
                <FeedItemCard key={item.id} item={item} currentUserId={user?.id || 0} />
              ))
            )}
          </div>
        )}

        {/* balance tab */}
        {activeTab === 'balance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <BalanceChart balance={balance} />
            {/* planet quick links */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <h4 style={{ color: '#ccddee', fontSize: '14px', margin: '0 0 12px', fontWeight: 400 }}>
                前往行星
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {FIVE_PLANETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPlanet(p.id)}
                    style={{
                      background: `${p.color}30`,
                      border: `1px solid ${p.color}60`,
                      color: p.glowColor,
                      padding: '8px 16px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {p.name} · {p.state}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
