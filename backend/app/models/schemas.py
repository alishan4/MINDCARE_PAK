from pydantic import BaseModel
from typing import Optional, List

class Therapist(BaseModel):
    id: str
    name: str
    profile_url: Optional[str] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    experience_years: Optional[float] = 0   # allow decimals
    email: Optional[str] = None
    emails_all: Optional[List[str]] = []
    phone: Optional[str] = None
    modes: Optional[List[str]] = []         # ["online","offline"]
    education: Optional[str] = None
    experience: Optional[str] = None
    expertise: Optional[str] = None
    about: Optional[str] = None
    fees_raw: Optional[str] = None          # raw string "Rs. 2,500 per session"
    fee_currency: Optional[str] = "PKR"
    rating: Optional[float] = 0.0
