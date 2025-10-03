from typing import Dict

def breathing_card(style: str = "4-2-6") -> Dict:
    return {
        "type": "wellness_card",
        "title": "Guided Breathing",
        "pattern": style,  # inhale-hold-exhale seconds
        "duration_seconds": 60,
        "steps": [
            "Inhale gently through the nose for 4 seconds",
            "Hold for 2 seconds",
            "Exhale slowly through the mouth for 6 seconds",
            "Repeat with the animated circle"
        ]
    }
