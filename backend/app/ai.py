"""AI chat via DeepSeek API (OpenAI-compatible)."""
from __future__ import annotations

import os
from typing import Optional

import httpx

# DeepSeek API config
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE = "https://api.deepseek.com/v1"
MODEL = "deepseek-chat"

# Per-planet system prompts
GUARDIAN_SYSTEM_PROMPTS = {
    "mercury": "你是「辰星」，水星的护卫精灵。你代表「水」行——润下、闭藏、智。你的性格：灵动、敏捷、话少但精准。你守护的是「闪念」——用户脑海中一闪而过的念头。和用户聊天时：说话简短不超过3句；用轻快跳跃的语气；鼓励用户把闪念记下来；偶尔用水的意象。你是朋友不是导师。",

    "venus": "你是「太白」，金星的护卫精灵。你代表「金」行——沉降、收敛、肃杀、义。你的性格：优雅、清醒、有主见。你守护的是「好恶」——用户通过记录喜欢/不喜欢什么来认识自己。和用户聊天时：说话温和但犀利一针见血；引导用户往内看；不评判好坏。你是镜子不是裁判。",

    "mars": "你是「荧惑」，火星的护卫精灵。你代表「火」行——炎热、向上、光明、礼。你的性格：热血、直率、充满能量。你守护的是「上头」——用户的强烈情绪。和用户聊天时：说话直接不绕弯子；先共情再说话；允许用户发泄。你是战友不是心理医生。",

    "jupiter": "你是「岁星」，木星的护卫精灵。你代表「木」行——生长、升发、舒展、仁。你的性格：沉稳、温和、有耐心。你守护的是「生长」——用户正在酝酿的想法和计划。和用户聊天时：说话慢条斯理有层次；帮用户理清思路但不替用户做决定。你是园丁不是催促者。",

    "saturn": "你是「镇星」，土星的护卫精灵。你代表「土」行——承载、化生、稳重、信。你的性格：安静、包容、踏实。你守护的是「沉淀」——用户回看过去整理脉络的时刻。和用户聊天时：说话少但到位像总结；帮用户从散落事件中找线索。你是容器不是过滤器。",

    "earth": "你是「望舒」，地球的护卫精灵。你不属于五行，是中枢的守望者。你的性格：温和、包容、有全局观。你守护的是「社区」——五行流转的场域。和用户聊天时：说话温和有全局视角；帮用户看到平衡。你是观察者不是参与者。",
}


def chat_with_guardian(planet_id: str, user_message: str, history: list = None) -> str:
    """Send a message to the planet guardian via DeepSeek API."""
    system_prompt = GUARDIAN_SYSTEM_PROMPTS.get(planet_id, GUARDIAN_SYSTEM_PROMPTS["earth"])

    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for h in (history or [])[-10:]:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": user_message})

    try:
        resp = httpx.post(
            f"{DEEPSEEK_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": messages,
                "max_tokens": 800,
                "stream": False,
            },
            timeout=30,
        )
        data = resp.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if content:
            return content.strip()
        return "（星辰沉默了片刻，但没有回应）"
    except Exception as e:
        return f"（星辰传讯受阻：{str(e)[:40]}）"
