# Hearth

A calm household companion for everyday work: gym, bathing, cleaning, cooking, laundry, and the kitchen.

Hearth keeps a short list for today, repeats routines on the days you choose, and a coach helps only when you ask — plan the day, break a chore into steps, or get a simple dinner idea.

## Features

- **Today** — morning, afternoon, and evening tasks you can check off
- **Week** — seven days of household work at a glance
- **Routines** — repeating chores that write themselves onto matching days
- **Coach** — ask for a plan, a workout, a meal idea, or how to do a chore
- **Accounts** — email and password, Google, or X; your list stays on your account
- **Alexa** — optional: “Alexa, ask Hearth to mark cooking done” after you enable the skill and link this account

## Stack

React 19, TanStack Start, Tailwind CSS, Postgres (Neon in production, PGLite in local preview), Better Auth, and an OpenAI-compatible AI API (Grok by default; Ollama if `OLLAMA_BASE_URL` is set).

## Local development

```bash
npm install
npm run dev
```

Sign-in and the database are enabled for this app. Production injects `DATABASE_URL` and auth credentials.

## Coach / AI

The coach is **server-level**, not per login. Your account holds chores; the process that runs Hearth holds the model key. Do not paste an API key into the sign-in form — it would sit in the browser.

Put the key in a gitignored `.env` (or `.env.local`) next to `package.json`, then restart:

```bash
# Offline, on this machine (Ollama)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2

# Or Grok on the public API (needs network)
XAI_API_KEY=xai-your-key
```

Install Ollama, then `ollama pull llama3.2`. If both Ollama and Grok are set, Ollama wins so the app stays usable offline.

**Ollama Cloud** (hosted, no local daemon):

```bash
OLLAMA_API_KEY=your_ollama_key
OLLAMA_MODEL=gpt-oss:120b
```

Create the key at [ollama.com/settings/keys](https://ollama.com/settings/keys). Hearth then calls OpenAI-compatible `https://ollama.com/v1/chat/completions`. You can set `OLLAMA_BASE_URL=https://ollama.com` explicitly; if only the key is set, that host is the default.

Native Ollama Cloud chat is `https://ollama.com/api/chat`. Do not point `OLLAMA_BASE_URL` at `/api` — Hearth uses the `/v1` OpenAI path.

On a host (Vercel, a VPS), set the same names as server environment variables. Vite only forwards `VITE_` keys to the browser; Hearth lifts these server names from `.env` itself. Never prefix them with `VITE_`.

## Alexa

Hearth can serve an Alexa Custom Skill. The Echo talks to this app over HTTPS; your Hearth login is linked with Amazon account linking.

1. Deploy Hearth on a public HTTPS URL (Alexa cannot reach `localhost`).
2. Create a **Custom Skill** in the [Alexa developer console](https://developer.amazon.com/alexa/console/ask). Invocation name: `hearth`.
3. Paste [alexa/interaction-model.json](alexa/interaction-model.json) into the skill’s JSON editor.
4. Endpoint (HTTPS): `https://YOUR_DOMAIN/api/alexa`
5. Account linking (authorization code grant):
   - Authorization URI: `https://YOUR_DOMAIN/api/alexa/oauth/authorize`
   - Access token URI: `https://YOUR_DOMAIN/api/alexa/oauth/token`
   - Client ID: `hearth-alexa` (or `ALEXA_OAUTH_CLIENT_ID`)
   - Client secret: set `ALEXA_OAUTH_CLIENT_SECRET` on the server to the same value you enter in the console
   - Scope: `chores`
   - Turn **PKCE Authorization** on
6. Optional: set `ALEXA_SKILL_ID` to your `amzn1.ask.skill…` id so other skills cannot call this endpoint.

Then in the Alexa app: enable **Hearth** → **Link account** → sign in to Hearth (email and password work inside the Alexa app) → Allow.

A bare “Alexa, completed cooking” is not enough — you need “Alexa, ask Hearth …”. Full setup: [alexa/README.md](alexa/README.md).

