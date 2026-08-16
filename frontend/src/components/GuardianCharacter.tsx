import { useState, useEffect, useRef, useCallback } from 'react'
import { GUARDIAN_IMAGES, GUARDIAN_NAMES, getRandomDialogue } from '../data/guardians'
import { chatWithGuardian } from '../guardian-chat'
import { guardianSize, chatPanelWidth, chatPanelHeight, isSmallMobile } from '../utils/responsive'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

/** Guardian character with AI chat capability. */
export function GuardianCharacter({
  planetId,
  elementName,
  state,
}: {
  planetId: string
  elementName: string
  state: string
}) {
  const [dialogue, setDialogue] = useState('')
  const [showBubble, setShowBubble] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const img = GUARDIAN_IMAGES[planetId]
  const name = GUARDIAN_NAMES[planetId]

  useEffect(() => {
    setDialogue(getRandomDialogue(planetId))
    const timer = setTimeout(() => setShowBubble(true), 500)
    return () => clearTimeout(timer)
  }, [planetId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const reply = await chatWithGuardian(
        planetId,
        userMsg,
        newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      )
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '（星辰传讯受阻，请稍后再试）' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, planetId])

  const handleOpenChat = () => {
    setChatOpen(true)
    setShowBubble(false)
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: dialogue }])
    }
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      left: 'auto',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '12px',
      zIndex: 10,
    }}>
      {/* Chat panel */}
      {chatOpen && (
        <div style={{
          width: chatPanelWidth(),
          height: chatPanelHeight(),
          background: 'rgba(15,15,35,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {/* header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 6px #4ade80',
              }} />
              <span style={{ color: '#ddeeff', fontSize: '14px', fontWeight: 500 }}>
                {name}
              </span>
              <span style={{ color: '#556677', fontSize: '11px' }}>
                「{elementName}」· {state}
              </span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#556677',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}>
                <div style={{
                  background: m.role === 'user'
                    ? 'rgba(74,144,217,0.3)'
                    : 'rgba(255,255,255,0.08)',
                  borderRadius: m.role === 'user'
                    ? '12px 12px 4px 12px'
                    : '12px 12px 12px 4px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: m.role === 'user' ? '#bbeeff' : '#ccddee',
                  lineHeight: 1.5,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px 12px 12px 4px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: '#8899bb',
                }}>
                  <span style={{ animation: 'dots 1.4s infinite' }}>···</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* input */}
          <div style={{
            padding: '10px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            gap: '8px',
          }}>
            <input
              type="text"
              placeholder={`和${name}聊聊...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
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
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? '#334455' : '#4a90d9',
                border: 'none',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              →
            </button>
          </div>

          <style>{`
            @keyframes dots {
              0%, 60%, 100% { opacity: 0.3; }
              30% { opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* speech bubble (when chat not open) */}
      {!chatOpen && showBubble && (
        <div
          onClick={handleOpenChat}
          style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '16px 16px 16px 4px',
            padding: '12px 18px',
            maxWidth: '260px',
            marginBottom: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            position: 'relative',
            cursor: 'pointer',
            animation: 'bubbleIn 0.3s ease-out',
          }}
        >
          <div style={{
            fontSize: '12px',
            color: '#8899bb',
            marginBottom: '4px',
            fontWeight: 500,
          }}>
            {name} · 「{elementName}」{state} · 点击对话
          </div>
          <div style={{
            fontSize: '14px',
            color: '#334455',
            lineHeight: 1.5,
          }}>
            {dialogue}
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '12px',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(255,255,255,0.95)',
          }} />
        </div>
      )}

      {/* character image */}
      <div
        onClick={() => chatOpen ? setChatOpen(false) : handleOpenChat()}
        style={{
          width: guardianSize(),
          height: guardianSize(),
          cursor: 'pointer',
          position: 'relative',
          animation: 'guardianFloat 3s ease-in-out infinite',
        }}
      >
        <img
          src={img}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
          }}
        />
      </div>

      <style>{`
        @keyframes guardianFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes bubbleIn {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
