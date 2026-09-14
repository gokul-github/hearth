import assert from "node:assert/strict";
import { test } from "node:test";
import { pkceMatches, s256Challenge } from "./pkce.ts";

test("S256 verifier matches its challenge", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const challenge = s256Challenge(verifier);
  assert.equal(challenge.length > 20, true);
  assert.equal(pkceMatches(verifier, challenge, "S256"), true);
  assert.equal(pkceMatches("wrong-verifier-value-here!!!!", challenge, "S256"), false);
});

test("missing challenge skips PKCE (console PKCE off)", () => {
  assert.equal(pkceMatches("", null, null), true);
  assert.equal(pkceMatches("anything", "", ""), true);
});

test("stored challenge requires a verifier", () => {
  assert.equal(pkceMatches("", "abc", "S256"), false);
});
