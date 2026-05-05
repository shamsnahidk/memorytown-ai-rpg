from pydantic import BaseModel
from typing import List, Literal


class ChatMessage(BaseModel):
    sender: Literal["player", "npc"]
    text: str


class ChatRequest(BaseModel):
    npc_id: str
    player_message: str
    conversation_history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    npc_id: str
    reply: str
    source: str