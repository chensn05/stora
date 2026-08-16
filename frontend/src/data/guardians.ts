import type { PlanetConfig } from '../types'

/** Guardian character image mapping */
export const GUARDIAN_IMAGES: Record<string, string> = {
  mercury: '/guardians/mercury.png',
  venus: '/guardians/venus.png',
  mars: '/guardians/mars.png',
  jupiter: '/guardians/jupiter.png',
  saturn: '/guardians/saturn.png',
  earth: '/guardians/mercury.png', // earth uses mercury as default
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
