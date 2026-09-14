import assert from "node:assert/strict";
import { test } from "node:test";
import { isOllamaCloudHost, ollamaCompletionsUrl } from "./complete.ts";

test("local Ollama OpenAI path", () => {
  assert.equal(
    ollamaCompletionsUrl("http://127.0.0.1:11434"),
    "http://127.0.0.1:11434/v1/chat/completions",
  );
});

test("Ollama Cloud OpenAI path", () => {
  assert.equal(ollamaCompletionsUrl("https://ollama.com"), "https://ollama.com/v1/chat/completions");
  assert.equal(ollamaCompletionsUrl("https://ollama.com/v1"), "https://ollama.com/v1/chat/completions");
  assert.equal(ollamaCompletionsUrl("https://ollama.com/api"), "https://ollama.com/v1/chat/completions");
});

test("detects ollama.com as cloud", () => {
  assert.equal(isOllamaCloudHost("https://ollama.com"), true);
  assert.equal(isOllamaCloudHost("https://ollama.com/v1"), true);
  assert.equal(isOllamaCloudHost("http://127.0.0.1:11434"), false);
});
