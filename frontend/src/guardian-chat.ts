/** Guardian chat — calls backend proxy (DeepSeek API) */

export async function chatWithGuardian(
  planet: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const r = await fetch('https://stora-production.up.railway.app/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('sb_token') || ''}`,
    },
    body: JSON.stringify({ planet, message: userMessage, history: history.slice(-10) }),
  })

  if (r.ok) {
    const data = await r.json()
    return data?.reply || '（护卫暂时沉默了）'
  }
  return '（星辰传讯受阻，请稍后再试）'
}
