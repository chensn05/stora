import { useState } from 'react'
import { EmojiPicker } from './EmojiPicker'

export function DiaryEditor({
  onSave,
  planetName,
  planetState,
}: {
  onSave: (data: { title: string; content: string; mood: string; visibility: string }) => void
  planetName: string
  planetState?: string
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [visibility, setVisibility] = useState('private')

  const handleSubmit = () => {
    if (!content.trim()) return
    onSave({ title: title.trim(), content: content.trim(), mood: mood.trim(), visibility })
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
    }}>
      <input
        type="text"
        placeholder={`给这颗${planetName}的日记起个标题（可选）`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px 12px',
          color: '#fff',
          fontSize: '14px',
          marginBottom: '10px',
          outline: 'none',
        }}
      />
      <textarea
        placeholder="写下此刻的你..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px 12px',
          color: '#fff',
          fontSize: '14px',
          resize: 'vertical',
          outline: 'none',
          lineHeight: 1.6,
        }}
      />
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <EmojiPicker
          planetState={planetState || '通用'}
          value={mood}
          onChange={setMood}
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
        >
          <option value="private">私密</option>
          <option value="friends">好友可见</option>
          <option value="public">公开</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          style={{
            background: content.trim() ? '#4a90d9' : '#334455',
            border: 'none',
            color: '#fff',
            padding: '8px 24px',
            borderRadius: '8px',
            cursor: content.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            marginLeft: 'auto',
          }}
        >
          存入星球
        </button>
      </div>
    </div>
  )
}
