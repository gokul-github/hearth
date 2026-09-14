import { useState, type FormEvent } from "react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HearthMark } from "@/components/hearth-mark";

function safeCallbackURL(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function goAfterAuth(next: string) {
  window.location.assign(next);
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    callbackURL: safeCallbackURL(search.callbackURL),
  }),
  component: Login,
});

function Login() {
  const { user, isPending } = useCurrentUserState();
  const { callbackURL } = Route.useSearch();

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
      </main>
    );
  }
  if (user) {
    if (callbackURL !== "/") {
      goAfterAuth(callbackURL);
      return (
        <main className="grid min-h-dvh place-items-center px-4">
          <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
        </main>
      );
    }
    return <Navigate to="/" />;
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-foreground no-underline transition-opacity duration-[var(--motion-quick)] hover:opacity-80">
          <HearthMark />
          <span className="font-display text-2xl font-medium">Hearth</span>
        </Link>
        <div className="reveal rounded-2xl bg-card p-6 shadow-[var(--shadow-border)]">
          <h1 className="font-display text-2xl font-medium">Welcome in</h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Your chores stay on your account, on any device.
          </p>
          {callbackURL.startsWith("/alexa/link") ? (
            <p className="mb-5 rounded-md bg-muted px-3 py-2 text-sm leading-relaxed text-muted-foreground">
              Linking Alexa. Email and password work inside the Alexa app (it
              cannot open sign-in pop-ups). After you sign in you will be asked
              to allow the Echo to update today.
            </p>
          ) : null}
          {authEnabled ? (
            <>
              <Tabs defaultValue="signin">
                <TabsList className="w-full">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <EmailForm mode="signin" callbackURL={callbackURL} />
                </TabsContent>
                <TabsContent value="signup">
                  <EmailForm mode="signup" callbackURL={callbackURL} />
                </TabsContent>
              </Tabs>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="outline"
                    onClick={() => signIn(p.providerId, { callbackURL })}
                  >
                    Continue with {p.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
          )}
        </div>
      </div>
    </main>
  );
}

function EmailForm({ mode, callbackURL }: { mode: "signin" | "signup"; callbackURL: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Home",
        });
        if (err) throw new Error(err.message || "Could not create the account");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message || "Could not sign in");
      }
      await authClient.getSession();
      goAfterAuth(callbackURL);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      {mode === "signup" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Your name"
          />
        </div>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@home.example"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
