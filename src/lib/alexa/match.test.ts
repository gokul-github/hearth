import assert from "node:assert/strict";
import { test } from "node:test";
import { matchTasks, scoreTask, type VoiceTask } from "./match.ts";

const tasks: VoiceTask[] = [
  { id: 1, title: "Cook dinner", category: "cooking", done: false },
  { id: 2, title: "Make breakfast", category: "cooking", done: false },
  { id: 3, title: "Wipe kitchen counters", category: "kitchen", done: false },
  { id: 4, title: "Shower", category: "care", done: false },
  { id: 5, title: "Gym", category: "gym", done: true },
];

test("cooking maps to cooking-category chores", () => {
  const hits = matchTasks(tasks, "cooking");
  assert.ok(hits.some((t) => t.title === "Cook dinner"));
  assert.ok(hits.some((t) => t.title === "Make breakfast"));
  assert.ok(!hits.some((t) => t.category === "kitchen"));
});

test("an exact title wins over category", () => {
  const hits = matchTasks(tasks, "Wipe kitchen counters");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.title, "Wipe kitchen counters");
});

test("shower maps to care", () => {
  const hits = matchTasks(tasks, "I finished shower");
  assert.equal(hits[0]?.title, "Shower");
});

test("empty phrase does not match", () => {
  assert.deepEqual(matchTasks(tasks, "   "), []);
  assert.equal(scoreTask(tasks[0]!, ""), 0);
});
