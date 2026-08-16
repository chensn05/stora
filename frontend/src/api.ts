const getToken = () => localStorage.getItem('sb_token') || ''

const apiFetch = async (path: string, init?: RequestInit) => {
  const r = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...init?.headers,
    },
  })
  if (r.status === 401) {
    window.location.href = '/login'
    return null
  }
  return r.json()
}

export const api = {
  whoami: () => apiFetch('/whoami'),

  listDiaries: (planet?: string) =>
    apiFetch(`/diaries${planet ? `?planet=${planet}` : ''}`),

  createDiary: (data: {
    planet: string
    title: string
    content: string
    mood: string
    visibility: string
  }) => apiFetch('/diaries', { method: 'POST', body: JSON.stringify(data) }),

  deleteDiary: (id: number) =>
    apiFetch(`/diaries/${id}`, { method: 'DELETE' }),

  getBalance: () => apiFetch('/balance'),

  listFriends: () => apiFetch('/friends'),

  addFriend: (email: string) =>
    apiFetch(`/friends/${encodeURIComponent(email)}`, { method: 'POST' }),

  getFeed: () => apiFetch('/feed'),

  toggleLike: (diaryId: number) =>
    apiFetch(`/diaries/${diaryId}/like`, { method: 'POST' }),

  listComments: (diaryId: number) =>
    apiFetch(`/diaries/${diaryId}/comments`),

  addComment: (diaryId: number, content: string) =>
    apiFetch(`/diaries/${diaryId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  chat: (planet: string, message: string, history: any[] = []) =>
    apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ planet, message, history }),
    }),
}
