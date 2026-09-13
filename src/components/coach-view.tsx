import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUp } from "lucide-react";
import {
  getCoachStatus,
  listCoachMessages,
  sendCoachMessage,
  type CoachMessage,
} from "@/lib/coach";
import { todayISO } from "@/lib/utils";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const PROMPTS = [
  "Plan my day from what's still open.",
  "Give me a gentle 20-minute home workout.",
  "What's a simple dinner I can cook tonight?",
  "How should I clean the kitchen counters?",
  "I'm tired. What can wait until tomorrow?",
];

export function CoachView() {
  const date = todayISO();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCoachMessages(), getCoachStatus()])
      .then(([rows, status]) => {
        if (cancelled) return;
        setMessages(rows);
        setAvailable(status.available);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load the coach.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setText("");
    const optimistic: CoachMessage = {
      id: Date.now(),
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await sendCoachMessage({ data: { message: trimmed, date } });
      const rows = await listCoachMessages();
      setMessages(rows);
    } catch {
      toast.error("The coach did not answer. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeading kicker="Ask when you need it" title="Coach" />
      {!available ? (
        <Card className="mb-4 p-4 text-sm text-muted-foreground">
          AI features are unavailable in this environment. Your list still works.
        </Card>
      ) : null}

      {loading ? (
        <div className="grid gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-4">
          {messages.length === 0 ? (
            <Card className="p-5">
              <p className="font-display text-xl">A quiet extra pair of hands.</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ask for a plan, a workout, a dinner idea, or how to do a chore.
                The coach can also add tasks to today when you ask it to.
              </p>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`max-w-[42rem] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground shadow-[var(--shadow-border)]"
                  }`}
                >
                  {m.content}
                </li>
              ))}
            </ul>
          )}
          {busy ? (
            <p className="text-sm text-muted-foreground">Thinking…</p>
          ) : null}
          <div ref={bottom} />

          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={busy || !available}
                onClick={() => send(p)}
                className="rounded-full bg-card px-3 py-2 text-left text-xs text-muted-foreground shadow-[var(--shadow-border)] transition-colors hover:text-foreground disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(text);
            }}
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask about the house, a workout, or dinner…"
              className="min-h-14 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(text);
                }
              }}
              disabled={!available}
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !text.trim() || !available}
              aria-label="Send"
            >
              <ArrowUp />
            </Button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
