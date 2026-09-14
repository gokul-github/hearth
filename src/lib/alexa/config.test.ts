import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedAlexaRedirect } from "./config.ts";
import { isAlexaCertUrl } from "./verify.ts";

test("allows Amazon regional account-linking redirects", () => {
  assert.equal(
    isAllowedAlexaRedirect("https://pitangui.amazon.com/api/skill/link/ABCDEFGHIJ"),
    true,
  );
  assert.equal(
    isAllowedAlexaRedirect("https://layla.amazon.com/api/skill/link/ABCDEFGHIJ"),
    true,
  );
  assert.equal(
    isAllowedAlexaRedirect("https://alexa.amazon.co.jp/api/skill/link/ABCDEFGHIJ"),
    true,
  );
});

test("rejects open redirects", () => {
  assert.equal(isAllowedAlexaRedirect("https://evil.example/api/skill/link/ABCDEFGHIJ"), false);
  assert.equal(isAllowedAlexaRedirect("https://pitangui.amazon.com.evil/api/skill/link/x"), false);
  assert.equal(isAllowedAlexaRedirect("http://pitangui.amazon.com/api/skill/link/ABCDEFGHIJ"), false);
  assert.equal(isAllowedAlexaRedirect("/login"), false);
});

test("allowlists Alexa signing certificate URLs", () => {
  assert.equal(isAlexaCertUrl("https://s3.amazonaws.com/echo.api/echo-api-cert.pem"), true);
  assert.equal(isAlexaCertUrl("https://s3.amazonaws.com:443/echo.api/echo-api-cert.pem"), true);
  assert.equal(isAlexaCertUrl("https://s3.amazonaws.com/echo.api/../echo.api/echo-api-cert.pem"), true);
  assert.equal(isAlexaCertUrl("http://s3.amazonaws.com/echo.api/echo-api-cert.pem"), false);
  assert.equal(isAlexaCertUrl("https://evil.example/echo.api/echo-api-cert.pem"), false);
  assert.equal(isAlexaCertUrl("https://s3.amazonaws.com/not-echo/cert.pem"), false);
});
