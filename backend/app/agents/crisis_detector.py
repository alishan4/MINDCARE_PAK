CRISIS_KEYWORDS = [
    "suicide","kill myself","self-harm","hopeless","can't go on","ending it",
    "hurt myself","no reason to live","die","not safe"
]

def detect_crisis(text: str) -> bool:
    tl = (text or "").lower()
    return any(k in tl for k in CRISIS_KEYWORDS)
