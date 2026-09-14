import { getSql } from "@/lib/db";
import { todayISO } from "@/lib/utils";
import { ensureTodaySeeded } from "@/lib/household";
import { matchTasks, categoryHintList, type VoiceTask } from "./match.ts";

export type ChoreSpeech = { speech: string; keepOpen?: boolean };

async function loadOpenAndDone(userId: string, date: string): Promise<VoiceTask[]> {
  const sql = await getSql();
  return sql<VoiceTask>`
    select id, title, category, done
    from tasks
    where user_id = ${userId} and due_date = ${date}::date
    order by id
  `;
}

export async function completeByPhrase(userId: string, phrase: string): Promise<ChoreSpeech> {
  const date = todayISO();
  await ensureTodaySeeded(userId, date);
  const tasks = await loadOpenAndDone(userId, date);
  if (tasks.length === 0) {
    return { speech: "There is nothing on today's Hearth list yet. Add a chore in the app first." };
  }

  const matches = matchTasks(tasks, phrase);
  if (matches.length === 0) {
    return {
      speech: `I could not find ${phrase || "that"} on today. Try ${categoryHintList()}.`,
      keepOpen: true,
    };
  }

  const open = matches.filter((t) => !t.done);
  if (open.length === 0) {
    const name = matches[0]!.title;
    return { speech: `${name} is already done. Nice work.` };
  }
  if (open.length > 1) {
    const names = open.map((t) => t.title).slice(0, 3);
    const last = names.pop();
    return {
      speech: `Which one: ${names.join(", ")}${names.length ? ", or " : ""}${last}?`,
      keepOpen: true,
    };
  }

  const task = open[0]!;
  const sql = await getSql();
  await sql`
    update tasks
    set done = true, done_at = now()
    where id = ${task.id} and user_id = ${userId}
  `;
  const remaining = tasks.filter((t) => t.id !== task.id && !t.done).length;
  if (remaining === 0) {
    return { speech: `Marked ${task.title} done. That is everything on today.` };
  }
  return {
    speech: `Marked ${task.title} done. ${remaining} left today.`,
  };
}

export async function listTodaySpeech(userId: string, openOnly: boolean): Promise<ChoreSpeech> {
  const date = todayISO();
  await ensureTodaySeeded(userId, date);
  const tasks = await loadOpenAndDone(userId, date);
  const list = openOnly ? tasks.filter((t) => !t.done) : tasks;
  if (list.length === 0) {
    return {
      speech: openOnly
        ? "Today is clear. Nothing left on the list."
        : "There is nothing on today's list yet.",
    };
  }
  const names = list.slice(0, 6).map((t) => t.title);
  const extra = list.length - names.length;
  const body = names.join(", ");
  const tail = extra > 0 ? `, and ${extra} more` : "";
  if (openOnly) return { speech: `${list.length} left: ${body}${tail}.` };
  const done = tasks.filter((t) => t.done).length;
  return { speech: `${done} of ${tasks.length} done. On the list: ${body}${tail}.` };
}
