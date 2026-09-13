import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { WeekView } from "@/components/week-view";

export const Route = createFileRoute("/week")({ component: WeekPage });

function WeekPage() {
  return (
    <AuthGuard>
      <WeekView />
    </AuthGuard>
  );
}
