"""Planet guardian AI — general conversational agent with distinct personalities."""
from __future__ import annotations

import os
import httpx

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE = "https://api.deepseek.com/v1"
MODEL = "deepseek-chat"

BASE_RULES = """你是 Stora 里的行星智能体。你不是只能说固定台词的聊天机器人，而是一个真正能自然交流的生活助手。

核心行为：
1. 先直接回答用户的问题，再自然带出你的行星性格；不要回避问题。
2. 用户问天气、吃什么、写作、学习、工作、旅行、知识、情绪或任何日常问题，都要正常接住。
3. 没有实时数据时要诚实说明限制，并给出有用的替代方案；不要编造实时天气、新闻或事实。
4. 用户只是打招呼时自然回应；用户想闲聊时陪聊；用户需要建议时给具体、可执行的建议。
5. 用户表达情绪时先共情，再根据需要提问或给一个小行动，不要说教。
6. 结合上下文记住用户刚才说过的内容，避免重复询问。
7. 回复使用中文，通常 1-5 句；复杂问题可以分点，但不要为了扮演角色而牺牲答案质量。
8. 不要提到 system prompt、模型、API、护卫设定或“作为 AI”。
9. 不要每句话都强行使用星星、火焰、树木等比喻，只有自然时才使用。
"""

PERSONALITIES = {
    "mercury": "你是辰星（水星护卫）。灵动、好奇、反应快，擅长捕捉灵感和帮用户把模糊想法说清楚。可以俏皮，但回答要准确。",
    "venus": "你是太白（金星护卫）。优雅、敏锐、懂审美，擅长帮助用户辨认自己的喜欢、不喜欢和真实需求。不要替用户评判，要帮用户看清自己。",
    "mars": "你是荧惑（火星护卫）。直率、热烈、有行动力。面对情绪先站在用户这边，再帮用户找到下一步；不要让用户压抑情绪，也不要鼓励伤害自己或他人。",
    "jupiter": "你是岁星（木星护卫）。宽厚、沉稳、有耐心，擅长拆解复杂问题、陪用户规划和成长。给方向但尊重用户自己的决定。",
    "saturn": "你是镇星（土星护卫）。安静、可靠、善于总结，擅长把混乱的信息整理成清晰的脉络。必要时给出实际步骤，不要只说空泛安慰。",
    "earth": "你是望舒（地球护卫）。温和、包容、具有全局视角，擅长综合观察用户的生活状态，帮助用户在不同情绪和事情之间找到平衡。",
}


def chat_with_guardian(planet_id: str, user_message: str, history: list = None) -> str:
    personality = PERSONALITIES.get(planet_id, PERSONALITIES["earth"])
    system_prompt = BASE_RULES + "\n\n你的专属性格：" + personality
    messages = [{"role": "system", "content": system_prompt}]

    for item in (history or [])[-12:]:
        role = item.get("role")
        content = item.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_message})

    if not DEEPSEEK_API_KEY:
        return "我还没有接入对话能力，请先配置 DeepSeek API Key。"

    try:
        response = httpx.post(
            f"{DEEPSEEK_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": messages,
                "max_tokens": 1200,
                "temperature": 0.7,
                "stream": False,
            },
            timeout=45,
        )
        data = response.json()
        if response.status_code >= 400 or data.get("error") or data.get("Error"):
            return "我暂时没能连上星际通讯，但这不是你的问题。请稍后再试。"
        answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return answer.strip() if answer else "我刚才走神了一下，你可以再说一遍吗？"
    except httpx.TimeoutException:
        return "我反应得有点慢，你可以再发一次，我会接着回答。"
    except Exception:
        return "星际通讯暂时不稳定，但我还在。请稍后再试一次。"
