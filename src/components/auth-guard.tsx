import type { ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/app-shell";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <AppShell>
        <Skeleton className="mb-4 h-10 w-48" />
        <Skeleton className="h-40" />
      </AppShell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <>{children}</>;
}
