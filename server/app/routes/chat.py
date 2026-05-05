from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.rag.retriever import retrieve_context

router = APIRouter()

NPC_PROFILES = {
    "maya": {
        "name": "Maya",
        "personality": "warm, witty coffee shop owner who knows town gossip",
        "tone": "friendly and witty",
    },
    "arjun": {
        "name": "Arjun",
        "personality": "nervous student who lost an important notebook",
        "tone": "nervous and honest",
    },
    "lina": {
        "name": "Lina",
        "personality": "mysterious librarian who speaks carefully",
        "tone": "calm and cryptic",
    },
}


def build_knowledge_based_reply(
    npc_id: str,
    player_message: str,
    retrieved_context: str,
) -> str:
    npc = NPC_PROFILES.get(npc_id)

    if not npc:
        raise HTTPException(status_code=404, detail=f"NPC '{npc_id}' not found")

    name = npc["name"]
    message = player_message.lower()

    if "hello" in message or "hi" in message:
        return (
            f"{name}: Hi. I can tell you about what I know around MemoryTown. "
            "Ask me about the park, library, coffee shop, notebook, or train station."
        )

    if not retrieved_context.strip():
        return (
            f"{name}: I do not know enough about that yet. "
            "Maybe ask me about something happening in MemoryTown."
        )

    if npc_id == "maya":
        return (
            f"{name}: From what I’ve heard, {summarize_context(retrieved_context)} "
            "But you did not hear that from me."
        )

    if npc_id == "arjun":
        return (
            f"{name}: I think this connects to something I noticed. "
            f"{summarize_context(retrieved_context)} I really need to find that notebook."
        )

    if npc_id == "lina":
        return (
            f"{name}: MemoryTown keeps records of such things. "
            f"{summarize_context(retrieved_context)} Some doors open only when you know what to ask."
        )

    return f"{name}: {summarize_context(retrieved_context)}"


def summarize_context(context: str) -> str:
    lines = [
        line.strip("- ").strip()
        for line in context.splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]

    useful_lines = [
        line for line in lines
        if len(line) > 20
    ]

    if not useful_lines:
        return "there may be something important here, but I need more information."

    selected = useful_lines[:2]
    summary = " ".join(selected)

    if len(summary) > 260:
        summary = summary[:260].rsplit(" ", 1)[0] + "..."

    return summary


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if request.npc_id not in NPC_PROFILES:
        raise HTTPException(
            status_code=404,
            detail=f"NPC '{request.npc_id}' not found",
        )

    retrieval_result = retrieve_context(
        npc_id=request.npc_id,
        query=request.player_message,
    )

    reply = build_knowledge_based_reply(
        npc_id=request.npc_id,
        player_message=request.player_message,
        retrieved_context=retrieval_result["context"],
    )

    return ChatResponse(
        npc_id=request.npc_id,
        reply=reply,
        source="file-retrieval-backend",
        retrieved_sources=retrieval_result["sources"],
    )