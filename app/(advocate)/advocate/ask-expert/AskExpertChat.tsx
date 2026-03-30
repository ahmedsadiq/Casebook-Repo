"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CaseContext = {
  caseId: string;
  title: string;
  status?: string;
  court?: string;
  nextHearingDate?: string;
};

const STORAGE_KEY = "casebook.ask_expert.session";
const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Ask me about a case, a hearing, a client update, or a legal workflow issue. I can help you think through it clearly and quickly.",
  },
];

const GENERAL_SUGGESTIONS = [
  "Summarize the key risks in this case.",
  "Help me prepare for the next hearing.",
  "Draft a client update message for this matter.",
  "What documents should I review before court?",
];

function buildCasePrompts(caseContext: CaseContext) {
  return [
    `Analyze the main risks and strengths in "${caseContext.title}".`,
    `Help me prepare an advocate strategy note for "${caseContext.title}".`,
    `Draft a professional client update for "${caseContext.title}".`,
    `Give me a hearing prep checklist for "${caseContext.title}".`,
  ];
}

export default function AskExpertChat({ caseContext }: { caseContext?: CaseContext | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const conversation = useMemo(
    () => messages.filter((message) => message.role === "user" || message.role === "assistant"),
    [messages]
  );
  const suggestions = caseContext ? buildCasePrompts(caseContext) : GENERAL_SUGGESTIONS;

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setHasLoadedSession(true);
        return;
      }

      const parsed = JSON.parse(stored) as {
        messages?: ChatMessage[];
        input?: string;
      };

      if (Array.isArray(parsed.messages) && parsed.messages.length) {
        setMessages(parsed.messages);
      }

      if (typeof parsed.input === "string") {
        setInput(parsed.input);
      }
    } catch {
      // Ignore invalid session state and start clean.
    } finally {
      setHasLoadedSession(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSession) return;

    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages,
        input,
      })
    );
  }, [messages, input, hasLoadedSession]);

  function applySuggestion(text: string) {
    setInput(text);
    textareaRef.current?.focus();
  }

  function applyCasePrompt(kind: "strategy" | "hearing" | "client" | "documents") {
    if (!caseContext) return;

    const caseFacts = [
      `Case title: ${caseContext.title}`,
      caseContext.status ? `Current status: ${caseContext.status}` : null,
      caseContext.court ? `Court: ${caseContext.court}` : null,
      caseContext.nextHearingDate ? `Next hearing date: ${caseContext.nextHearingDate}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const promptMap = {
      strategy: `Use this case context and help me think like a senior advocate.\n${caseFacts}\n\nI need a practical strategy note with risks, opportunities, and next steps.`,
      hearing: `Use this case context and prepare me for the hearing.\n${caseFacts}\n\nGive me a focused hearing checklist, likely questions, and preparation points.`,
      client: `Use this case context and draft a client update.\n${caseFacts}\n\nWrite a concise, professional update I can send to the client.`,
      documents: `Use this case context and help me review documents.\n${caseFacts}\n\nTell me which documents, facts, and procedural points I should verify next.`,
    };

    setInput(promptMap[kind]);
    textareaRef.current?.focus();
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared. Ask me anything about a case, a payment issue, a client communication, or hearing prep.",
      },
    ]);
    setInput("");
    setError(null);
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const nextMessages: ChatMessage[] = [...conversation, { role: "user", content: trimmedInput }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ask-expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, caseContext }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to contact Claude.");

      setMessages([...nextMessages, { role: "assistant", content: json.reply }]);
    } catch (err: unknown) {
      setMessages(conversation);
      setInput(trimmedInput);
      setError(err instanceof Error ? err.message : "Failed to contact Claude.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
      <section className="card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Ask an Expert</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900">Claude for advocates</h2>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          Use this space for case strategy brainstorming, hearing prep checklists, draft client updates, and structured legal workflow support.
        </p>

        {caseContext && (
          <div className="mt-6 rounded-3xl border border-navy-100 bg-gradient-to-br from-navy-50 to-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">Case Context</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{caseContext.title}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {[caseContext.status, caseContext.court, caseContext.nextHearingDate].filter(Boolean).join(" · ") || "Case details loaded"}
                </p>
              </div>
              <Link
                href={`/advocate/cases/${caseContext.caseId}`}
                className="inline-flex rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
              >
                Open case
              </Link>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => applyCasePrompt("strategy")}
                className="rounded-2xl border border-white bg-white px-3 py-3 text-left text-sm text-gray-700 transition-colors hover:border-navy-200 hover:bg-navy-50 hover:text-navy-700"
              >
                Ask about this case strategy
              </button>
              <button
                type="button"
                onClick={() => applyCasePrompt("hearing")}
                className="rounded-2xl border border-white bg-white px-3 py-3 text-left text-sm text-gray-700 transition-colors hover:border-navy-200 hover:bg-navy-50 hover:text-navy-700"
              >
                Prepare me for this hearing
              </button>
              <button
                type="button"
                onClick={() => applyCasePrompt("client")}
                className="rounded-2xl border border-white bg-white px-3 py-3 text-left text-sm text-gray-700 transition-colors hover:border-navy-200 hover:bg-navy-50 hover:text-navy-700"
              >
                Draft client update for this case
              </button>
              <button
                type="button"
                onClick={() => applyCasePrompt("documents")}
                className="rounded-2xl border border-white bg-white px-3 py-3 text-left text-sm text-gray-700 transition-colors hover:border-navy-200 hover:bg-navy-50 hover:text-navy-700"
              >
                Review documents for this case
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => applySuggestion(suggestion)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:border-navy-200 hover:bg-navy-50 hover:text-navy-700"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          AI can help you think faster, but important legal judgment should still be reviewed by you professionally.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={clearChat}
            className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            Clear chat
          </button>
          <span className="inline-flex rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-500">
            Session memory on
          </span>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Conversation</p>
              <p className="text-xs text-gray-400">This chat remembers your history for the current browser session.</p>
            </div>
            <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700">
              Claude connected
            </span>
          </div>
        </div>

        <div className="flex min-h-[540px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-white to-gray-50 px-5 py-5 sm:px-6">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-md bg-navy-700 text-white"
                      : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
                    {message.role === "user" ? "You" : "Claude"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                  Claude is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
            {error && <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                ref={textareaRef}
                className="input min-h-[120px] resize-none"
                placeholder="Ask about a case issue, hearing strategy, client communication, payment workflow, or document checklist..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-400">
                  Include case facts, dates, and goals for better answers.
                </p>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading || !input.trim()}>
                  {loading ? "Sending..." : "Send to Claude"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
