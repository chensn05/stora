import { FIVE_PLANETS } from '../data/planets'
import type { Balance } from '../types'

/** Five elements sheng-cycle diagram: 水生木→木生火→火生土→土生金→金生水 */
const CYCLE_ORDER = ['mercury', 'jupiter', 'mars', 'saturn', 'venus'] as const

export function FiveElementsCycle({ balance }: { balance: Balance | null }) {
  if (!balance) return null
  const counts = balance.counts || {}
  const maxCount = Math.max(...Object.values(counts), 1)

  const W = 300
  const H = 300
  const cx = W / 2
  const cy = H / 2
  const R = 108

  const nodes = CYCLE_ORDER.map((id, i) => {
    const angle = -Math.PI / 2 + (i / CYCLE_ORDER.length) * Math.PI * 2
    const planet = FIVE_PLANETS.find(p => p.id === id)!
    const count = counts[id] || 0
    const size = 14 + (count / maxCount) * 16
    return {
      id,
      planet,
      count,
      size,
      x: cx + Math.cos(angle) * R,
      y: cy + Math.sin(angle) * R,
      angle,
    }
  })

  // sheng arrows between consecutive nodes in cycle order
  const arrows = nodes.map((n, i) => {
    const next = nodes[(i + 1) % nodes.length]
    return { from: n, to: next }
  })

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
      textAlign: 'center',
    }}>
      <h4 style={{ color: '#ccddee', fontSize: '14px', margin: '0 0 8px', fontWeight: 400, letterSpacing: '2px' }}>
        五行流转 · 近30天
      </h4>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(150,180,230,0.5)" />
          </marker>
        </defs>

        {/* sheng cycle arrows (curved) */}
        {arrows.map((a, i) => {
          const { from, to } = a
          const mx = (from.x + to.x) / 2
          const my = (from.y + to.y) / 2
          const dx = mx - cx
          const dy = my - cy
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const ox = mx + (dx / len) * 24
          const oy = my + (dy / len) * 24
          return (
            <path
              key={i}
              d={`M ${from.x} ${from.y} Q ${ox} ${oy} ${to.x} ${to.y}`}
              fill="none"
              stroke="rgba(150,180,230,0.35)"
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
          )
        })}

        {/* nodes */}
        {nodes.map((n) => {
          const isDominant = balance.dominant === n.id
          return (
            <g key={n.id}>
              {isDominant && (
                <circle cx={n.x} cy={n.y} r={n.size + 8} fill="none" stroke={n.planet.glowColor} strokeWidth="1" opacity={0.5}>
                  <animate attributeName="r" values={`${n.size + 6};${n.size + 12};${n.size + 6}`} dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={n.size}
                fill={n.planet.color}
                opacity={n.count === 0 ? 0.35 : 0.95}
                stroke={n.planet.glowColor}
                strokeWidth={isDominant ? 2 : 1}
              />
              <text
                x={n.x}
                y={n.y + n.size + 14}
                textAnchor="middle"
                fill="#bbccee"
                fontSize="12"
                fontFamily="system-ui"
              >
                {n.planet.name} {n.planet.elementName}
              </text>
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
                fontFamily="system-ui"
              >
                {n.count}
              </text>
            </g>
          )
        })}
      </svg>

      {balance.tip && (
        <div style={{
          marginTop: '10px',
          padding: '10px 12px',
          background: 'rgba(255,200,100,0.08)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#ddcc88',
          lineHeight: 1.5,
          textAlign: 'left',
        }}>
          💡 {balance.tip}
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '11px', color: '#556677' }}>
        圆点越大 = 该行星日记越多 · 箭头为五行相生
      </div>
    </div>
  )
}
