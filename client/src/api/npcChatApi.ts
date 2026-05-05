export type ChatMessage = {
  sender: "player" | "npc";
  text: string;
};

export type ChatRequest = {
  npc_id: string;
  player_message: string;
  conversation_history: ChatMessage[];
};

export type ChatResponse = {
  npc_id: string;
  reply: string;
  source: string;
  retrieved_sources: string[];
};

const API_BASE_URL = "http://localhost:8000";

export async function sendNpcChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Chat API failed with status ${response.status}`);
  }

  return response.json();
}