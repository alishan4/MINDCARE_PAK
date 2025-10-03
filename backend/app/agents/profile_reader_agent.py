# app/agents/profile_reader_agent.py
import re

CITIES = ["Karachi","Lahore","Islamabad","Multan","Quetta","Peshawar","Rawalpindi","Faisalabad","Hyderabad","Bahawalpur","Larkana","Abbottabad","Chakwal","Other"]
GENDERS = {
    "male": "Male", "men": "Male", "ladka": "Male", "mard": "Male", "لڑکا": "Male", "مرد": "Male",
    "female": "Female", "women": "Female", "lady": "Female", "ladki": "Female", "aurat": "Female", "خاتون": "Female", "عورت": "Female"
}
MODES = {
    "online": "online", "آن لائن": "online", "virtual": "online",
    "offline": "offline", "clinic": "offline", "inperson": "offline", "فزیکل": "offline"
}

def parse_query(text: str):
    q = (text or "").lower()
    filters = {}

    # City match
    for city in CITIES:
        if city.lower() in q or city in text:
            filters["city"] = city
            break

    # Gender
    for k,v in GENDERS.items():
        if k in q or k in text:
            filters["gender"] = v
            break

    # Fee detection
    nums = re.findall(r"\d{3,5}", q)
    if nums:
        filters["maxFee"] = int(nums[0])

    # Mode
    for k,v in MODES.items():
        if k in q or k in text:
            filters["mode"] = v
            break

    # Expertise keywords fallback
    filters["q"] = text
    return filters
