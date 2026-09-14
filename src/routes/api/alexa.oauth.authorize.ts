import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth/verify.server";
import { alexaClientId, isAllowedAlexaRedirect } from "@/lib/alexa/config";
import { issueAuthorizationCode } from "@/lib/alexa/oauth";

function loginRedirect(request: Request): Response {
  const next = `/alexa/link${new URL(request.url).search}`;
  const dest = new URL("/login", request.url);
  dest.searchParams.set("callbackURL", next);
  return Response.redirect(dest, 302);
}

export const Route = createFileRoute("/api/alexa/oauth/authorize")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams;
        const clientId = q.get("client_id") ?? "";
        const redirectUri = q.get("redirect_uri") ?? "";
        const responseType = q.get("response_type") ?? "";
        const method = q.get("code_challenge_method") ?? "";
        if (responseType !== "code" || clientId !== alexaClientId() || !isAllowedAlexaRedirect(redirectUri)) {
          return new Response("invalid_request", { status: 400 });
        }
        if (method && method !== "S256" && method !== "plain") {
          return new Response("invalid_request", { status: 400 });
        }
        const user = await getSessionUser();
        if (!user) return loginRedirect(request);
        const link = new URL("/alexa/link", request.url);
        link.search = q.toString();
        return Response.redirect(link, 302);
      },
      POST: async ({ request }) => {
        const form = await request.formData();
        const clientId = String(form.get("client_id") ?? "");
        const redirectUri = String(form.get("redirect_uri") ?? "");
        const state = String(form.get("state") ?? "");
        const codeChallenge = String(form.get("code_challenge") ?? "");
        const codeChallengeMethod = String(form.get("code_challenge_method") ?? "");
        const allow = String(form.get("allow") ?? "") === "1";
        if (!allow) {
          if (!isAllowedAlexaRedirect(redirectUri)) {
            return new Response("invalid_request", { status: 400 });
          }
          const denied = new URL(redirectUri);
          denied.searchParams.set("error", "access_denied");
          if (state) denied.searchParams.set("state", state);
          return Response.redirect(denied, 302);
        }
        const user = await getSessionUser();
        if (!user) return loginRedirect(request);
        try {
          const code = await issueAuthorizationCode({
            userId: user.id,
            clientId,
            redirectUri,
            codeChallenge: codeChallenge || undefined,
            codeChallengeMethod: codeChallengeMethod || undefined,
          });
          const dest = new URL(redirectUri);
          dest.searchParams.set("code", code);
          if (state) dest.searchParams.set("state", state);
          return Response.redirect(dest, 302);
        } catch {
          return new Response("invalid_request", { status: 400 });
        }
      },
    },
  },
});
