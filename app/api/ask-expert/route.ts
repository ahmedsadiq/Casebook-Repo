import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
const MAX_MESSAGES = 20;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CaseContext = {
  caseId?: string;
  title?: string;
  status?: string;
  court?: string;
  nextHearingDate?: string;
};

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((message): message is { role: unknown; content: unknown } => !!message && typeof message === "object")
    .map((message) => {
      const role: ChatMessage["role"] = message.role === "assistant" ? "assistant" : "user";
      return {
        role,
        content: typeof message.content === "string" ? message.content.trim() : "",
      };
    })
    .filter((message) => message.content.length > 0)
    .slice(-MAX_MESSAGES);
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API is not configured. Add ANTHROPIC_API_KEY to your environment." },
        { status: 500 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "advocate") {
      return NextResponse.json({ error: "Only advocates can use Ask an Expert." }, { status: 403 });
    }

    const body = await req.json();
    const messages = normalizeMessages(body?.messages);
    const caseContext = (body?.caseContext ?? null) as CaseContext | null;

    if (!messages.length) {
      return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
    }

    const systemPrompt =
      "You are Casebook Ask an Expert, a sharp senior litigation-support and legal workflow assistant for advocates using a legal case management app. " +
      "Be practical, structured, and commercially useful. Help with hearing preparation, case strategy thinking, issue spotting, client-update drafting, risk summaries, and document review checklists. " +
      "Prefer concise sections such as Key Issues, Risks, Suggested Next Steps, and Draft Language when helpful. " +
      "If the user asks for communication text, provide polished, ready-to-use drafts. " +
      "If the answer depends on jurisdiction-specific law or missing facts, say that clearly and identify what should be verified. " +
      "Do not claim to be a lawyer, do not invent facts, and do not overstate certainty.";

    const enrichedMessages = caseContext?.title
      ? [
          {
            role: "user" as const,
            content: [
              "Case context for this conversation:",
              `Case ID: ${caseContext.caseId ?? "N/A"}`,
              `Title: ${caseContext.title}`,
              caseContext.status ? `Status: ${caseContext.status}` : null,
              caseContext.court ? `Court: ${caseContext.court}` : null,
              caseContext.nextHearingDate ? `Next hearing date: ${caseContext.nextHearingDate}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
          },
          ...messages,
        ]
      : messages;

    const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: enrichedMessages,
      }),
    });

    const anthropicJson = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      const errorMessage =
        anthropicJson?.error?.message ||
        anthropicJson?.message ||
        "Anthropic request failed.";

      return NextResponse.json({ error: errorMessage }, { status: anthropicResponse.status });
    }

    const reply = Array.isArray(anthropicJson?.content)
      ? anthropicJson.content
          .filter((item: { type?: string; text?: string }) => item?.type === "text" && typeof item.text === "string")
          .map((item: { text: string }) => item.text)
          .join("\n\n")
          .trim()
      : "";

    if (!reply) {
      return NextResponse.json({ error: "Claude returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({
      reply,
      model: anthropicJson.model,
      usage: anthropicJson.usage ?? null,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to contact Ask an Expert." },
      { status: 500 }
    );
  }
}
