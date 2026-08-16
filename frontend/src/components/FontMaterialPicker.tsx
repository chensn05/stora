import { useState, useRef } from 'react'

interface MaterialOption {
  id: string
  name: string
  icon: string
  color: string
  preview: string
}

const MATERIALS: MaterialOption[] = [
  { id: 'acrylic_metal', name: '亚克力流体金属', icon: '🌊', color: '#c0c0d0', preview: '/font-materials/acrylic_metal.png' },
  { id: 'foam', name: '泡沫', icon: '🫧', color: '#ffb3d9', preview: '/font-materials/foam.png' },
  { id: 'orange_peel', name: '橘子皮', icon: '🍊', color: '#ff8c42', preview: '/font-materials/orange_peel.png' },
  { id: 'sequin_embroidery', name: '闪片刺绣', icon: '✨', color: '#ffd700', preview: '/font-materials/sequin_embroidery.png' },
  { id: 'inflated_metal', name: '膨胀金属', icon: '🎈', color: '#a0a0b0', preview: '/font-materials/inflated_metal.png' },
  { id: 'grass', name: '草皮', icon: '🌱', color: '#4caf50', preview: '/font-materials/grass.png' },
  { id: 'buttercream', name: '奶油曲奇', icon: '🧁', color: '#fff5e6', preview: '/font-materials/buttercream.png' },
  { id: 'punch_needle', name: '毛线戳戳绣', icon: '🧶', color: '#e6a0b0', preview: '/font-materials/punch_needle.png' },
  { id: 'rock', name: '岩石', icon: '🪨', color: '#8a8a7a', preview: '/font-materials/rock.png' },
  { id: 'ice_crystal', name: '冰晶', icon: '🧊', color: '#80d0ff', preview: '/font-materials/ice_crystal.png' },
]

const PROMPT_TEMPLATES: Record<string, string> = {
  acrylic_metal: "3D typography of '{text}', acrylic fluid metal texture, liquid chrome flowing effect, glossy reflective surface, dark background, studio lighting, high detail",
  foam: "3D typography of '{text}', soft foam bubble texture, pastel pink and blue colors, airy lightweight, white background, soft lighting",
  orange_peel: "3D typography of '{text}', orange peel texture, organic dimpled surface, citrus orange color, bright background",
  sequin_embroidery: "3D typography of '{text}', sequin embroidery on dark fabric, sparkling silver and gold threads, glittering, textile background",
  inflated_metal: "3D typography of '{text}', inflated metal balloon, puffy 3D chrome, shiny balloon-like, dark background",
  grass: "3D typography of '{text}', grass text topiary, green lawn letters, garden texture, outdoor lighting",
  buttercream: "3D typography of '{text}', buttercream piping on cookie, frosting texture, creamy pastel, food photography",
  punch_needle: "3D typography of '{text}', punch needle embroidery, wool yarn text on cloth, textured craft, warm colors",
  rock: "3D typography of '{text}', carved stone text, rough rock texture, granite, natural lighting",
  ice_crystal: "3D typography of '{text}', ice crystal text, frozen translucent, icy glow, blue cold tones, dark background",
}

interface FontMaterialPickerProps {
  onGenerated: (imageUrl: string) => void
  onClose: () => void
}

export function FontMaterialPicker({ onGenerated, onClose }: FontMaterialPickerProps) {
  const [text, setText] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGenerate = async () => {
    if (!text.trim() || !selectedMaterial) return
    if (text.length > 8) {
      setError('建议不超过 8 个字')
      return
    }
    setGenerating(true)
    setError('')
    setResultUrl('')

    try {
      const prompt = PROMPT_TEMPLATES[selectedMaterial].replace('{text}', text.trim())
      setError('材质字体生成功能需要配置图像生成 API，暂未在开源版中启用')
      setGenerating(false)
      return
    } catch (err: any) {
      setError(`生成失败：${err?.message?.slice(0, 40) || '未知错误'}`)
      setGenerating(false)
    }
  }

  const handleUse = () => {
    if (resultUrl) {
      onGenerated(resultUrl)
      onClose()
    }
  }

  const handleDownload = () => {
    if (resultUrl) {
      const a = document.createElement('a')
      a.href = resultUrl
      a.download = `${text}_${selectedMaterial}.png`
      a.click()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,5,0.9)',
      backdropFilter: 'blur(20px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'rgba(15,15,35,0.95)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '28px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 400,
            margin: 0,
            fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
            letterSpacing: '4px',
          }}>
            字体材质生成器
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: '#556677',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '0',
          }}>×</button>
        </div>

        {/* Text input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#8899bb', fontSize: '12px', marginBottom: '6px' }}>
            输入文字（建议 1-8 个字）
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="如：Stora"
            maxLength={8}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#fff',
              fontSize: '16px',
              outline: 'none',
            }}
          />
        </div>

        {/* Material picker */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#8899bb', fontSize: '12px', marginBottom: '10px' }}>
            选择材质（点击查看示范）
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
          }}>
            {MATERIALS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMaterial(m.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 4px',
                  background: selectedMaterial === m.id
                    ? `${m.color}30`
                    : 'rgba(255,255,255,0.04)',
                  border: selectedMaterial === m.id
                    ? `1px solid ${m.color}80`
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <img
                  src={m.preview}
                  alt={m.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    opacity: selectedMaterial === m.id ? 1 : 0.6,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span style={{ fontSize: '10px', color: selectedMaterial === m.id ? '#fff' : '#667788' }}>
                  {m.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!text.trim() || !selectedMaterial || generating}
          style={{
            width: '100%',
            background: text.trim() && selectedMaterial && !generating ? '#4a90d9' : '#334455',
            border: 'none',
            color: '#fff',
            padding: '12px',
            borderRadius: '10px',
            cursor: text.trim() && selectedMaterial && !generating ? 'pointer' : 'not-allowed',
            fontSize: '15px',
            marginBottom: '16px',
          }}
        >
          {generating ? '正在生成...' : '生成材质字体'}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            color: '#ff6677',
            fontSize: '13px',
            textAlign: 'center',
            marginBottom: '12px',
          }}>
            {error}
          </div>
        )}

        {/* Result */}
        {resultUrl && (
          <div style={{
            textAlign: 'center',
          }}>
            <img
              src={resultUrl}
              alt="生成结果"
              style={{
                maxWidth: '100%',
                borderRadius: '12px',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleDownload}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                下载图片
              </button>
              <button
                onClick={handleUse}
                style={{
                  background: '#4a90d9',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                设为标题
              </button>
            </div>
          </div>
        )}

        {/* Preview hint */}
        {!resultUrl && !generating && (
          <div style={{
            textAlign: 'center',
            color: '#445566',
            fontSize: '12px',
            padding: '20px',
          }}>
            选择材质后点击生成，AI 将为你的文字赋予材质效果
          </div>
        )}
      </div>
    </div>
  )
}
