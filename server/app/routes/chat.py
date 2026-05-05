from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse

router = APIRouter()

NPC_PROFILES = {
    "maya": {
        "name": "Maya",
        "personality": "warm, witty coffee shop owner who knows town gossip",
        "topic_hint": "coffee shop, rumors, train station, hidden places",
    },
    "arjun": {
        "name": "Arjun",
        "personality": "nervous student who lost an important notebook",
        "topic_hint": "lost notebook, school, park, strange notes",
    },
    "lina": {
        "name": "Lina",
        "personality": "mysterious librarian who speaks carefully",
        "topic_hint": "library, old books, town history, locked room",
    },
}


def generate_mock_reply(npc_id: str, player_message: str) -> str:
    npc = NPC_PROFILES.get(npc_id)

    if not npc:
        raise HTTPException(status_code=404, detail=f"NPC '{npc_id}' not found")

    name = npc["name"]
    message = player_message.lower()

    if "hello" in message or "hi" in message:
        return f"{name}: Hi. Since you're here, ask me about {npc['topic_hint']}."

    if "library" in message:
        return f"{name}: The library is not just a library. Lina knows more than she admits."

    if "notebook" in message:
        return f"{name}: Arjun’s notebook went missing near the park. That feels too convenient to be random."

    if "coffee" in message:
        return f"{name}: Maya’s coffee shop is where half the town pretends not to gossip."

    if "park" in message:
        return f"{name}: The park is peaceful during the day, but people avoid it after sunset."

    if "who are you" in message or "your name" in message:
        return f"{name}: I’m {name}. Around here, people usually reveal more than they mean to."

    return (
        f"{name}: Interesting. Right now I’m answering through backend placeholder logic. "
        "Soon, my responses will come from a RAG system using character memory and world lore."
    )


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    reply = generate_mock_reply(request.npc_id, request.player_message)

    return ChatResponse(
        npc_id=request.npc_id,
        reply=reply,
        source="mock-backend",
    )