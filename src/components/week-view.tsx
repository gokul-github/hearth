import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listWeek, toggleTask, type TaskRow } from "@/lib/household";
import { addDaysISO, startOfWeekISO, todayISO } from "@/lib/utils";
import { WEEKDAY_LABELS, categoryLabel } from "@/lib/categories";
import { AppShell, PageHeading } from "@/components/app-shell";
import { CategoryIcon } from "@/components/category-icon";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

export function WeekView() {
  const today = todayISO();
  const start = startOfWeekISO(today);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysISO(start, i)),
    [start],
  );
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await listWeek({ data: { start } });
    setTasks(data.tasks);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listWeek({ data: { start } })
      .then((data) => {
        if (!cancelled) setTasks(data.tasks);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load the week.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [start]);

  return (
    <AppShell>
      <PageHeading kicker="This week" title="Seven quiet days" />
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {days.map((d) => (
            <Skeleton key={d} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {days.map((date, index) => {
            const items = tasks.filter((t) => t.due_date === date);
            const done = items.filter((t) => t.done).length;
            const isToday = date === today;
            return (
              <Card key={date} className={`p-4 ${isToday ? "ring-1 ring-primary/30" : ""}`}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-medium">
                    {WEEKDAY_LABELS[index]}
                    {isToday ? (
                      <span className="ml-2 text-xs font-medium tracking-wide text-primary uppercase">
                        Today
                      </span>
                    ) : null}
                  </h2>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {done}/{items.length}
                  </p>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Rest day on the list.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {items.map((task) => (
                      <li key={task.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={task.done}
                          onCheckedChange={async (v) => {
                            const next = v === true;
                            setTasks((prev) =>
                              prev.map((t) => (t.id === task.id ? { ...t, done: next } : t)),
                            );
                            try {
                              await toggleTask({ data: { id: task.id, done: next } });
                              await refresh();
                            } catch {
                              toast.error("Could not update that task.");
                              await refresh();
                            }
                          }}
                          aria-label={task.title}
                        />
                        <CategoryIcon category={task.category} className="size-3.5 shrink-0 text-muted-foreground" />
                        <span
                          className={`min-w-0 truncate text-sm ${task.done ? "text-muted-foreground line-through" : ""}`}
                        >
                          {task.title}
                        </span>
                        <span className="sr-only">{categoryLabel(task.category)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
