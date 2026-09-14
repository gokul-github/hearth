import { alexaSkillId } from "./config.ts";
import { completeByPhrase, listTodaySpeech } from "./chores.ts";
import { userIdFromAccessToken } from "./oauth.ts";

type Slot = { name?: string; value?: string };
type Intent = { name?: string; slots?: Record<string, Slot> };

export type AlexaEnvelope = {
  session?: { application?: { applicationId?: string }; user?: { accessToken?: string } };
  context?: {
    System?: {
      application?: { applicationId?: string };
      user?: { accessToken?: string };
      person?: { accessToken?: string };
    };
  };
  request?: {
    type?: string;
    intent?: Intent;
    timestamp?: string;
  };
};

type AlexaResponse = {
  version: "1.0";
  response: {
    outputSpeech: { type: "PlainText"; text: string };
    shouldEndSession: boolean;
    reprompt?: { outputSpeech: { type: "PlainText"; text: string } };
    card?: { type: "LinkAccount" } | { type: "Simple"; title: string; content: string };
  };
};

function speak(
  text: string,
  end = true,
  card?: AlexaResponse["response"]["card"],
  reprompt?: string,
): AlexaResponse {
  return {
    version: "1.0",
    response: {
      outputSpeech: { type: "PlainText", text },
      shouldEndSession: end,
      ...(card ? { card } : {}),
      ...(!end
        ? { reprompt: { outputSpeech: { type: "PlainText", text: reprompt ?? text } } }
        : {}),
    },
  };
}

function applicationId(body: AlexaEnvelope): string | undefined {
  return body.context?.System?.application?.applicationId ?? body.session?.application?.applicationId;
}

function accessToken(body: AlexaEnvelope): string | undefined {
  return (
    body.context?.System?.person?.accessToken ??
    body.context?.System?.user?.accessToken ??
    body.session?.user?.accessToken
  );
}

function slotValue(intent: Intent | undefined, name: string): string {
  return (intent?.slots?.[name]?.value ?? "").trim();
}

function linkPrompt(): AlexaResponse {
  return speak(
    "Link your Hearth account in the Alexa app first, then ask me again.",
    true,
    { type: "LinkAccount" },
  );
}

export async function handleAlexaEnvelope(body: AlexaEnvelope): Promise<AlexaResponse> {
  const expected = alexaSkillId();
  const got = applicationId(body);
  if (expected && got !== expected) {
    return speak("This skill is not configured for that application.");
  }

  const type = body.request?.type ?? "";
  if (type === "SessionEndedRequest") {
    return speak("Goodbye.");
  }

  const userId = await userIdFromAccessToken(accessToken(body));
  if (!userId) return linkPrompt();

  if (type === "LaunchRequest") {
    const { speech } = await listTodaySpeech(userId, true);
    return speak(`Hearth is here. ${speech} You can say, mark cooking done.`, false);
  }

  const intent = body.request?.intent;
  const name = intent?.name ?? "";

  if (name === "AMAZON.HelpIntent") {
    return speak(
      "You can say: mark cooking done, I finished laundry, what's left today, or what's on my list.",
      false,
    );
  }
  if (name === "AMAZON.CancelIntent" || name === "AMAZON.StopIntent") {
    return speak("Okay.");
  }
  if (name === "AMAZON.FallbackIntent") {
    return speak("I can check off a chore or read today's list. Try: mark cooking done.", false);
  }

  if (name === "CompleteChoreIntent") {
    const chore = slotValue(intent, "chore");
    if (!chore) {
      return speak("Which chore should I mark done?", false, undefined, "Say a chore, like cooking or laundry.");
    }
    const { speech, keepOpen } = await completeByPhrase(userId, chore);
    return speak(speech, !keepOpen, undefined, keepOpen ? "Which chore?" : undefined);
  }

  if (name === "ListTodayIntent") {
    const { speech } = await listTodaySpeech(userId, false);
    return speak(speech);
  }

  if (name === "WhatsLeftIntent") {
    const { speech } = await listTodaySpeech(userId, true);
    return speak(speech);
  }

  return speak("I can mark a chore done, or read today's list.", false);
}
