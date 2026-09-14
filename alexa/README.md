# Hearth + Alexa Skills Kit

Hearth hosts the skill itself. You only create the skill record in Amazon’s developer console; there is no extra app on the Echo.

## What you can say

- “Alexa, open Hearth”
- “Alexa, ask Hearth to mark cooking done”
- “Alexa, tell Hearth I finished laundry”
- “Alexa, ask Hearth what’s left today”
- “Alexa, ask Hearth what’s on my list”

A bare “Alexa, completed cooking” does **not** reach Hearth. Alexa only sends free-form phrases to skills that are enabled, invoked (`ask Hearth` / `open Hearth`), and account-linked. Name-free (“Alexa, completed cooking”) is a separate Amazon certification path and is not on this skill.

## Architecture

1. You enable the skill in the Alexa app and sign in to Hearth (OAuth authorization code, with PKCE).
2. Alexa stores an access token for your Hearth user.
3. A spoken intent POSTs JSON to `POST /api/alexa` with that token.
4. Hearth finds today’s matching chore and sets `done`.

Tables: `alexa_oauth_codes`, `alexa_access_tokens` (`migrations/0003_alexa.sql`, `migrations/0004_alexa_pkce.sql`).

## Amazon console

1. Create a **Custom** skill, English, invocation name `hearth`.
2. Build → Interaction Model → JSON Editor: paste `interaction-model.json`.
3. Endpoint: HTTPS `https://YOUR_DOMAIN/api/alexa`. Choose a certificate from a trusted CA (or a wildcard on that domain). Alexa requires port 443. Echo devices cannot call `localhost`.
4. Tools → Account Linking:
   - Grant type: **Auth Code Grant**
   - **PKCE Authorization:** on (Hearth verifies `code_verifier` with S256)
   - Authorization URI: `https://YOUR_DOMAIN/api/alexa/oauth/authorize`
   - Access Token URI: `https://YOUR_DOMAIN/api/alexa/oauth/token`
   - Client ID: `hearth-alexa` (or the value of `ALEXA_OAUTH_CLIENT_ID`)
   - Client secret: a long random string — also set as `ALEXA_OAUTH_CLIENT_SECRET` on the Hearth host
   - Scope: `chores`
   - Domain list: your app host
5. Copy Amazon’s three redirect URLs from that page (NA / EU / JP). Hearth already allows:
   - `https://pitangui.amazon.com/api/skill/link/{id}`
   - `https://layla.amazon.com/api/skill/link/{id}`
   - `https://alexa.amazon.co.jp/api/skill/link/{id}`
6. Save your skill id as `ALEXA_SKILL_ID`.

Then in the Alexa app: enable **Hearth** → **Link account** → sign in to Hearth with **email and password** (the Alexa app cannot open Google/X pop-ups) → Allow.

## Host env

| Variable | Required when deployed | Purpose |
| --- | --- | --- |
| `ALEXA_OAUTH_CLIENT_ID` | no (default `hearth-alexa`) | Must match the console Client ID |
| `ALEXA_OAUTH_CLIENT_SECRET` | **yes** | Must match the console Client secret |
| `ALEXA_SKILL_ID` | recommended | Rejects requests from other skills |

Do not put these in a `.env` file in this project; set them on the host.

## Local notes

Alexa cannot call `localhost`. Matching is covered by `src/lib/alexa/match.test.ts` (“cooking” → cook dinner, not kitchen counters). The live skill path needs the deployed HTTPS URL plus account linking.
