# Hearth

A calm household companion for everyday work: gym, bathing, cleaning, cooking, laundry, and the kitchen.

Hearth keeps a short list for today, repeats routines on the days you choose, and a coach helps only when you ask — plan the day, break a chore into steps, or get a simple dinner idea.

## Features

- **Today** — morning, afternoon, and evening tasks you can check off
- **Week** — seven days of household work at a glance
- **Routines** — repeating chores that write themselves onto matching days
- **Coach** — ask for a plan, a workout, a meal idea, or how to do a chore
- **Accounts** — email and password, Google, or X; your list stays on your account

## Stack

React 19, TanStack Start, Tailwind CSS, Postgres (Neon in production, PGLite in local preview), Better Auth, and an OpenAI-compatible AI API (Grok by default; Ollama if `OLLAMA_BASE_URL` is set).

## Local development

```bash
npm install
npm run dev
```

Sign-in and the database are enabled for this app. Production injects `DATABASE_URL` and auth credentials. AI calls use `XAI_API_KEY` on the server, or Ollama when `OLLAMA_BASE_URL` is present.
