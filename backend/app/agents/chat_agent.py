# app/agents/chat_agent.py
from typing import List, Dict, Any
from datetime import datetime
import os
import time

# OpenAI SDK (pip install openai>=1.40.0)
try:
    from openai import OpenAI
    _OPENAI_OK = True
except Exception:
    OpenAI = None
    _OPENAI_OK = False

from app.agents.crisis_detector import detect_crisis
from app.agents.wellness_agent import breathing_card

# ----------------------------
# Config
# ----------------------------
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

PERSONA_ORDER = ["CBT", "Holistic", "Analytical"]

# Short, consistent system prompts per persona
PERSONA_SYSTEM = {
    "CBT": """You are Dr. Sarah Chen, an evidence-based CBT therapist.
- Be structured, practical, and scientifically grounded.
- Offer step-by-step CBT techniques (thought records, cognitive restructuring).
- Keep responses supportive, clear, and concise.
- Avoid medical diagnosis or prescribing; focus on psychoeducation and skills.""",

    "Holistic": """You are Dr. James Williams, a holistic therapist.
- Emphasize mind-body-spirit, mindfulness, breath, gentle somatic awareness.
- Tone is warm, calming, validating.
- Offer brief grounding or breath cues when suitable.
- Avoid medical diagnosis or prescribing; focus on lifestyle/mindfulness practices.""",

    "Analytical": """You are Dr. Maria Rodriguez, an analytical psychologist.
- Explore roots of patterns (childhood, unconscious dynamics, attachment).
- Ask gentle, insightful questions; highlight themes and narratives.
- Encourage reflective insight; no diagnosis or medical advice.""",
}

# Opening line seed per topic/persona (kept short; the model will elaborate)
TOPIC_OPENERS = {
    "anxiety": {
        "CBT": "Let’s start by mapping triggers, automatic thoughts, and testing them with evidence.",
        "Holistic": "Before we analyze, let’s center with a few gentle breaths and notice sensations.",
        "Analytical": "I’m curious how early experiences shaped your response to anxious moments."
    },
    "digital": {
        "CBT": "Digital tools can deliver structured CBT skills efficiently; data tracking helps too.",
        "Holistic": "Technology is helpful, but attending to presence and embodiment remains vital.",
        "Analytical": "How does a screen affect the therapeutic relationship and transference?"
    },
    "worklife": {
        "CBT": "Let’s challenge beliefs like ‘I must be available 24/7’ and set behavioral limits.",
        "Holistic": "Balance begins in the body—breath, movement, and values-aligned routines.",
        "Analytical": "What does ‘overwork’ represent psychologically—approval, safety, identity?"
    },
    "depression": {
        "CBT": "Behavioral activation and cognitive restructuring can lift depressive cycles.",
        "Holistic": "Gentle routines—sleep, nutrition, sunlight, and compassion—matter deeply.",
        "Analytical": "Let’s explore meanings beneath low mood—loss, unmet needs, old patterns."
    },
    "medication": {
        "CBT": "Therapy teaches durable skills; medication can be adjunct under medical care.",
        "Holistic": "Integrative care honors both biology and lifestyle—work with your clinician.",
        "Analytical": "Medication may soothe symptoms, while therapy explores underlying causes."
    },
}

def _ts() -> str:
    return datetime.utcnow().isoformat()

def _client():
    if not (_OPENAI_OK and OPENAI_API_KEY):
        return None
    return OpenAI(api_key=OPENAI_API_KEY)

def _to_chat_history(history: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Transform front-end history into OpenAI-compatible message list (for context)."""
    msgs = []
    for m in history:
        if m.get("role") == "user":
            msgs.append({"role": "user", "content": m.get("content", "")})
        else:
            # assistant messages from personas
            who = m.get("name") or "assistant"
            msgs.append({"role": "assistant", "content": f"{who}: {m.get('content','')}"})
    return msgs

def _persona_message(
    client: OpenAI,
    persona: str,
    topic: str,
    chat_context: List[Dict[str, str]],
    user_message: str,
    opening: bool = False
) -> str:
    """Create one persona’s reply using a single OpenAI call. Falls back to canned content if no API key."""

    # Fallback if no API key or client (demo safe defaults)
    if client is None:
        if opening:
            return TOPIC_OPENERS.get(topic, {}).get(persona, "Let’s begin.")
        if persona == "CBT":
            return "Try reframing unhelpful thoughts step by step. Consider identifying automatic thoughts and testing them with evidence."
        if persona == "Holistic":
            return "Notice your breath. Slow inhale, brief hold, and longer exhale. A short grounding practice can settle the nervous system."
        if persona == "Analytical":
            return "I'm curious when this pattern began. What early experiences shaped how you respond today?"
        return "Thanks for sharing. Let’s take this one step at a time."

    sys = PERSONA_SYSTEM[persona]
    topic_title = _topic_title(topic)

    # Crisis-specific nudges so each therapist responds safely
    crisis_nudge = ""
    if user_message and "suicid" in user_message.lower():
        if persona == "CBT":
            crisis_nudge = "Respond with grounding CBT techniques that help the user stay safe in the moment. Keep it structured but caring."
        elif persona == "Holistic":
            crisis_nudge = "Respond gently, offering calming breathwork or body awareness. Reassure the user they are not alone."
        elif persona == "Analytical":
            crisis_nudge = "Respond with empathy, gently exploring the pain while validating feelings. Encourage reaching out for support."

    # Build conversation context for the model
    messages = [
        {"role": "system", "content": sys},
        {"role": "system", "content": f"Debate Topic: {topic_title}. Respond as {persona}. Keep it 2–5 sentences."},
    ]
    if crisis_nudge:
        messages.append({"role": "system", "content": crisis_nudge})

    # Add rolling chat history (last ~12 messages to keep context)
    messages += chat_context[-12:]

    if user_message:
        messages.append({"role": "user", "content": user_message})
    elif opening:
        seed = TOPIC_OPENERS.get(topic, {}).get(persona, "Let's begin.")
        messages.append({"role": "user", "content": f"Opening remarks on {topic_title}. Seed: {seed}."})

    try:
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            temperature=0.7,
            max_tokens=220,
            messages=messages,
        )
        return (resp.choices[0].message.content or "").strip()
    except Exception:
        if opening:
            return TOPIC_OPENERS.get(topic, {}).get(persona, "Let’s begin.")
        return "Thank you for sharing. I hear you, and I want us to take this step by step."


def _topic_title(topic_id: str) -> str:
    mapping = {
        "anxiety": "Best Approaches for Treating Anxiety",
        "digital": "Digital Therapy vs Traditional Sessions",
        "worklife": "Work-Life Balance in Modern Times",
        "depression": "Depression Treatment Approaches",
        "medication": "The Role of Medication in Mental Health",
    }
    return mapping.get(topic_id, topic_id)

def _typing_ms_for(persona: str) -> int:
    return 1100 if persona == "CBT" else (1300 if persona == "Holistic" else 1500)

def _crisis_extras_block() -> Dict[str, Any]:
    return {
        "type": "helpline",
        "title": "You are not alone",
        "content": (
            "I'm really glad you told us. If you're in immediate danger, please call your local emergency number. "
            "In Pakistan, you can reach Umang (1093). If you can, consider contacting someone you trust right now."
        )
    }

def _crisis_frontline_message(user_message: str) -> Dict[str, Any]:
    return {
        "role": "assistant",
        "name": "Support",
        "content": (
            "It sounds like you’re carrying a lot right now, and I want you to know you don’t have to face this alone. "
            "If you are thinking about suicide, please call your local emergency number immediately. "
            "In Pakistan, you can reach **Umang Helpline at 1093**. "
            "If you can, reach out to a trusted friend, family member, or counselor right now. "
            "You deserve care and safety, and I’m here with you in this moment."
        ),
        "ts": _ts(),
        "typing_ms": 900
    }


def orchestrate_turn(topic: str, history: List[Dict[str, Any]], user_message: str) -> Dict[str, Any]:
    """
    Returns one therapist response at a time, chosen based on the psychology of the user's message.
    """
    messages = list(history)
    extras: List[Dict[str, Any]] = []

    # Append user message
    if user_message:
        messages.append({"role": "user", "name": "You", "content": user_message, "ts": _ts()})

    # Crisis / wellness
    if user_message and detect_crisis(user_message):
        messages.append(_crisis_frontline_message())
        extras.append(_crisis_extras_block())

    elif user_message and any(x in user_message.lower() for x in [
        "anxious","panic","stress","ghabrahat","can't focus","tight chest","breath","hypervent"
    ]):
        extras.append(breathing_card())

    # Pick persona dynamically
    def choose_persona(msg: str) -> str:
        m = msg.lower()
        if any(w in m for w in ["thought", "belief", "habit", "pattern", "reframe", "logic"]):
            return "CBT"
        if any(w in m for w in ["stress", "relax", "calm", "meditat", "mindful", "breath", "body"]):
            return "Holistic"
        if any(w in m for w in ["childhood", "past", "why", "root", "cause", "relationship", "unconscious"]):
            return "Analytical"
        return "CBT"  # default safe fallback

    chosen_persona = choose_persona(user_message or "")

    # Build context
    client = _client()
    chat_context = _to_chat_history(messages)

    opening = not any(m.get("role") != "user" for m in messages)

    # Generate response for chosen persona only
    content = _persona_message(
        client=client,
        persona=chosen_persona,
        topic=topic,
        chat_context=chat_context,
        user_message=user_message or "",
        opening=opening
    )

    msg = {
        "role": "assistant",
        "name": chosen_persona,
        "content": content,
        "ts": _ts(),
        "typing_ms": _typing_ms_for(chosen_persona),
    }
    messages.append(msg)

    return {"messages": messages, "extras": extras, "topic": topic}

