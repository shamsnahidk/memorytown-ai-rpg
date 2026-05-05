from pathlib import Path
from typing import List, Dict


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"


def load_markdown_file(path: Path) -> str:
    if not path.exists():
        return ""

    return path.read_text(encoding="utf-8")


def get_npc_file_path(npc_id: str) -> Path:
    return DATA_DIR / "npcs" / f"{npc_id}.md"


def get_world_lore_files() -> List[Path]:
    lore_dir = DATA_DIR / "world_lore"

    if not lore_dir.exists():
        return []

    return list(lore_dir.glob("*.md"))


def score_text(text: str, query: str) -> int:
    query_terms = [
        term.strip().lower()
        for term in query.replace("?", " ").replace(".", " ").replace(",", " ").split()
        if len(term.strip()) > 2
    ]

    text_lower = text.lower()
    score = 0

    for term in query_terms:
        if term in text_lower:
            score += 1

    return score


def split_into_chunks(text: str) -> List[str]:
    chunks = []

    sections = text.split("\n\n")

    for section in sections:
        cleaned = section.strip()

        if cleaned:
            chunks.append(cleaned)

    return chunks


def retrieve_context(npc_id: str, query: str, max_chunks: int = 5) -> Dict:
    candidate_chunks = []

    npc_path = get_npc_file_path(npc_id)
    npc_text = load_markdown_file(npc_path)

    if npc_text:
        for chunk in split_into_chunks(npc_text):
            candidate_chunks.append(
                {
                    "source": npc_path.name,
                    "text": chunk,
                    "score": score_text(chunk, query),
                }
            )

    for lore_path in get_world_lore_files():
        lore_text = load_markdown_file(lore_path)

        for chunk in split_into_chunks(lore_text):
            candidate_chunks.append(
                {
                    "source": lore_path.name,
                    "text": chunk,
                    "score": score_text(chunk, query),
                }
            )

    ranked_chunks = sorted(
        candidate_chunks,
        key=lambda item: item["score"],
        reverse=True,
    )

    useful_chunks = [
        chunk for chunk in ranked_chunks if chunk["score"] > 0
    ]

    if not useful_chunks:
        useful_chunks = ranked_chunks[:2]

    selected_chunks = useful_chunks[:max_chunks]

    return {
        "context": "\n\n".join(chunk["text"] for chunk in selected_chunks),
        "sources": sorted(set(chunk["source"] for chunk in selected_chunks)),
    }