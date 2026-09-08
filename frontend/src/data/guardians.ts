/** Guardian character image mapping */
export const GUARDIAN_IMAGES: Record<string, string> = {
  mercury: '/guardians/mercury.png',
  venus: '/guardians/venus.png',
  mars: '/guardians/mars.png',
  jupiter: '/guardians/jupiter.png',
  saturn: '/guardians/saturn.png',
  earth: '/guardians/mercury.png',
}

export const GUARDIAN_NAMES: Record<string, string> = {
  mercury: '辰星',
  venus: '太白',
  mars: '荧惑',
  jupiter: '岁星',
  saturn: '镇星',
  earth: '望舒',
}

/** Guardian dialogues shown in speech bubble */
export const GUARDIAN_DIALOGUES: Record<string, string[]> = {
  mercury: [
    '又有什么新点子冒出来了？',
    '记下来就走，别想太多。',
    '灵光一闪，抓不住就没了。',
  ],
  venus: [
    '说说看，你今天喜欢什么？',
    '不喜欢也没关系，认识自己最重要。',
    '你的好恶，就是你的轮廓。',
  ],
  mars: [
    '来了？先写下来再说。',
    '不用组织语言，发泄出来就好。',
    '火气消了再回头看，你会笑自己的。',
  ],
  jupiter: [
    '又在琢磨什么了？',
    '慢慢长，不着急。',
    '种子种下去，总会发芽的。',
  ],
  saturn: [
    '回头看看，收获比你以为的多。',
    '把散落的拼起来，就是答案。',
    '沉淀不是结束，是下一轮开始。',
  ],
  earth: [
    '欢迎回来，看看朋友们的近况吧。',
    '五行流转，你在哪颗星停留最久？',
    '这里是你的宇宙中心。',
  ],
}

export function getRandomDialogue(planetId: string): string {
  const dialogues = GUARDIAN_DIALOGUES[planetId] || GUARDIAN_DIALOGUES['earth']
  return dialogues[Math.floor(Math.random() * dialogues.length)]
}

/** Data-driven greeting based on user's diary stats */
export function getDataGreeting(
  planetId: string,
  counts: Record<string, number> | null,
  total: number
): string {
  const name = GUARDIAN_NAMES[planetId] || '护卫'

  if (!counts || total === 0) {
    const emptyMap: Record<string, string> = {
      mercury: '今天还没有闪念落下来。随时说一句，我帮你接住。',
      venus: '今天还没记录好恶。喜欢或讨厌的，都可以先说一句。',
      mars: '今天风平浪静。有点情绪也没关系，我接得住。',
      jupiter: '今天还没种下新东西。想聊什么想法都可以。',
      saturn: '今天还没有沉淀。等你想回头看看时，我在这儿。',
      earth: '你的宇宙还很安静。去任意一颗星球写下第一篇吧。',
    }
    return emptyMap[planetId] || emptyMap['earth']
  }

  const myCount = counts[planetId] || 0
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const [topPlanet, topCount] = entries[0]

  if (planetId === topPlanet && myCount > 0) {
    const map: Record<string, string> = {
      mercury: `最近 ${myCount} 条闪念都落在我这儿，灵感不少啊。`,
      venus: `最近 ${myCount} 条好恶记在我这儿，你越来越知道自己要什么了。`,
      mars: `最近 ${myCount} 条情绪都烧到我这儿了。写下来，比憋着强。`,
      jupiter: `最近 ${myCount} 条想法在我这儿生长，继续浇水。`,
      saturn: `最近 ${myCount} 条沉淀在我这儿，你越来越会回头看了。`,
    }
    return map[planetId] || `这周你在我这儿写了 ${myCount} 篇。`
  }

  if (myCount === 0 && planetId !== 'earth') {
    const topName = GUARDIAN_NAMES[topPlanet]
    const map: Record<string, string> = {
      mercury: `最近你的记录大多在${topName}那边，我这儿还没响动。有闪过的念头吗？`,
      venus: `最近你多在${topName}那里停留。要不要也来理一理自己的好恶？`,
      mars: `最近你的情绪都写在${topName}那边。这里没有输赢，想说就说。`,
      jupiter: `最近你在${topName}那儿花了不少时间。有正在酝酿的东西吗？`,
      saturn: `最近你的记录多在${topName}那儿。回头整理一下也不错。`,
    }
    return map[planetId] || `最近你多在${topName}那边，也来我这儿坐坐？`
  }

  if (planetId === 'earth') {
    return `最近你一共写了 ${total} 篇，${GUARDIAN_NAMES[topPlanet]}那边最热闹。`
  }

  const map: Record<string, string> = {
    mercury: `你在我这儿留下了 ${myCount} 条闪念，每一条都算数。`,
    venus: `你在我这儿记了 ${myCount} 条好恶，轮廓越来越清楚了。`,
    mars: `你在我这儿写了 ${myCount} 篇，火星表面的生命都长出来了。`,
    jupiter: `你在我这儿种了 ${myCount} 颗种子，都在慢慢长。`,
    saturn: `你在我这儿沉淀了 ${myCount} 篇，都是回头看的底气。`,
  }
  return map[planetId] || `我在。最近写了 ${total} 篇了。`
}
