import { useState, type FormEvent } from "react";
import { CATEGORIES, TIMES_OF_DAY } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddTaskDialog({
  date,
  onAdd,
}: {
  date: string;
  onAdd: (input: {
    title: string;
    category: string;
    date: string;
    timeOfDay: string;
    estimatedMinutes: number;
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [timeOfDay, setTimeOfDay] = useState("morning");
  const [minutes, setMinutes] = useState(15);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onAdd({
        title: title.trim(),
        category,
        date,
        timeOfDay,
        estimatedMinutes: minutes,
      });
      setTitle("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>One thing for today. Keep the title short.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">What</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Wipe the kitchen top"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-category">Kind</Label>
            <select
              id="task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-md border border-input bg-card px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="task-when">When</Label>
              <select
                id="task-when"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="h-11 rounded-md border border-input bg-card px-3 text-sm"
              >
                {TIMES_OF_DAY.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-mins">Minutes</Label>
              <Input
                id="task-mins"
                type="number"
                min={5}
                max={180}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || !title.trim()}>
              {busy ? "Adding…" : "Add to today"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
