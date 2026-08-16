"""Local guardian interaction engine — no external API, no token cost."""
from __future__ import annotations
import re

PLANET_NAMES = {
    "mercury": "辰星", "venus": "太白", "mars": "荧惑",
    "jupiter": "岁星", "saturn": "镇星", "earth": "望舒",
}

KEYWORDS = {
    "emotion": "开心|高兴|快乐|难过|伤心|委屈|焦虑|烦|生气|气死|崩溃|累|疲惫|压力|孤独|害怕|紧张",
    "idea": "想|打算|计划|准备|灵感|点子|创意|学习|开始|做一个|尝试",
    "like": "喜欢|爱|心动|讨厌|不喜欢|反感|不想|偏爱|在意",
    "daily": "今天|昨天|明天|早上|晚上|吃什么|天气|工作|上班|朋友|旅行",
}

RESPONSES = {
    "mercury": {
        "emotion": ["这阵情绪来得很快。是刚刚发生了什么，还是已经积了一阵？", "先把这一刻接住，不用急着解释。你现在最想说的那一句是什么？"],
        "idea": ["这个念头已经冒头了。你想把它变成什么，哪怕只是一个很小的开始？", "记下来了。它和你最近看到、听到或经历的什么有关？"],
        "daily": ["收到。这个日常片段里，哪一个瞬间最值得留下？", "如果只保留一个画面，你会选哪一幕？"],
        "default": ["我在听。这个念头可以再往前走一步——你真正想说的是什么？", "先不用组织得很完整，想到什么就说什么。"],
    },
    "venus": {
        "emotion": ["你对这件事的感受很明确。真正刺到你的，是哪一个细节？", "这份感觉也许正在告诉你：你在意什么？"],
        "idea": ["这个选择让你期待什么，又让你犹豫什么？", "如果不考虑别人怎么看，你自己更偏向哪一个？"],
        "like": ["你喜欢或讨厌的，往往都在勾勒你的边界。具体是哪一点？", "先不判断对错。这个好恶说明了你珍惜什么？"],
        "default": ["这件事在你心里留下了什么感觉？喜欢、抗拒，还是还说不清？", "从你自己的感受出发，不用先考虑别人。"],
    },
    "mars": {
        "emotion": ["听起来这股火真的烧起来了。先说，最让你不爽的到底是哪一点？", "不用马上冷静，也不用替别人找理由。你可以先把这口气写出来。"],
        "idea": ["想做就先动一小步，别让它只停在脑子里。你现在能做的第一步是什么？", "这件事让你兴奋，还是让你觉得必须证明点什么？"],
        "daily": ["这件事让你上头了吗？是气、兴奋，还是终于忍不住了？", "先把最真实的反应写下来，别急着修饰。"],
        "default": ["我接住了。你想继续倾诉，还是一起找出最让你上头的那个点？", "这口气不用憋着。发生了什么，直接说。"],
    },
    "jupiter": {
        "emotion": ["这份情绪背后，可能还有一个更大的问题。你觉得它在提醒你什么？", "先不用解决它。我们把这件事摊开看看，最重要的部分是哪一块？"],
        "idea": ["这个想法已经有根了。你希望它半年后长成什么样？", "把它拆小一点：今天能让它往前长一厘米的动作是什么？"],
        "daily": ["这件小事和你最近的生活有什么联系？", "如果把今天当成一颗种子，你觉得它会长出什么？"],
        "default": ["慢慢来。你愿意再展开一点吗？我帮你把线索理清楚。", "这件事还在生长，不必现在就给它一个结论。"],
    },
    "saturn": {
        "emotion": ["这份感受值得被放下来看看。它是不是最近反复出现？", "如果把这件事装进一个小盒子里，盒子上你会写什么？"],
        "idea": ["先把想法放稳：它的目标、阻力和下一步分别是什么？", "不用急着增加新的东西。现在最需要整理的是哪一部分？"],
        "daily": ["这件事和最近哪些日记连得上？", "把今天放回最近这段时间里看，它是不是一个重复出现的主题？"],
        "default": ["我听见了。我们不急着下结论，先把这件事整理清楚。", "先放在这里沉淀一下。回头看时，也许会看见新的线索。"],
    },
    "earth": {
        "emotion": ["这份情绪占据了你多少空间？还有没有其他部分也需要被照顾？", "先照顾好当下的自己，再看这件事要往哪里去。"],
        "idea": ["这个想法属于哪一颗星？是闪念、生长，还是已经到了计划阶段？", "可以把它放进对应的星球里，让它慢慢长出形状。"],
        "daily": ["这是今天的一个切片。你想把它存进哪一颗星？", "日常也值得被记录。最近哪一种状态出现得最多？"],
        "default": ["我在这里。你想从哪一颗星开始说？", "你的宇宙里最近哪颗星最亮？"],
    },
}


def _intent(text: str) -> str:
    for kind, pattern in KEYWORDS.items():
        if re.search(pattern, text):
            return kind
    return "default"


def chat_with_guardian(planet_id: str, user_message: str, history: list = None) -> str:
    """Generate a contextual response locally. No network/API/token usage."""
    planet = planet_id if planet_id in RESPONSES else "earth"
    intent = _intent(user_message)
    options = RESPONSES[planet].get(intent, RESPONSES[planet]["default"])
    # Use recent context to avoid repeating the exact same response.
    previous = {h.get("content", "") for h in (history or [])[-6:] if h.get("role") == "assistant"}
    available = [x for x in options if x not in previous] or options
    # Deterministic selection keeps UI stable without random flicker.
    index = (len(user_message) + len(history or [])) % len(available)
    return available[index]
