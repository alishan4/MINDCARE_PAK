# app/agents/finder_agent.py
from typing import List, Optional
from collections import Counter
from app.models.schemas import Therapist
from app.core.database import get_supabase
import re
import ast
supabase = get_supabase()

# ---- helpers ----
def parse_fee(fees_raw: str) -> int:
    if not fees_raw:
        return 0
    cleaned = fees_raw.replace(",", "")
    nums = re.findall(r"\d+", cleaned)
    return int(nums[0]) if nums else 0

def in_fee_range(fee: int, minFee: Optional[int], maxFee: Optional[int]) -> bool:
    if minFee is not None and fee < minFee:
        return False
    if maxFee is not None and maxFee is not None and fee > maxFee:
        return False
    return True

def in_experience_range(exp: int, exp_range: Optional[str]) -> bool:
    if not exp_range:
        return True
    if exp_range == "0-5":
        return 0 <= exp <= 5
    if exp_range == "5-10":
        return 5 < exp <= 10
    if exp_range == "10-15":
        return 10 < exp <= 15
    if exp_range == "15+":
        return exp > 15
    return True

def normalize_modes(value):
    """
    Normalize modes field from Supabase (text[]).
    Handles formats like:
    - '{online}'
    - '{online,offline}'
    - '{"online","offline"}'
    Also supports plain strings 'online, offline' and lists.
    """
    if not value:
        return []

    if isinstance(value, list):  # already a Python list
        return [str(x).strip().lower() for x in value if x]

    if isinstance(value, str):
        v = value.strip()

        # Postgres array with quotes {"online","offline"}
        if v.startswith("{") and v.endswith("}"):
            inner = v.strip("{}")
            # remove quotes if present
            return [x.strip().strip('"').lower() for x in inner.split(",") if x.strip()]

        # fallback: comma separated
        return [x.strip().lower() for x in v.replace("and", ",").split(",") if x.strip()]

    return []


# ---- counts for sidebar ----
def compute_filter_counts():
    if supabase is None:
        return {"city": {}, "gender": {}, "experience": {}, "fee": {}, "mode": {}}

    # fetch ALL rows (not just 10) but only needed columns
    resp = supabase.table("therapists").select("city,gender,experience_years,fees_raw,modes").execute()
    if getattr(resp, "error", None):
        print("FILTERS ERROR:", resp.error)
    data = resp.data or []

    # --- City & Gender ---
    cities = Counter([d.get("city") for d in data if d.get("city")])
    genders = Counter([d.get("gender") for d in data if d.get("gender")])

    # --- Experience buckets ---
    def exp_bucket(v):
        v = float(v or 0)
        if v <= 5: return "0-5"
        if v <= 10: return "5-10"
        if v <= 15: return "10-15"
        return "15+"
    exps = Counter([exp_bucket(d.get("experience_years")) for d in data])

    # --- Fee buckets ---
    def fee_bucket(fr):
        f = parse_fee(fr)
        if f == 0: return "unknown"
        if f < 2000: return "<2000"
        if f <= 4000: return "2000-4000"
        if f <= 6000: return "4000-6000"
        return ">6000"
    fees = Counter([fee_bucket(d.get("fees_raw")) for d in data])

    # --- Modes (normalize text[]) ---
    modes_ctr = Counter()
    for d in data:
        raw_modes = d.get("modes")
        for m in normalize_modes(raw_modes):
            if m in ("in-person", "in person", "offline", "clinic"):
                mm = "in-person"
            elif m in ("online", "virtual"):
                mm = "online"
            else:
                mm = m
            modes_ctr[mm] += 1

    return {
        "city": dict(cities),
        "gender": dict(genders),
        "experience": dict(exps),
        "fee": dict(fees),
        "mode": dict(modes_ctr)
    }




# ---- main search with sorting ----
def search_therapists(
    city: Optional[str],
    gender: Optional[str],
    minFee: Optional[int],
    maxFee: Optional[int],
    experienceRange: Optional[str],
    mode: Optional[str],
    q: Optional[str],
    page: int,
    page_size: int,
    sort: Optional[str] = None
) -> List[Therapist]:
    if supabase is None:
        return []

    resp = supabase.table("therapists").select("*").execute()
    if getattr(resp, "error", None):
        print("SUPABASE SELECT ERROR:", resp.error)
    rows = resp.data or []

    results: List[dict] = []
    for r in rows:
        fee_val = parse_fee(r.get("fees_raw"))
        exp_val = float(r.get("experience_years") or 0)
        modes = normalize_modes(r.get("modes"))

        # normalize mode value given in filter
        norm_mode = None
        if mode:
            lm = mode.lower()
            if lm in ("in-person", "in person", "offline", "clinic"): norm_mode = "in-person"
            elif lm in ("online", "virtual"): norm_mode = "online"
            else: norm_mode = lm

        # filters
        if city and (r.get("city") or "").lower() != city.lower(): continue
        if gender and (r.get("gender") or "").lower() != gender.lower(): continue
        if not in_fee_range(fee_val, minFee, maxFee): continue
        if not in_experience_range(int(exp_val), experienceRange): continue
        if norm_mode and norm_mode not in [("in-person" if m in ("offline","clinic","in-person") else m) for m in modes]:
            continue
        if q:
            ql = q.lower()
            searchable_text = " ".join([
                r.get("name",""),
                r.get("expertise","") or "",
                r.get("education","") or "",
                r.get("about","") or ""
            ]).lower()
            if ql not in searchable_text:
                continue

        r["_fee_val"] = fee_val
        r["_exp_val"] = exp_val
        results.append(r)

    # sort
    if sort == "fee_low":
        results.sort(key=lambda x: x.get("_fee_val", 0))
    elif sort == "fee_high":
        results.sort(key=lambda x: x.get("_fee_val", 0), reverse=True)
    elif sort == "exp_high":
        results.sort(key=lambda x: x.get("_exp_val", 0), reverse=True)
    else:
        # simple "relevance": prefer matches where query appeared in name/expertise (already filtered),
        # then lower fee, then higher experience
        results.sort(key=lambda x: (x.get("_fee_val", 999999), -x.get("_exp_val", 0)))

    # pagination
    start = (page - 1) * page_size
    end = start + page_size
    return [Therapist(**r) for r in results[start:end]]
