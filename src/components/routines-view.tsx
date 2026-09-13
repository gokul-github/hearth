import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  deleteRoutine,
  listRoutines,
  saveRoutine,
  type RoutineRow,
} from "@/lib/household";
import { CATEGORIES, TIMES_OF_DAY, WEEKDAY_LABELS, categoryLabel } from "@/lib/categories";
import { AppShell, PageHeading } from "@/components/app-shell";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Draft = {
  id?: number;
  title: string;
  category: string;
  weekdays: string[];
  timeOfDay: string;
  estimatedMinutes: number;
  active: boolean;
};

const EMPTY: Draft = {
  title: "",
  category: "cleaning",
  weekdays: ["1", "3", "5"],
  timeOfDay: "morning",
  estimatedMinutes: 15,
  active: true,
};

export function RoutinesView() {
  const [rows, setRows] = useState<RoutineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await listRoutines();
    setRows(data);
  }

  useEffect(() => {
    let cancelled = false;
    listRoutines()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load routines.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function edit(row: RoutineRow) {
    setDraft({
      id: row.id,
      title: row.title,
      category: row.category,
      weekdays: row.weekdays.split(",").filter(Boolean),
      timeOfDay: row.time_of_day,
      estimatedMinutes: row.estimated_minutes,
      active: row.active,
    });
    setOpen(true);
  }

  async function submit() {
    if (!draft.title.trim() || draft.weekdays.length === 0) return;
    setBusy(true);
    try {
      await saveRoutine({
        data: {
          id: draft.id,
          title: draft.title,
          category: draft.category,
          weekdays: draft.weekdays.join(","),
          timeOfDay: draft.timeOfDay,
          estimatedMinutes: draft.estimatedMinutes,
          active: draft.active,
        },
      });
      setOpen(false);
      setDraft(EMPTY);
      await refresh();
      toast.success("Routine saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeading
        kicker="Repeating work"
        title="Routines"
        action={
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) setDraft(EMPTY);
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setDraft(EMPTY);
                  setOpen(true);
                }}
              >
                New routine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{draft.id ? "Edit routine" : "New routine"}</DialogTitle>
                <DialogDescription>
                  Hearth copies this onto matching days so you do not retype it.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="r-title">Name</Label>
                  <Input
                    id="r-title"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Wipe kitchen counters"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="r-cat">Kind</Label>
                    <select
                      id="r-cat"
                      className="h-11 rounded-md border border-input bg-card px-3 text-sm"
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="r-time">Time of day</Label>
                    <select
                      id="r-time"
                      className="h-11 rounded-md border border-input bg-card px-3 text-sm"
                      value={draft.timeOfDay}
                      onChange={(e) => setDraft({ ...draft, timeOfDay: e.target.value })}
                    >
                      {TIMES_OF_DAY.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Days</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAY_LABELS.map((label, i) => {
                      const key = String(i);
                      const on = draft.weekdays.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              weekdays: on
                                ? draft.weekdays.filter((d) => d !== key)
                                : [...draft.weekdays, key],
                            })
                          }
                          className={`h-11 min-w-11 rounded-md px-2 text-xs font-medium ${
                            on
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="r-mins">Minutes</Label>
                  <Input
                    id="r-mins"
                    type="number"
                    min={5}
                    max={180}
                    step={5}
                    value={draft.estimatedMinutes}
                    onChange={(e) =>
                      setDraft({ ...draft, estimatedMinutes: Number(e.target.value) })
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  />
                  Active — write it onto matching days
                </label>
              </div>
              <DialogFooter>
                <Button onClick={submit} disabled={busy || !draft.title.trim()}>
                  {busy ? "Saving…" : "Save routine"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="grid gap-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-display text-xl">No routines yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with laundry twice a week, or a daily kitchen wipe.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Card className="flex items-center gap-3 p-4">
                <CategoryIcon category={row.category} className="size-5 text-primary" />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => edit(row)}
                >
                  <p className="truncate text-sm font-medium">{row.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {categoryLabel(row.category)} · {TIMES_OF_DAY.find((t) => t.id === row.time_of_day)?.label} ·{" "}
                    {row.weekdays
                      .split(",")
                      .map((d) => WEEKDAY_LABELS[Number(d)])
                      .join(" ")}{" "}
                    · {row.estimated_minutes}m
                  </p>
                </button>
                {!row.active ? <Badge variant="outline">Paused</Badge> : null}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${row.title}`}
                  onClick={async () => {
                    await deleteRoutine({ data: { id: row.id } });
                    await refresh();
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
