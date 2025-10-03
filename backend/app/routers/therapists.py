from fastapi import APIRouter, Query
from typing import List, Optional
from app.models.schemas import Therapist
from app.agents.finder_agent import search_therapists, compute_filter_counts
from app.agents.profile_reader_agent import parse_query

router = APIRouter()

@router.get("/", response_model=List[Therapist])
def list_therapists(
    search: Optional[str] = None,
    city: Optional[str] = None,
    gender: Optional[str] = None,
    minFee: Optional[int] = Query(None, ge=0),
    maxFee: Optional[int] = Query(None, ge=0),
    experienceRange: Optional[str] = None,
    mode: Optional[str] = None,
    q: Optional[str] = None,
    sort: Optional[str] = None,   # <-- NEW
    page: int = 1,
    page_size: int = 12,
):
    if search:
        parsed = parse_query(search)
        city = parsed.get("city", city)
        gender = parsed.get("gender", gender)
        maxFee = parsed.get("maxFee", maxFee)
        mode = parsed.get("mode", mode)
        q = parsed.get("q", q)

    return search_therapists(city, gender, minFee, maxFee, experienceRange, mode, q, page, page_size, sort)

@router.get("/filters")
def filters():
    return compute_filter_counts()
