import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, House, ListChecks, MessageCircle } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";
import { HearthMark } from "@/components/hearth-mark";

const NAV = [
  { to: "/", label: "Today", icon: House },
  { to: "/week", label: "Week", icon: CalendarDays },
  { to: "/routines", label: "Routines", icon: ListChecks },
  { to: "/coach", label: "Coach", icon: MessageCircle },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-24 pt-4 md:px-6 md:pb-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 text-foreground no-underline">
          <HearthMark className="size-8" />
          <span className="font-display text-xl font-medium tracking-tight">Hearth</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="min-h-11 min-w-11">
          {isPending ? (
            <div className="size-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <UserButton />
          ) : null}
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <ul className="grid grid-cols-4">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex min-h-14 flex-col items-center justify-center gap-1 text-muted-foreground no-underline [&.active]:text-primary"
                activeOptions={{ exact: item.to === "/" }}
              >
                <item.icon className="size-5" strokeWidth={1.75} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeading({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-3")}>
      <div>
        {kicker ? (
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
