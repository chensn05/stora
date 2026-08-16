import * as THREE from 'three'

/** Generate a procedural planet texture using Canvas2D. */
export function generatePlanetTexture(config: {
  baseColor: string
  glowColor: string
  type: 'rocky' | 'gas' | 'ice' | 'earth' | 'ringed'
  seed?: number
}): THREE.CanvasTexture {
  const { baseColor, glowColor, type, seed = 42 } = config
  const W = 1024
  const H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Seeded random
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  // Base color fill
  const baseGrad = ctx.createLinearGradient(0, 0, 0, H)
  switch (type) {
    case 'rocky':
      baseGrad.addColorStop(0, darken(baseColor, 0.6))
      baseGrad.addColorStop(0.3, baseColor)
      baseGrad.addColorStop(0.5, lighten(baseColor, 0.1))
      baseGrad.addColorStop(0.7, baseColor)
      baseGrad.addColorStop(1, darken(baseColor, 0.5))
      break
    case 'gas':
      // Horizontal bands for gas giants
      for (let i = 0; i < H; i += 2) {
        const t = i / H
        const wave = Math.sin(t * Math.PI * 8) * 0.5 + 0.5
        const c = mixColors(baseColor, glowColor, wave * 0.3 + 0.1)
        ctx.fillStyle = c
        ctx.fillRect(0, i, W, 2)
      }
      // Add turbulent band edges
      for (let band = 0; band < 12; band++) {
        const y = (band / 12) * H + rand() * 20
        const h = 10 + rand() * 30
        ctx.fillStyle = band % 2 === 0 ? darken(baseColor, 0.2) : lighten(baseColor, 0.15)
        for (let x = 0; x < W; x += 5) {
          const offset = Math.sin(x * 0.02 + band) * 8 + Math.sin(x * 0.05) * 4
          ctx.fillRect(x, y + offset, 5, h)
        }
      }
      break
    case 'ice':
      baseGrad.addColorStop(0, lighten(baseColor, 0.3))
      baseGrad.addColorStop(0.5, baseColor)
      baseGrad.addColorStop(1, darken(baseColor, 0.3))
      break
    case 'earth':
      baseGrad.addColorStop(0, '#1a3a5a')
      baseGrad.addColorStop(0.2, '#2a5a8a')
      baseGrad.addColorStop(0.4, '#3a7aaa')
      baseGrad.addColorStop(0.5, '#4a9ada')
      baseGrad.addColorStop(0.6, '#3a7aaa')
      baseGrad.addColorStop(0.8, '#2a5a8a')
      baseGrad.addColorStop(1, '#1a3a5a')
      break
    case 'ringed':
      baseGrad.addColorStop(0, darken(baseColor, 0.4))
      baseGrad.addColorStop(0.5, baseColor)
      baseGrad.addColorStop(1, darken(baseColor, 0.4))
      break
  }

  if (type !== 'gas') {
    ctx.fillStyle = baseGrad
    ctx.fillRect(0, 0, W, H)
  }

  // Add surface features based on type
  if (type === 'rocky') {
    // Craters
    for (let i = 0; i < 200; i++) {
      const x = rand() * W
      const y = rand() * H
      const r = 2 + rand() * 25
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, darken(baseColor, 0.5))
      grad.addColorStop(0.5, darken(baseColor, 0.2))
      grad.addColorStop(0.8, lighten(baseColor, 0.05))
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // Surface noise
    for (let i = 0; i < 5000; i++) {
      const x = rand() * W
      const y = rand() * H
      const alpha = rand() * 0.15
      ctx.fillStyle = rand() > 0.5
        ? `rgba(255,255,255,${alpha})`
        : `rgba(0,0,0,${alpha})`
      ctx.fillRect(x, y, 1, 1)
    }
  } else if (type === 'gas') {
    // Storm spots (like Great Red Spot)
    for (let i = 0; i < 5; i++) {
      const x = rand() * W
      const y = H * 0.3 + rand() * H * 0.4
      const rx = 30 + rand() * 60
      const ry = 15 + rand() * 30
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rx)
      grad.addColorStop(0, glowColor)
      grad.addColorStop(0.4, mixColors(glowColor, baseColor, 0.5))
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    // Turbulence
    for (let i = 0; i < 3000; i++) {
      const x = rand() * W
      const y = rand() * H
      const alpha = rand() * 0.08
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.fillRect(x, y, 1, 1)
    }
  } else if (type === 'ice') {
    // Ice cracks
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.1 + rand() * 0.2})`
      ctx.lineWidth = 1 + rand() * 2
      ctx.beginPath()
      const x1 = rand() * W
      const y1 = rand() * H
      ctx.moveTo(x1, y1)
      for (let j = 0; j < 5; j++) {
        ctx.lineTo(x1 + (rand() - 0.5) * 100, y1 + (rand() - 0.5) * 100)
      }
      ctx.stroke()
    }
    // Frost patches
    for (let i = 0; i < 50; i++) {
      const x = rand() * W
      const y = rand() * H
      const r = 10 + rand() * 40
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, `rgba(255,255,255,${0.1 + rand() * 0.15})`)
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'earth') {
    // Continents
    for (let i = 0; i < 8; i++) {
      const cx = rand() * W
      const cy = H * 0.3 + rand() * H * 0.4
      ctx.fillStyle = i % 2 === 0 ? '#2d6a3e' : '#3a7a4e'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      for (let j = 0; j < 12; j++) {
        const angle = (j / 12) * Math.PI * 2
        const r = 30 + rand() * 80
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.6)
      }
      ctx.closePath()
      ctx.fill()
    }
    // Clouds
    for (let i = 0; i < 30; i++) {
      const x = rand() * W
      const y = rand() * H
      const r = 15 + rand() * 40
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, 'rgba(255,255,255,0.4)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (type === 'ringed') {
    // Subtle bands
    for (let i = 0; i < 8; i++) {
      const y = (i / 8) * H
      ctx.fillStyle = i % 2 === 0
        ? `rgba(255,255,255,0.05)`
        : `rgba(0,0,0,0.08)`
      ctx.fillRect(0, y, W, H / 8)
    }
    // Storm spots
    for (let i = 0; i < 3; i++) {
      const x = rand() * W
      const y = H * 0.4 + rand() * H * 0.2
      const rx = 20 + rand() * 40
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rx)
      grad.addColorStop(0, glowColor)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(x, y, rx, rx * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Polar caps for rocky/earth
  if (type === 'rocky' || type === 'earth') {
    const capGrad = ctx.createLinearGradient(0, 0, 0, H * 0.15)
    capGrad.addColorStop(0, 'rgba(255,255,255,0.6)')
    capGrad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = capGrad
    ctx.fillRect(0, 0, W, H * 0.15)

    const capGrad2 = ctx.createLinearGradient(0, H * 0.85, 0, H)
    capGrad2.addColorStop(0, 'rgba(255,255,255,0)')
    capGrad2.addColorStop(1, 'rgba(255,255,255,0.6)')
    ctx.fillStyle = capGrad2
    ctx.fillRect(0, H * 0.85, W, H * 0.15)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/** Generate a ring texture for Saturn-like planets. */
export function generateRingTexture(baseColor: string, glowColor: string): THREE.CanvasTexture {
  const W = 512
  const H = 64
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  let s = 99
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  for (let x = 0; x < W; x++) {
    const t = x / W
    // Ring gaps
    let alpha = 0.6
    if (t < 0.1 || t > 0.95) alpha = 0
    // Cassini division
    if (t > 0.5 && t < 0.55) alpha *= 0.2
    // Random gaps
    for (let g = 0; g < 8; g++) {
      if (t > g * 0.12 + 0.05 && t < g * 0.12 + 0.07) alpha *= 0.3
    }

    const c = mixColors(baseColor, glowColor, rand() * 0.4)
    ctx.fillStyle = applyAlpha(c, alpha * (0.7 + rand() * 0.3))
    ctx.fillRect(x, 0, 1, H)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Generate a starfield background texture. */
export function generateStarField(): THREE.CanvasTexture {
  const W = 2048
  const H = 1024
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Deep space gradient
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2)
  bgGrad.addColorStop(0, '#0a0a20')
  bgGrad.addColorStop(0.5, '#050510')
  bgGrad.addColorStop(1, '#000005')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // Nebula clouds
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = 200 + Math.random() * 400
    const colors = ['#1a0a3a', '#0a1a3a', '#3a0a2a', '#0a2a3a']
    const color = colors[i % colors.length]
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, color + '60')
    grad.addColorStop(0.5, color + '20')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Stars
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const size = Math.random()
    let brightness = 0.3 + Math.random() * 0.7

    if (size > 0.98) {
      // Bright star with glow
      const r = 2 + Math.random() * 3
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 4)
      grad.addColorStop(0, `rgba(255,255,255,${brightness})`)
      grad.addColorStop(0.2, `rgba(200,220,255,${brightness * 0.5})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r * 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255,255,255,${brightness})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = `rgba(255,255,255,${brightness * 0.6})`
      ctx.fillRect(x, y, size > 0.5 ? 2 : 1, size > 0.5 ? 2 : 1)
    }
  }

  // A few colored stars
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const colors = ['#ffcc88', '#88ccff', '#ffaabb', '#aaffcc']
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(x, y, 2, 2)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.mapping = THREE.EquirectangularReflectionMapping
  return tex
}

// --- Color utilities ---
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

function mixColors(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

function applyAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}
