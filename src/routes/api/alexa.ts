import { createFileRoute } from "@tanstack/react-router";
import { handleAlexaEnvelope, type AlexaEnvelope } from "@/lib/alexa/skill";
import { verifyAlexaSignature } from "@/lib/alexa/verify";

export const Route = createFileRoute("/api/alexa")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bodyText = await request.text();
        const ok = await verifyAlexaSignature(request, bodyText);
        if (!ok) {
          return new Response("Unauthorized", { status: 400 });
        }
        let envelope: AlexaEnvelope;
        try {
          envelope = JSON.parse(bodyText) as AlexaEnvelope;
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }
        const response = await handleAlexaEnvelope(envelope);
        return Response.json(response);
      },
    },
  },
});
