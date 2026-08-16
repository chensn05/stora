import { useState, useEffect } from 'react'
import SolarSystem from './components/SolarSystem'
import PlanetView from './components/PlanetView'
import EarthView from './components/EarthView'
import LoginPage from './auth/LoginPage'
import { api } from './api'

type View =
  | { type: 'solar' }
  | { type: 'planet'; planetId: string }
  | { type: 'earth' }

export default function App() {
  const [view, setView] = useState<View>({ type: 'solar' })
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('sb_token')
    if (!token) {
      setLoading(false)
      return
    }
    setAuthenticated(true)
    
    api.whoami().then((u) => {
      if (u) setUser(u)
      setLoading(false)
    }).catch(() => {
      localStorage.removeItem('sb_token')
      setAuthenticated(false)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000010', color: '#556677',
      }}>
        <p>正在连接星系...</p>
      </div>
    )
  }

  if (!authenticated) {
    return <LoginPage />
  }

  if (!user) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000010', color: '#556677',
      }}>
        <p>请先登录</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {view.type === 'solar' && (
        <SolarSystem onSelect={(planetId) => setView({ type: planetId === 'earth' ? 'earth' : 'planet', planetId })} />
      )}
      {view.type === 'planet' && (
        <PlanetView planetId={view.planetId} onBack={() => setView({ type: 'solar' })} />
      )}
      {view.type === 'earth' && (
        <EarthView
          onBack={() => setView({ type: 'solar' })}
          onSelectPlanet={(planetId) => setView({ type: 'planet', planetId })}
        />
      )}
    </div>
  )
}
