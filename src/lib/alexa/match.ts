import { CATEGORIES, categoryLabel } from "../categories.ts";

export type VoiceTask = {
  id: number;
  title: string;
  category: string;
  done: boolean;
};

const ALIASES: Record<string, string[]> = {
  cooking: ["cooking", "cook", "dinner", "breakfast", "lunch", "meal", "meals", "food"],
  laundry: ["laundry", "wash", "washing", "clothes", "washer", "dryer"],
  gym: ["gym", "workout", "exercise", "training", "run", "stretch"],
  care: ["care", "shower", "bath", "bathing", "bed", "rest"],
  cleaning: ["cleaning", "clean", "bathroom", "vacuum", "floor", "floors", "tidy"],
  kitchen: ["kitchen", "counters", "counter", "dishes", "sink", "stove"],
  other: ["other", "chore", "task", "errand"],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((w) => w.length >= 3);
}

export function scoreTask(task: VoiceTask, phrase: string): number {
  const p = normalize(phrase);
  if (!p) return 0;
  const title = normalize(task.title);
  const cat = normalize(task.category);
  const label = normalize(categoryLabel(task.category));
  const aliases = ALIASES[task.category] ?? [];

  if (title === p) return 100;
  if (title.includes(p) || (p.length >= 4 && p.includes(title))) return 86;
  if (cat === p || label === p) return 78;
  if (aliases.includes(p)) return 74;

  let score = 0;
  for (const w of words(p)) {
    if (title.includes(w)) score += 22;
    else if (cat === w || label.includes(w) || aliases.includes(w)) score += 16;
  }
  return Math.min(score, 90);
}

export function matchTasks(tasks: VoiceTask[], phrase: string): VoiceTask[] {
  const ranked = tasks
    .map((task) => ({ task, score: scoreTask(task, phrase) }))
    .filter((row) => row.score >= 16)
    .sort((a, b) => b.score - a.score || a.task.id - b.task.id);
  if (ranked.length === 0) return [];
  const best = ranked[0]!.score;
  return ranked.filter((row) => row.score >= best - 8).map((row) => row.task);
}

export function categoryHintList(): string {
  return CATEGORIES.map((c) => c.label.toLowerCase()).join(", ");
}
