import { createFileRoute } from "@tanstack/react-router";
import {
  assertAlexaClient,
  exchangeAuthorizationCode,
  exchangeRefreshToken,
  parseBasicClient,
} from "@/lib/alexa/oauth";

export const Route = createFileRoute("/api/alexa/oauth/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const basic = parseBasicClient(request.headers.get("authorization"));
        const clientId = String(form.get("client_id") ?? basic?.id ?? "");
        const clientSecret = String(form.get("client_secret") ?? basic?.secret ?? "");
        if (!assertAlexaClient(clientId, clientSecret)) {
          return Response.json({ error: "invalid_client" }, { status: 401 });
        }
        const grant = String(form.get("grant_type") ?? "");
        try {
          if (grant === "authorization_code") {
            const tokens = await exchangeAuthorizationCode({
              code: String(form.get("code") ?? ""),
              clientId,
              redirectUri: String(form.get("redirect_uri") ?? ""),
              codeVerifier: String(form.get("code_verifier") ?? "") || undefined,
            });
            return Response.json(tokens);
          }
          if (grant === "refresh_token") {
            const tokens = await exchangeRefreshToken({
              refreshToken: String(form.get("refresh_token") ?? ""),
              clientId,
            });
            return Response.json(tokens);
          }
          return Response.json({ error: "unsupported_grant_type" }, { status: 400 });
        } catch {
          return Response.json({ error: "invalid_grant" }, { status: 400 });
        }
      },
    },
  },
});
