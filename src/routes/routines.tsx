import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { RoutinesView } from "@/components/routines-view";

export const Route = createFileRoute("/routines")({ component: RoutinesPage });

function RoutinesPage() {
  return (
    <AuthGuard>
      <RoutinesView />
    </AuthGuard>
  );
}
