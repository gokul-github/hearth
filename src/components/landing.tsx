import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import {
  Brush,
  ChefHat,
  Dumbbell,
  Droplets,
  MessageCircle,
  Shirt,
  CalendarCheck,
  House,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HearthMark } from "@/components/hearth-mark";

const CHORES = [
  { icon: Dumbbell, label: "Gym" },
  { icon: Droplets, label: "Bathing" },
  { icon: Brush, label: "Cleaning" },
  { icon: ChefHat, label: "Cooking" },
  { icon: Shirt, label: "Laundry" },
  { icon: UtensilsCrossed, label: "Kitchen" },
];

export function Landing() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-6 md:px-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HearthMark />
          <span className="font-display text-xl font-medium">Hearth</span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <main className="flex flex-1 flex-col justify-center py-12 md:py-16">
        <p className="mb-4 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Household companion
        </p>
        <h1 className="max-w-xl font-display text-4xl leading-[1.12] font-medium tracking-tight text-foreground md:text-6xl">
          Keep house without keeping it all in your head.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
          Hearth tracks the small daily work — gym, shower, cooking, laundry,
          kitchen counters — and a calm AI coach helps you plan the day when
          you ask.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/login">Create your account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">I already have one</Link>
          </Button>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {CHORES.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 rounded-lg bg-card px-3 py-3 shadow-[var(--shadow-border)]"
            >
              <item.icon className="size-4 text-primary" strokeWidth={1.75} />
              <span className="text-sm font-medium">{item.label}</span>
            </li>
          ))}
        </ul>
      </main>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <Feature
          icon={House}
          title="Today, not forever"
          body="A short list for this morning, afternoon, and evening. Check things off. That is enough."
        />
        <Feature
          icon={CalendarCheck}
          title="Routines that repeat"
          body="Laundry on Tuesday. Workout on Monday. Hearth writes today's copy so you do not have to."
        />
        <Feature
          icon={MessageCircle}
          title="Ask the coach"
          body="Plan the day, break down a chore, or get a simple dinner idea. You press send — it never chats uninvited."
        />
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
      <Icon className="mb-3 size-5 text-primary" strokeWidth={1.75} />
      <h2 className="font-display text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}
