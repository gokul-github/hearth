import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, ListOrdered, Mic, Trash2 } from "lucide-react";
import { addTask, deleteTask, loadToday, toggleTask, type DayStats, type TaskRow } from "@/lib/household";
import { breakdownTask, planMyDay } from "@/lib/coach";
import { TIMES_OF_DAY, categoryLabel } from "@/lib/categories";
import { formatLongDate, todayISO } from "@/lib/utils";
import { AppShell, PageHeading } from "@/components/app-shell";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TodayView() {
  const date = todayISO();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [stats, setStats] = useState<DayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [steps, setSteps] = useState<{ title: string; text: string } | null>(null);
  const [stepsBusy, setStepsBusy] = useState(false);

  async function refresh() {
    const data = await loadToday({ data: { date } });
    setTasks(data.tasks);
    setStats(data.stats);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadToday({ data: { date } })
      .then((data) => {
        if (cancelled) return;
        setTasks(data.tasks);
        setStats(data.stats);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load today.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const grouped = useMemo(() => {
    return TIMES_OF_DAY.map((slot) => ({
      ...slot,
      items: tasks.filter((t) => t.time_of_day === slot.id),
    })).filter((g) => g.items.length > 0);
  }, [tasks]);

  async function onToggle(task: TaskRow, done: boolean) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done } : t)),
    );
    try {
      await toggleTask({ data: { id: task.id, done } });
      await refresh();
    } catch {
      toast.error("Could not update that task.");
      await refresh();
    }
  }

  async function onPlan() {
    setPlanning(true);
    try {
      const result = await planMyDay({ data: { date } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPlan(result.text);
    } catch {
      toast.error("The coach is unavailable right now.");
    } finally {
      setPlanning(false);
    }
  }

  async function onBreakdown(task: TaskRow) {
    setStepsBusy(true);
    setSteps({ title: task.title, text: "Thinking…" });
    try {
      const result = await breakdownTask({
        data: { title: task.title, category: task.category },
      });
      if (!result.ok) {
        setSteps({ title: task.title, text: result.error });
        return;
      }
      setSteps({ title: task.title, text: result.text });
    } catch {
      setSteps({ title: task.title, text: "Could not break this down right now." });
    } finally {
      setStepsBusy(false);
    }
  }

  const pct = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <AppShell>
      <PageHeading
        kicker={formatLongDate(date)}
        title="Today"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onPlan} disabled={planning || loading}>
              {planning ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ListOrdered />
              )}
              Plan my day
            </Button>
            <AddTaskDialog
              date={date}
              onAdd={async (input) => {
                await addTask({ data: input });
                await refresh();
                toast.success("Added to today.");
              }}
            />
          </div>
        }
      />

      {loading ? (
        <TodaySkeleton />
      ) : (
        <>
          <Card className="mb-6 flex items-start gap-3 p-4">
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mic className="size-4" strokeWidth={1.75} />
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              On an Echo: “Alexa, ask Hearth to mark cooking done.” Enable the
              Hearth skill and link this account in the Alexa app.
            </p>
          </Card>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Done"
              value={`${stats?.done ?? 0} / ${stats?.total ?? 0}`}
              hint={`${pct}% of the list`}
              progress={pct}
            />
            <StatCard
              label="Time left"
              value={`${stats?.minutesLeft ?? 0}m`}
              hint="Open tasks, added up"
            />
            <StatCard
              label="Streak"
              value={`${stats?.streak ?? 0}d`}
              hint={`${stats?.weekDoneDays ?? 0} active days this week`}
            />
          </div>

          {plan ? (
            <Card className="mb-6 p-5">
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Today's plan
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{plan}</p>
            </Card>
          ) : null}

          {tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="font-display text-xl">Nothing on the list yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a chore, or turn on a routine so tomorrow writes itself.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-6">
              {grouped.map((group) => (
                <section key={group.id}>
                  <h2 className="mb-3 font-display text-lg font-medium">{group.label}</h2>
                  <ul className="stagger flex flex-col gap-2">
                    {group.items.map((task) => (
                      <li key={task.id}>
                        <TaskRowCard
                          task={task}
                          onToggle={onToggle}
                          onDelete={async () => {
                            await deleteTask({ data: { id: task.id } });
                            await refresh();
                          }}
                          onBreakdown={() => onBreakdown(task)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={!!steps} onOpenChange={(open) => !open && setSteps(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{steps?.title ?? "Steps"}</DialogTitle>
            <DialogDescription>A short way through this chore.</DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {stepsBusy ? "Thinking…" : steps?.text}
          </p>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  progress,
}: {
  label: string;
  value: string;
  hint: string;
  progress?: number;
}) {
  return (
    <Card className="overflow-hidden p-4">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      {typeof progress === "number" ? (
        <Progress value={progress} className="mt-3 h-1.5" />
      ) : null}
    </Card>
  );
}

function TaskRowCard({
  task,
  onToggle,
  onDelete,
  onBreakdown,
}: {
  task: TaskRow;
  onToggle: (task: TaskRow, done: boolean) => void;
  onDelete: () => void;
  onBreakdown: () => void;
}) {
  return (
    <Card
      className={`flex items-center gap-3 p-3 pr-2 transition-[opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)] ${
        task.done ? "opacity-60" : "opacity-100"
      }`}
    >
      <Checkbox
        checked={task.done}
        onCheckedChange={(v) => onToggle(task, v === true)}
        aria-label={`Mark ${task.title} ${task.done ? "not done" : "done"}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium transition-colors duration-[var(--motion-fast)] ${
            task.done ? "text-muted-foreground line-through" : ""
          }`}
        >
          {task.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CategoryIcon category={task.category} className="size-3.5" />
          {categoryLabel(task.category)}
          <span aria-hidden>·</span>
          <span className="tabular-nums">{task.estimated_minutes}m</span>
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onBreakdown} className="hidden sm:inline-flex">
        Steps
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 text-muted-foreground"
        onClick={onDelete}
        aria-label={`Delete ${task.title}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </Card>
  );
}

function TodaySkeleton() {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
    </div>
  );
}
