import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { DEFAULT_ROUTINES, isCategoryId, isTimeOfDay } from "@/lib/categories";
import { weekdayOf } from "@/lib/utils";

export type TaskRow = {
  id: number;
  routine_id: number | null;
  title: string;
  category: string;
  due_date: string;
  time_of_day: string;
  estimated_minutes: number;
  notes: string | null;
  done: boolean;
  done_at: string | null;
};

export type RoutineRow = {
  id: number;
  title: string;
  category: string;
  weekdays: string;
  time_of_day: string;
  estimated_minutes: number;
  notes: string | null;
  active: boolean;
};

export type DayStats = {
  total: number;
  done: number;
  minutesLeft: number;
  streak: number;
  weekDoneDays: number;
};

function isoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid date");
  }
  return value;
}

async function ensureSeeded(userId: string, date: string) {
  const sql = await getSql();
  const existing = await sql<{ user_id: string; seeded: boolean }>`
    select user_id, seeded from profiles where user_id = ${userId}
  `;
  if (existing.length === 0) {
    await sql`
      insert into profiles (user_id, seeded) values (${userId}, false)
    `;
  }
  const profile = existing[0] ?? { seeded: false };
  if (!profile.seeded) {
    const count = await sql<{ n: number }>`
      select count(*)::int as n from routines where user_id = ${userId}
    `;
    if ((count[0]?.n ?? 0) === 0) {
      for (const r of DEFAULT_ROUTINES) {
        await sql`
          insert into routines (user_id, title, category, weekdays, time_of_day, estimated_minutes)
          values (
            ${userId},
            ${r.title},
            ${r.category},
            ${r.weekdays},
            ${r.timeOfDay},
            ${r.estimatedMinutes}
          )
        `;
      }
    }
    await sql`update profiles set seeded = true where user_id = ${userId}`;
  }

  const weekday = String(weekdayOf(date));
  const routines = await sql<{
    id: number;
    title: string;
    category: string;
    weekdays: string;
    time_of_day: string;
    estimated_minutes: number;
  }>`
    select id, title, category, weekdays, time_of_day, estimated_minutes
    from routines
    where user_id = ${userId} and active = true
  `;

  for (const r of routines) {
    const days = `,${r.weekdays},`;
    if (!days.includes(`,${weekday},`)) continue;
    const already = await sql<{ id: number }>`
      select id from tasks
      where user_id = ${userId} and routine_id = ${r.id} and due_date = ${date}::date
      limit 1
    `;
    if (already.length > 0) continue;
    await sql`
      insert into tasks (
        user_id, routine_id, title, category, due_date, time_of_day, estimated_minutes
      ) values (
        ${userId}, ${r.id}, ${r.title}, ${r.category}, ${date}::date, ${r.time_of_day}, ${r.estimated_minutes}
      )
    `;
  }
}

export const loadToday = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { date: string }) => ({ date: isoDate(input.date) }))
  .handler(async ({ context, data }) => {
    await ensureSeeded(context.userId, data.date);
    const sql = await getSql();
    const tasks = await sql<TaskRow>`
      select
        id,
        routine_id,
        title,
        category,
        due_date::text as due_date,
        time_of_day,
        estimated_minutes,
        notes,
        done,
        done_at::text as done_at
      from tasks
      where user_id = ${context.userId} and due_date = ${data.date}::date
      order by
        case time_of_day when 'morning' then 0 when 'afternoon' then 1 else 2 end,
        id
    `;
    const stats = await computeStats(context.userId, data.date, tasks);
    return { tasks, stats };
  });

async function computeStats(
  userId: string,
  date: string,
  todayTasks: TaskRow[],
): Promise<DayStats> {
  const sql = await getSql();
  const total = todayTasks.length;
  const done = todayTasks.filter((t) => t.done).length;
  const minutesLeft = todayTasks
    .filter((t) => !t.done)
    .reduce((sum, t) => sum + t.estimated_minutes, 0);

  const weekStart = (() => {
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    dt.setDate(dt.getDate() - dt.getDay());
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  })();

  const weekRows = await sql<{ due_date: string; total: number; done: number }>`
    select
      due_date::text as due_date,
      count(*)::int as total,
      count(*) filter (where done)::int as done
    from tasks
    where user_id = ${userId}
      and due_date >= ${weekStart}::date
      and due_date <= ${date}::date
    group by due_date
  `;
  const weekDoneDays = weekRows.filter((r) => r.done > 0).length;

  const history = await sql<{ due_date: string; total: number; done: number }>`
    select
      due_date::text as due_date,
      count(*)::int as total,
      count(*) filter (where done)::int as done
    from tasks
    where user_id = ${userId} and due_date <= ${date}::date
    group by due_date
    order by due_date desc
    limit 30
  `;

  let streak = 0;
  for (const row of history) {
    if (row.total === 0) continue;
    if (row.done === 0) break;
    streak += 1;
  }

  return { total, done, minutesLeft, streak, weekDoneDays };
}

export const toggleTask = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; done: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.done) {
      await sql`
        update tasks
        set done = true, done_at = now()
        where id = ${data.id} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        update tasks
        set done = false, done_at = null
        where id = ${data.id} and user_id = ${context.userId}
      `;
    }
    return { ok: true as const };
  });

export const addTask = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    title: string;
    category: string;
    date: string;
    timeOfDay?: string;
    estimatedMinutes?: number;
  }) => {
    const title = input.title.trim().slice(0, 120);
    if (!title) throw new Error("Title is required");
    const category = isCategoryId(input.category) ? input.category : "other";
    const timeOfDay = input.timeOfDay && isTimeOfDay(input.timeOfDay)
      ? input.timeOfDay
      : "morning";
    return {
      title,
      category,
      date: isoDate(input.date),
      timeOfDay,
      estimatedMinutes: Math.min(Math.max(input.estimatedMinutes ?? 15, 5), 180),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      insert into tasks (
        user_id, title, category, due_date, time_of_day, estimated_minutes
      ) values (
        ${context.userId}, ${data.title}, ${data.category}, ${data.date}::date,
        ${data.timeOfDay}, ${data.estimatedMinutes}
      )
      returning id
    `;
    return { id: rows[0]?.id ?? 0 };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from tasks where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const listWeek = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { start: string }) => ({ start: isoDate(input.start) }))
  .handler(async ({ context, data }) => {
    const start = data.start;
    const [y, m, d] = start.split("-").map(Number);
    const endDate = new Date(y, (m ?? 1) - 1, (d ?? 1) + 6);
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    await ensureSeeded(context.userId, start);
    const sql = await getSql();
    for (let i = 0; i < 7; i++) {
      const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + i);
      const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      await ensureSeeded(context.userId, iso);
    }

    const tasks = await sql<TaskRow>`
      select
        id,
        routine_id,
        title,
        category,
        due_date::text as due_date,
        time_of_day,
        estimated_minutes,
        notes,
        done,
        done_at::text as done_at
      from tasks
      where user_id = ${context.userId}
        and due_date >= ${start}::date
        and due_date <= ${end}::date
      order by due_date, id
    `;
    return { start, end, tasks };
  });

export const listRoutines = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<RoutineRow>`
      select id, title, category, weekdays, time_of_day, estimated_minutes, notes, active
      from routines
      where user_id = ${context.userId}
      order by
        case time_of_day when 'morning' then 0 when 'afternoon' then 1 else 2 end,
        id
    `;
  });

export const saveRoutine = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    id?: number;
    title: string;
    category: string;
    weekdays: string;
    timeOfDay: string;
    estimatedMinutes: number;
    active: boolean;
  }) => {
    const title = input.title.trim().slice(0, 120);
    if (!title) throw new Error("Title is required");
    const weekdays = input.weekdays
      .split(",")
      .map((w) => w.trim())
      .filter((w) => /^[0-6]$/.test(w))
      .join(",");
    if (!weekdays) throw new Error("Pick at least one day");
    return {
      id: input.id,
      title,
      category: isCategoryId(input.category) ? input.category : "other",
      weekdays,
      timeOfDay: isTimeOfDay(input.timeOfDay) ? input.timeOfDay : "morning",
      estimatedMinutes: Math.min(Math.max(input.estimatedMinutes, 5), 180),
      active: Boolean(input.active),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.id) {
      await sql`
        update routines
        set
          title = ${data.title},
          category = ${data.category},
          weekdays = ${data.weekdays},
          time_of_day = ${data.timeOfDay},
          estimated_minutes = ${data.estimatedMinutes},
          active = ${data.active}
        where id = ${data.id} and user_id = ${context.userId}
      `;
      return { id: data.id };
    }
    const rows = await sql<{ id: number }>`
      insert into routines (
        user_id, title, category, weekdays, time_of_day, estimated_minutes, active
      ) values (
        ${context.userId}, ${data.title}, ${data.category}, ${data.weekdays},
        ${data.timeOfDay}, ${data.estimatedMinutes}, ${data.active}
      )
      returning id
    `;
    return { id: rows[0]?.id ?? 0 };
  });

export const deleteRoutine = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from routines where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });
