import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell, PageHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { HearthMark } from "@/components/hearth-mark";
import { Skeleton } from "@/components/ui/skeleton";

type LinkSearch = {
  client_id?: string;
  redirect_uri?: string;
  state?: string;
  response_type?: string;
  scope?: string;
  code_challenge?: string;
  code_challenge_method?: string;
};

function callbackFromSearch(search: LinkSearch): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value) q.set(key, value);
  }
  const encoded = q.toString();
  return encoded ? `/alexa/link?${encoded}` : "/alexa/link";
}

export const Route = createFileRoute("/alexa/link")({
  validateSearch: (search: Record<string, unknown>): LinkSearch => ({
    client_id: typeof search.client_id === "string" ? search.client_id : undefined,
    redirect_uri: typeof search.redirect_uri === "string" ? search.redirect_uri : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    response_type: typeof search.response_type === "string" ? search.response_type : undefined,
    scope: typeof search.scope === "string" ? search.scope : undefined,
    code_challenge: typeof search.code_challenge === "string" ? search.code_challenge : undefined,
    code_challenge_method:
      typeof search.code_challenge_method === "string" ? search.code_challenge_method : undefined,
  }),
  component: AlexaLinkPage,
});

function AlexaLinkPage() {
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <AppShell>
        <Skeleton className="mb-4 h-10 w-48" />
        <Skeleton className="h-40" />
      </AppShell>
    );
  }
  if (!user) {
    return <Navigate to="/login" search={{ callbackURL: callbackFromSearch(search) }} />;
  }

  return (
    <AppShell>
      <PageHeading kicker="Alexa" title="Link your Echo" />
      <div className="mx-auto max-w-md rounded-xl bg-card p-6 shadow-[var(--shadow-border)]">
        <div className="mb-4 flex items-center gap-2">
          <HearthMark />
          <p className="font-display text-lg">Allow Alexa to update Hearth?</p>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Alexa will be able to read today's checklist and mark chores done when
          you say things like “ask Hearth to mark cooking done.” It cannot change
          your password or see other accounts.
        </p>
        <form method="post" action="/api/alexa/oauth/authorize" className="flex gap-2">
          <input type="hidden" name="client_id" value={search.client_id ?? ""} />
          <input type="hidden" name="redirect_uri" value={search.redirect_uri ?? ""} />
          <input type="hidden" name="state" value={search.state ?? ""} />
          <input type="hidden" name="code_challenge" value={search.code_challenge ?? ""} />
          <input type="hidden" name="code_challenge_method" value={search.code_challenge_method ?? ""} />
          <Button type="submit" name="allow" value="1">
            Allow
          </Button>
          <Button type="submit" name="allow" value="0" variant="outline">
            Deny
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
