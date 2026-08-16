import { useState, useRef, useEffect } from 'react'

/** Emoji categories matching the five elements + general moods */
const EMOJI_SETS: Record<string, { emoji: string; label: string }[]> = {
  闪念: [
    { emoji: '💡', label: '灵感' },
    { emoji: '✨', label: '闪光' },
    { emoji: '🌙', label: '夜思' },
    { emoji: '⚡', label: '电光' },
    { emoji: '🌊', label: '流动' },
    { emoji: '🫧', label: '气泡' },
  ],
  好恶: [
    { emoji: '😍', label: '心动' },
    { emoji: '🥰', label: '喜欢' },
    { emoji: '😤', label: '讨厌' },
    { emoji: '🙄', label: '无感' },
    { emoji: '🪞', label: '审视' },
    { emoji: '💎', label: '珍贵' },
  ],
  上头: [
    { emoji: '🔥', label: '燃烧' },
    { emoji: '😡', label: '愤怒' },
    { emoji: '🤬', label: '暴怒' },
    { emoji: '😭', label: '崩溃' },
    { emoji: '🤯', label: '爆炸' },
    { emoji: '🥳', label: '狂喜' },
    { emoji: '💪', label: '热血' },
    { emoji: '😤', label: '不服' },
  ],
  生长: [
    { emoji: '🌱', label: '萌芽' },
    { emoji: '🌿', label: '生长' },
    { emoji: '🌳', label: '茁壮' },
    { emoji: '🪴', label: '养护' },
    { emoji: '📌', label: '计划' },
    { emoji: '🎯', label: '目标' },
    { emoji: '🧩', label: '拼图' },
    { emoji: '💭', label: '构想' },
  ],
  沉淀: [
    { emoji: '🍂', label: '落定' },
    { emoji: '🫖', label: '慢饮' },
    { emoji: '📖', label: '回看' },
    { emoji: '🧘', label: '平静' },
    { emoji: '🔮', label: '顿悟' },
    { emoji: '⚖️', label: '平衡' },
  ],
  通用: [
    { emoji: '🙂', label: '还好' },
    { emoji: '😊', label: '开心' },
    { emoji: '😴', label: '疲惫' },
    { emoji: '🥺', label: '委屈' },
    { emoji: '😰', label: '焦虑' },
    { emoji: '🫠', label: '融化' },
    { emoji: '😎', label: '潇洒' },
    { emoji: '🤔', label: '思考' },
    { emoji: '😶', label: '无话' },
    { emoji: '🥹', label: '感动' },
    { emoji: '😬', label: '尴尬' },
    { emoji: '👻', label: '摸鱼' },
  ],
}

interface EmojiPickerProps {
  planetState: string
  value: string
  onChange: (value: string) => void
}

export function EmojiPicker({ planetState, value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>(planetState || '通用')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveCategory(planetState || '通用')
  }, [planetState])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const categories = Object.keys(EMOJI_SETS)
  const currentEmojis = EMOJI_SETS[activeCategory] || EMOJI_SETS['通用']

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Display selected emoji or placeholder */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0,0,0,0.3)',
          border: value
            ? '1px solid rgba(255,255,255,0.2)'
            : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: value ? '#fff' : '#445566',
          fontSize: '13px',
          cursor: 'pointer',
          minWidth: '100px',
          minHeight: '36px',
        }}
      >
        {value ? (
          <>
            <span style={{ fontSize: '18px' }}>{value.split(' ')[0]}</span>
            <span style={{ fontSize: '12px', color: '#aabbcc' }}>
              {value.split(' ').slice(1).join(' ') || ''}
            </span>
          </>
        ) : (
          '😊 心情'
        )}
      </button>

      {/* Emoji picker panel */}
      {open && (
        <div style={{
          position: 'absolute',
          bottom: '42px',
          left: '0',
          width: '280px',
          background: 'rgba(20,20,40,0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {/* Category tabs */}
          <div style={{
            display: 'flex',
            gap: '0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            overflowX: 'auto',
          }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  flex: '0 0 auto',
                  background: activeCategory === cat
                    ? 'rgba(74,144,217,0.2)'
                    : 'none',
                  border: 'none',
                  borderBottom: activeCategory === cat
                    ? '2px solid #4a90d9'
                    : '2px solid transparent',
                  color: activeCategory === cat ? '#fff' : '#667788',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            padding: '10px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            {currentEmojis.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(`${item.emoji} ${item.label}`)
                  setOpen(false)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  background: value === `${item.emoji} ${item.label}`
                    ? 'rgba(74,144,217,0.3)'
                    : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '6px 4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(74,144,217,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = value === `${item.emoji} ${item.label}`
                    ? 'rgba(74,144,217,0.3)'
                    : 'rgba(255,255,255,0.04)'
                }}
              >
                <span style={{ fontSize: '22px' }}>{item.emoji}</span>
                <span style={{ fontSize: '10px', color: '#8899bb' }}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Clear button */}
          {value && (
            <div style={{
              padding: '6px 10px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667788',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                清除标签
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
