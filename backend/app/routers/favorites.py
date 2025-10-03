from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class FavoritePayload(BaseModel):
    user_id: str
    therapist_id: str

_fake_favorites = {}

@router.post("")
def add_favorite(payload: FavoritePayload):
    _fake_favorites.setdefault(payload.user_id, set()).add(payload.therapist_id)
    return {"ok": True}

@router.get("/{user_id}")
def list_favorites(user_id: str):
    return {"favorites": list(_fake_favorites.get(user_id, []))}
