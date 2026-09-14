type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type CompleteResult =
  | { ok: true; text: string; provider: "ollama" | "xai" }
  | { ok: false; error: string };

export type AiProvider = "ollama" | "xai";

export const OLLAMA_CLOUD_HOST = "https://ollama.com";

export const AI_SETUP_HINT =
  "The coach runs on the Hearth server, not in your login. Set XAI_API_KEY for Grok, OLLAMA_API_KEY for Ollama Cloud, or OLLAMA_BASE_URL for a local model, then restart the app.";

export function ollamaCompletionsUrl(base: string): string {
  const trimmed = base.trim().replace(/\/$/, "");
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  if (trimmed.endsWith("/api")) return `${trimmed.slice(0, -4)}/v1/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

export function isOllamaCloudHost(base: string): boolean {
  try {
    const host = new URL(base.includes("://") ? base : `https://${base}`).hostname.toLowerCase();
    return host === "ollama.com" || host.endsWith(".ollama.com");
  } catch {
    return false;
  }
}

function resolveProvider():
  | { provider: AiProvider; url: string; headers: Record<string, string>; model: string; cloud: boolean }
  | null {
  const ollamaKey = process.env.OLLAMA_API_KEY?.trim();
  const ollamaBase = process.env.OLLAMA_BASE_URL?.trim() || (ollamaKey ? OLLAMA_CLOUD_HOST : "");
  if (ollamaBase) {
    const cloud = isOllamaCloudHost(ollamaBase);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (ollamaKey) headers.Authorization = `Bearer ${ollamaKey}`;
    return {
      provider: "ollama",
      url: ollamaCompletionsUrl(ollamaBase),
      headers,
      model:
        process.env.OLLAMA_MODEL?.trim() ||
        (cloud ? "gpt-oss:120b" : "llama3.2"),
      cloud,
    };
  }

  const apiKey = process.env.XAI_API_KEY?.trim();
  if (apiKey) {
    return {
      provider: "xai",
      url: "https://api.x.ai/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      model: "grok-4.5",
      cloud: true,
    };
  }

  return null;
}

/**
 * OpenAI-compatible chat completions.
 * Ollama local, Ollama Cloud (https://ollama.com/v1), or xAI Grok.
 */
export async function completeChat(opts: {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<CompleteResult> {
  const provider = resolveProvider();
  if (!provider) {
    return { ok: false, error: AI_SETUP_HINT };
  }

  let res: Response;
  try {
    res = await fetch(provider.url, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify({
        model: provider.model,
        messages: opts.messages,
        max_tokens: opts.maxTokens ?? 700,
        temperature: opts.temperature ?? 0.5,
      }),
    });
  } catch {
    if (provider.provider === "ollama" && !provider.cloud) {
      return {
        ok: false,
        error: "Could not reach the local model. Start Ollama, then try again.",
      };
    }
    return { ok: false, error: "Could not reach the AI service. Try again in a moment." };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "The AI key was rejected. Check OLLAMA_API_KEY or XAI_API_KEY." };
    }
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

export function aiProvider(): AiProvider | null {
  return resolveProvider()?.provider ?? null;
}
