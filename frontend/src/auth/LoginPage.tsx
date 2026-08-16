import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        if (data.user && !data.session) {
          setError('注册成功！请检查邮箱完成验证。')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        if (data.session) {
          localStorage.setItem('sb_token', data.session.access_token)
          window.location.href = '/'
        }
      }
    } catch (err: any) {
      setError(err.message || '认证失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0a0a20 0%, #000010 70%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Starfield background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(2px 2px at 20% 30%, white, transparent),
                         radial-gradient(2px 2px at 60% 70%, white, transparent),
                         radial-gradient(1px 1px at 50% 50%, white, transparent),
                         radial-gradient(1px 1px at 80% 10%, white, transparent),
                         radial-gradient(2px 2px at 90% 60%, white, transparent),
                         radial-gradient(1px 1px at 33% 80%, white, transparent),
                         radial-gradient(1px 1px at 15% 90%, white, transparent)`,
        backgroundSize: '200px 200px',
        opacity: 0.3,
      }} />

      {/* Login card */}
      <div style={{
        background: 'rgba(15, 15, 35, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        width: '400px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 1,
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: '32px',
          fontWeight: 300,
          letterSpacing: '8px',
          textAlign: 'center',
          marginBottom: '8px',
          textShadow: '0 0 30px rgba(100, 150, 255, 0.6)',
        }}>
          五行行星日记
        </h1>
        <p style={{
          color: '#8899bb',
          fontSize: '14px',
          textAlign: 'center',
          marginBottom: '32px',
          letterSpacing: '2px',
        }}>
          记录此刻的你
        </p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(100, 150, 255, 0.5)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(100, 150, 255, 0.5)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />

          {error && (
            <div style={{
              padding: '10px 14px',
              background: error.includes('成功') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${error.includes('成功') ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '8px',
              color: error.includes('成功') ? '#4ade80' : '#ef4444',
              fontSize: '13px',
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#334455' : 'linear-gradient(135deg, #4a90d9 0%, #6366f1 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: '8px',
            }}
          >
            {loading ? '处理中...' : isSignUp ? '注册' : '登录'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          color: '#8899bb',
          fontSize: '13px',
        }}>
          {isSignUp ? '已有账号？' : '还没有账号？'}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#4a90d9',
              cursor: 'pointer',
              fontSize: '13px',
              marginLeft: '4px',
              textDecoration: 'underline',
            }}
          >
            {isSignUp ? '去登录' : '去注册'}
          </button>
        </div>

        <div style={{
          marginTop: '32px',
          textAlign: 'center',
          color: '#556677',
          fontSize: '11px',
          lineHeight: 1.6,
        }}>
          <p>五行相生 · 金水木火土</p>
          <p>记录闪念 · 好恶 · 上头 · 生长 · 沉淀</p>
        </div>
      </div>
    </div>
  )
}
