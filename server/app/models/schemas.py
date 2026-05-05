from pydantic import BaseModel, Field
from typing import List, Literal


class ChatMessage(BaseModel):
    sender: Literal["player", "npc"]
    text: str


class ChatRequest(BaseModel):
    npc_id: str
    player_message: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    npc_id: str
    reply: str
    source: str
    retrieved_sources: List[str] = Field(default_factory=list)