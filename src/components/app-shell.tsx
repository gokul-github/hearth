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
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-24 pt-3 md:px-6 md:pb-10">
      <header className="sticky top-0 z-30 -mx-4 mb-6 flex items-center justify-between gap-3 bg-background/75 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground no-underline transition-[opacity,transform] duration-[var(--motion-quick)] hover:opacity-80 active:scale-[0.96]"
        >
          <HearthMark className="size-8" />
          <span className="font-display text-xl font-medium tracking-tight">Hearth</span>
        </Link>
        <nav className="hidden items-center gap-0.5 rounded-full bg-muted/70 p-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground no-underline transition-[color,background-color,box-shadow,transform] duration-[var(--motion-quick)] ease-[var(--ease-smooth-out)] hover:text-foreground [&.active]:bg-card [&.active]:text-foreground [&.active]:shadow-[var(--shadow-border)]"
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
      <div className="page-stack flex-1">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-4">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex min-h-14 flex-col items-center justify-center gap-1 text-muted-foreground no-underline transition-colors duration-[var(--motion-quick)] [&.active]:text-primary [&.active_svg]:scale-110"
                activeOptions={{ exact: item.to === "/" }}
              >
                <item.icon
                  className="size-5 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)] group-[&.active]:scale-110"
                  strokeWidth={1.75}
                />
                <span className="text-xs font-medium">{item.label}</span>
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
    <div className={cn("mb-7 flex items-end justify-between gap-3")}>
      <div>
        {kicker ? (
          <p className="mb-1 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display text-3xl leading-tight font-medium tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
