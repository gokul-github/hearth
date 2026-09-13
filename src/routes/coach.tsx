import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { CoachView } from "@/components/coach-view";

export const Route = createFileRoute("/coach")({ component: CoachPage });

function CoachPage() {
  return (
    <AuthGuard>
      <CoachView />
    </AuthGuard>
  );
}
