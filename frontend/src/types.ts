export interface User {
  id: number
  ssoId: string
  email: string
  username: string
}

export interface Diary {
  id: number
  userId: number
  planet: string
  title: string
  content: string
  mood: string
  visibility: 'private' | 'friends' | 'public'
  createdAt: string
  updatedAt?: string
}

export interface FeedItem extends Diary {
  authorName: string
  likeCount: number
  commentCount: number
  liked: boolean
}

export interface Comment {
  id: number
  diaryId: number
  userId: number
  content: string
  createdAt: string
  authorName: string
}

export interface Balance {
  counts: Record<string, number>
  total: number
  dominant: string | null
  weak: string | null
  tip: string | null
  sheng: Record<string, string>
  ke: Record<string, string>
}

export interface Friend {
  id: number
  username: string
  email: string
}

export type PlanetId = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'earth'

export interface PlanetConfig {
  id: PlanetId
  name: string
  element: string
  elementName: string
  state: string
  stateDesc: string
  color: string
  glowColor: string
  size: number
  orbitRadius: number
  orbitSpeed: number
  rotationSpeed: number
  guideShape: 'droplet' | 'mirror' | 'seed' | 'flame' | 'pot' | 'moon'
  guideColor: string
  textureType: 'rocky' | 'gas' | 'ice' | 'earth' | 'ringed'
  hasRing?: boolean
}
