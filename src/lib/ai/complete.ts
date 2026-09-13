type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type CompleteResult =
  | { ok: true; text: string; provider: "ollama" | "xai" }
  | { ok: false; error: string };

function resolveProvider():
  | { provider: "ollama"; url: string; headers: Record<string, string>; model: string }
  | { provider: "xai"; url: string; headers: Record<string, string>; model: string }
  | null {
  const ollamaBase = process.env.OLLAMA_BASE_URL?.trim();
  if (ollamaBase) {
    const root = ollamaBase.replace(/\/$/, "");
    return {
      provider: "ollama",
      url: `${root}/v1/chat/completions`,
      headers: { "Content-Type": "application/json" },
      model: process.env.OLLAMA_MODEL?.trim() || "llama3.2",
    };
  }

  const apiKey = process.env.XAI_API_KEY;
  if (apiKey) {
    return {
      provider: "xai",
      url: "https://api.x.ai/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      model: "grok-4.5",
    };
  }

  return null;
}

/**
 * OpenAI-compatible chat completions.
 * Uses the Ollama HTTP API when OLLAMA_BASE_URL is set (same /v1/chat/completions
 * shape). Otherwise uses xAI Grok, which speaks the same protocol so the app
 * works on the web without a local Ollama install.
 */
export async function completeChat(opts: {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<CompleteResult> {
  const provider = resolveProvider();
  if (!provider) {
    return { ok: false, error: "AI is not available in this environment" };
  }

  const res = await fetch(provider.url, {
    method: "POST",
    headers: provider.headers,
    body: JSON.stringify({
      model: provider.model,
      messages: opts.messages,
      max_tokens: opts.maxTokens ?? 700,
      temperature: opts.temperature ?? 0.5,
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `AI request failed (${res.status})` };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return {
    ok: true,
    text: body.choices?.[0]?.message?.content ?? "",
    provider: provider.provider,
  };
}

export function aiAvailable(): boolean {
  return resolveProvider() !== null;
}
