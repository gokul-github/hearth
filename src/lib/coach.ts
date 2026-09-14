import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { completeChat, aiAvailable, aiProvider, AI_SETUP_HINT } from "@/lib/ai/complete";
import { CATEGORIES, isCategoryId, isTimeOfDay } from "@/lib/categories";
import { weekdayOf } from "@/lib/utils";

export type CoachMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const FENCE = "`".repeat(3);
const HEARTH_ADD_EXAMPLE =
  '{"add":[{"title":"Wipe kitchen counters","category":"kitchen","timeOfDay":"evening","minutes":10}]}';
const HEARTH_BLOCK_RE = new RegExp(FENCE + "hearth\\s*([\\s\\S]*?)" + FENCE);
const HEARTH_STRIP_RE = new RegExp(FENCE + "hearth\\s*[\\s\\S]*?" + FENCE, "g");

const SYSTEM = `You are Hearth, a calm household companion. You help one person keep up with everyday home work: gym, bathing, cleaning, cooking, laundry, kitchen counters, and similar chores.

Rules:
- Be brief, warm, and practical. Short sentences. No emoji. No hype.
- Give concrete next steps a tired person can actually do.
- Prefer 10–20 minute actions over ambitious overhauls.
- Never invent medical or injury advice; keep workouts gentle and optional.
- If you want the app to add chores, append a single fenced block exactly like this (and nothing else inside it):

${FENCE}hearth
${HEARTH_ADD_EXAMPLE}
${FENCE}

Categories must be one of: gym, care, cleaning, cooking, laundry, kitchen, other.
timeOfDay must be morning, afternoon, or evening.
If you are only chatting, omit the hearth block.`;

function isoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid date");
  return value;
}

async function todayContext(userId: string, date: string): Promise<string> {
  const sql = await getSql();
  const tasks = await sql<{
    title: string;
    category: string;
    time_of_day: string;
    estimated_minutes: number;
    done: boolean;
  }>`
    select title, category, time_of_day, estimated_minutes, done
    from tasks
    where user_id = ${userId} and due_date = ${date}::date
    order by id
  `;
  if (tasks.length === 0) return `Date ${date}. No tasks yet.`;
  const lines = tasks.map(
    (t) =>
      `- [${t.done ? "done" : "open"}] ${t.title} (${t.category}, ${t.time_of_day}, ${t.estimated_minutes}m)`,
  );
  return `Date ${date}, weekday ${weekdayOf(date)}.\nToday's list:\n${lines.join("\n")}`;
}

function parseAdds(text: string): Array<{
  title: string;
  category: string;
  timeOfDay: string;
  minutes: number;
}> {
  const match = text.match(HEARTH_BLOCK_RE);
  if (!match?.[1]) return [];
  try {
    const parsed = JSON.parse(match[1]) as {
      add?: Array<{ title?: string; category?: string; timeOfDay?: string; minutes?: number }>;
    };
    if (!Array.isArray(parsed.add)) return [];
    return parsed.add
      .map((item) => {
        const title = (item.title ?? "").trim().slice(0, 120);
        if (!title) return null;
        return {
          title,
          category: isCategoryId(item.category ?? "") ? item.category! : "other",
          timeOfDay: isTimeOfDay(item.timeOfDay ?? "") ? item.timeOfDay! : "morning",
          minutes: Math.min(Math.max(Number(item.minutes) || 15, 5), 180),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  } catch {
    return [];
  }
}

function stripHearthBlock(text: string): string {
  return text.replace(HEARTH_STRIP_RE, "").trim();
}

export const getCoachStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => ({
    available: aiAvailable(),
    provider: aiProvider(),
    hint: aiAvailable() ? null : AI_SETUP_HINT,
  }));

export const listCoachMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<CoachMessage>`
      select id, role, content, created_at::text as created_at
      from coach_messages
      where user_id = ${context.userId}
      order by id desc
      limit 40
    `;
    return rows.reverse();
  });

export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { message: string; date: string }) => ({
    message: input.message.trim().slice(0, 2000),
    date: isoDate(input.date),
  }))
  .handler(async ({ context, data }) => {
    if (!data.message) throw new Error("Write a message first");
    const sql = await getSql();
    await sql`
      insert into coach_messages (user_id, role, content)
      values (${context.userId}, 'user', ${data.message})
    `;

    const history = await sql<{ role: string; content: string }>`
      select role, content from coach_messages
      where user_id = ${context.userId}
      order by id desc
      limit 10
    `;
    const contextBlock = await todayContext(context.userId, data.date);
    const result = await completeChat({
      maxTokens: 700,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "system", content: contextBlock },
        ...history.reverse().map((m) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
          content: m.content,
        })),
      ],
    });

    if (!result.ok) {
      const fallback =
        "I cannot reach the coach right now. Try again in a moment, or check off a small task on Today.";
      await sql`
        insert into coach_messages (user_id, role, content)
        values (${context.userId}, 'assistant', ${fallback})
      `;
      return { text: fallback, added: [] as string[] };
    }

    const added = parseAdds(result.text);
    const addedTitles: string[] = [];
    for (const item of added) {
      await sql`
        insert into tasks (user_id, title, category, due_date, time_of_day, estimated_minutes)
        values (
          ${context.userId}, ${item.title}, ${item.category}, ${data.date}::date,
          ${item.timeOfDay}, ${item.minutes}
        )
      `;
      addedTitles.push(item.title);
    }

    let visible = stripHearthBlock(result.text);
    if (!visible) visible = "Done. I kept the list simple.";
    if (addedTitles.length > 0) {
      visible += `\n\nAdded to today: ${addedTitles.join(", ")}.`;
    }

    await sql`
      insert into coach_messages (user_id, role, content)
      values (${context.userId}, 'assistant', ${visible})
    `;
    return { text: visible, added: addedTitles };
  });

export const planMyDay = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { date: string }) => ({ date: isoDate(input.date) }))
  .handler(async ({ context, data }) => {
    const contextBlock = await todayContext(context.userId, data.date);
    const cats = CATEGORIES.map((c) => c.id).join(", ");
    const result = await completeChat({
      maxTokens: 550,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are Hearth. Write a short daily plan for household work. No emoji. Plain sentences. Order open tasks from easiest morning wins to heavier evening work. Skip anything already done. End with one gentle tip. Keep it under 180 words.",
        },
        {
          role: "user",
          content: `${contextBlock}\n\nCategories: ${cats}. Write today's plan.`,
        },
      ],
    });
    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }
    return { ok: true as const, text: result.text.trim() };
  });

export const breakdownTask = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; category: string }) => ({
    title: input.title.trim().slice(0, 120),
    category: input.category,
  }))
  .handler(async ({ data }) => {
    const result = await completeChat({
      maxTokens: 400,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are Hearth. Break a household task into 4–6 short numbered steps a tired person can follow. No emoji. No preamble.",
        },
        {
          role: "user",
          content: `Task: ${data.title}. Category: ${data.category}.`,
        },
      ],
    });
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, text: result.text.trim() };
  });
