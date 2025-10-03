from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.agents.chat_agent import orchestrate_turn

router = APIRouter()

class ChatInput(BaseModel):
    topic: str
    history: List[dict] = []
    user_message: str = ""

@router.post("/respond")
def respond(payload: ChatInput):
    return orchestrate_turn(payload.topic, payload.history, payload.user_message)
