"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IPIP_NEO_60, type IpipQuestion } from "../lib/ipip-neo-60";
import type { TraitScores, ScoreSummary } from "../lib/scoring";
import { QuestionItem } from "./components/QuestionItem";
import { AiPasteArea } from "./components/AiPasteArea";
import { ResultsRadarChart } from "./components/ResultsRadarChart";

type Step = "intro" | "questions" | "ai" | "results";

interface InitSessionResponse {
  sessionId: string;
  questions: (IpipQuestion & { id: number })[];
}

interface PerQuestionComparison {
  index: number;
  text: string;
  human: number | null;
  ai: number | null;
  exactMatch: boolean;
  absoluteDifference: number | null;
}

export default function Home() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<(IpipQuestion & { id: number })[]>(
    [],
  );
  const [responses, setResponses] = useState<Record<number, number>>({});

  const [aiText, setAiText] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [conversationCount, setConversationCount] = useState("");
  const [useCases, setUseCases] = useState<string[]>([]);
  const [promptCopied, setPromptCopied] = useState(false);
  const [copiedBatch, setCopiedBatch] = useState<number | null>(null);
  const [humanTraitScores, setHumanTraitScores] = useState<TraitScores | null>(
    null,
  );
  const [aiTraitScores, setAiTraitScores] = useState<TraitScores | null>(null);
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [perQuestion, setPerQuestion] = useState<PerQuestionComparison[] | null>(
    null,
  );
  const [exactMatchPercent, setExactMatchPercent] = useState<number | null>(
    null,
  );
  const [nearMatchPercent, setNearMatchPercent] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const LLM_PROMPT = `You are participating in a research experiment.

Your task is to predict how I would answer a personality questionnaire based on your memory of our previous conversations.

You will receive questions in batches of 10. You must store answers internally and produce a final JSON with all answers from 1–60 at the end.

Rules for answering

Base answers primarily on information from our past conversations.

You may make reasonable inferences from:

communication style

topics of interest

problem-solving approach

planning and organization

curiosity and learning patterns

risk attitudes and decision-making

If there is no evidence or reasonable inference, select 3 (neutral / insufficient evidence).

Prefer moderate confidence (2 or 4) for weak indirect signals.

Use extreme answers (1 or 5) only when there is strong evidence.

Do not assume population averages or stereotypes.

Scale

1 = Very inaccurate
2 = Moderately inaccurate
3 = Neutral / insufficient evidence
4 = Moderately accurate
5 = Very accurate

Output instructions

For each batch of 10 questions, respond only with JSON for that batch, using the question numbers provided.

Do not include explanations or text outside JSON.

Store all answers internally until the last batch.

When the last batch is indicated, output a single JSON combining all answers from 1–60 in order.`;

  function toggleUseCase(value: string) {
    setUseCases((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  }

  function buildBatchText(batchIndex: number): string {
    const start = batchIndex * 10;
    const items = IPIP_NEO_60.slice(start, start + 10);
    if (items.length === 0) return "";

    const header = `Batch ${batchIndex + 1} (Questions ${items[0].index}–${
      items[items.length - 1].index
    })`;
    const lines = items.map((q) => `${q.index}. ${q.text}`);

    // For the final batch, explicitly tell the model to now
    // output the combined JSON for questions 1–60.
    if (batchIndex === 5) {
      const footer =
        "\nThis is the FINAL batch. After answering questions 51–60, \\nplease output a single JSON object containing your answers for questions 1–60, \\nusing the question numbers as keys (e.g., { \"1\": 3, \"2\": 4, ..., \"60\": 2 }).";
      return [header, "", ...lines].join("\n") + footer;
    }

    return [header, "", ...lines].join("\n");
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        const existingSessionId = searchParams.get("sessionId");
        if (existingSessionId) {
          setSessionId(existingSessionId);
          // Try to load existing results for this session. If no AI
          // predictions exist yet, fall back to the AI step so you
          // can paste a new model output.
          try {
            const res = await fetch(
              `/api/session-summary?sessionId=${encodeURIComponent(existingSessionId)}`,
            );
            if (res.ok) {
              const data = await res.json();
              setHumanTraitScores(data.humanTraitScores as TraitScores);
              setAiTraitScores(data.aiTraitScores as TraitScores);
              setSummary(data.summary as ScoreSummary);
              setPerQuestion(
                (data.perQuestion as PerQuestionComparison[]) ?? null,
              );
              setExactMatchPercent(
                typeof data.exactMatchPercent === "number"
                  ? data.exactMatchPercent
                  : null,
              );
              setNearMatchPercent(
                typeof data.nearMatchPercent === "number"
                  ? data.nearMatchPercent
                  : null,
              );
              setStep("results");
            } else {
              setStep("ai");
            }
          } catch {
            setStep("ai");
          }
          return;
        }

        const res = await fetch("/api/init-session", { method: "POST" });
        if (!res.ok) {
          throw new Error("Failed to initialize session");
        }
        const data = (await res.json()) as InitSessionResponse;
        setSessionId(data.sessionId);
        setQuestions(data.questions);
        setStep("questions");
      } catch (err) {
        console.error(err);
        setError("Could not initialize the questionnaire.");
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [searchParams]);

  async function handleSubmitHuman() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        sessionId,
        responses: Object.entries(responses).map(([indexStr, value]) => ({
          questionIndex: Number(indexStr),
          value,
        })),
      };
      const res = await fetch("/api/submit-human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit human responses");
      }
      setHumanTraitScores(data.traitScores);
      setStep("ai");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAi() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    setParseErrors([]);
    try {
      const payload = { sessionId, rawText: aiText };
      const res = await fetch("/api/submit-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.parseErrors) {
          setParseErrors(data.parseErrors as string[]);
        }
        throw new Error(data.error ?? "Failed to submit AI responses");
      }
      setParseErrors(data.parseErrors ?? []);
      setAiTraitScores(data.aiTraitScores);
      setHumanTraitScores(data.humanTraitScores);
      setSummary(data.summary);
      setPerQuestion((data.perQuestion as PerQuestionComparison[]) ?? null);
      setExactMatchPercent(
        typeof data.exactMatchPercent === "number"
          ? data.exactMatchPercent
          : null,
      );
      setNearMatchPercent(
        typeof data.nearMatchPercent === "number"
          ? data.nearMatchPercent
          : null,
      );
      setStep("results");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  const completedCount = Object.keys(responses).length;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
        <header className="flex flex-col gap-2 border-b border-zinc-200 pb-4 md:flex-row md:items-baseline md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Human vs AI Personality
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600">
              Compare your IPIP-NEO personality scores with predictions from
              large language models. Responses are stored anonymously with a
              random session ID.
            </p>
          </div>
          <div className="mt-2 flex gap-2 text-xs text-zinc-500 md:mt-0">
            <span className="rounded-full bg-zinc-100 px-3 py-1">
              Step {step === "questions" ? 1 : step === "ai" ? 2 : 3} of 3
            </span>
            {sessionId && (
              <span className="truncate rounded-full bg-zinc-100 px-3 py-1">
                Session: {sessionId}
              </span>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "questions" && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">1. Answer the questions</h2>
              <div className="text-xs text-zinc-500">
                {completedCount} / {questions.length || 60} completed
              </div>
            </div>
            <p className="text-sm text-zinc-600">
              Please answer each statement from 1 (strongly disagree) to 5
              (strongly agree). There are 60 items.
            </p>
            <div className="grid gap-3">
              {questions.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  value={responses[q.index]}
                  onChange={(v) =>
                    setResponses((prev) => ({ ...prev, [q.index]: v }))
                  }
                />
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmitHuman}
                disabled={loading || completedCount === 0}
                className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {loading ? "Processing..." : "Continue to AI predictions"}
              </button>
            </div>
          </section>
        )}

        {step === "ai" && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">
              2. Describe your AI usage & get the prompt
            </h2>
            <div className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-2">
              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <label className="mb-1 block font-medium text-zinc-900">
                    Which AI service have you used most with this conversation?
                  </label>
                  <select
                    className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                  >
                    <option value="">Select a company</option>
                    <option value="openai">OpenAI (ChatGPT)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="google">Google (Gemini)</option>
                    <option value="meta">Meta (Llama)</option>
                    <option value="perplexity">Perplexity</option>
                    <option value="other">Other / not listed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-zinc-900">
                    Roughly how many messages have you exchanged with this
                    model?
                  </label>
                  <select
                    className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none"
                    value={conversationCount}
                    onChange={(e) => setConversationCount(e.target.value)}
                  >
                    <option value="">Select a range</option>
                    <option value="1-10">1–10</option>
                    <option value="10-50">10–50</option>
                    <option value="50-200">50–200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>
                <div>
                  <div className="mb-1 block text-sm font-medium text-zinc-900">
                    What do you mostly use this AI for?
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      "Work / professional",
                      "Learning / education",
                      "Coding / technical help",
                      "Creative writing / brainstorming",
                      "Planning / productivity",
                      "Personal reflection / journaling",
                      "Other",
                    ].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleUseCase(label)}
                        className={`rounded-full border px-3 py-1 shadow-sm transition-colors ${useCases.includes(label) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-zinc-900">
                    Prompt to send to your AI
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(LLM_PROMPT);
                        setPromptCopied(true);
                        setTimeout(() => setPromptCopied(false), 2000);
                      } catch {
                        setPromptCopied(false);
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
                  >
                    {promptCopied ? "Copied" : "Copy prompt"}
                  </button>
                </div>
                <p className="text-xs text-zinc-600">
                  Copy this prompt into your chosen AI (for example OpenAI
                  ChatGPT, Anthropic Claude, Google Gemini, or another
                  service). Let the model answer the questionnaire batch by
                  batch using the 10-question blocks below, and when it has
                  finished all 60 items, have it return one final JSON object
                  with answers for questions 1–60.
                </p>
                <pre className="max-h-64 overflow-auto rounded-md bg-zinc-900 p-3 text-[11px] leading-snug text-zinc-50">
                  {LLM_PROMPT}
                </pre>
                <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <div className="mb-2 text-xs font-semibold text-zinc-900">
                    Question batches (10 items each)
                  </div>
                  <p className="mb-2 text-[11px] text-zinc-600">
                    Use these to send the questionnaire in 6 batches of 10
                    questions. Copy each batch when the model is ready for the
                    next set.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={async () => {
                          const text = buildBatchText(idx);
                          if (!text) return;
                          try {
                            await navigator.clipboard.writeText(text);
                            setCopiedBatch(idx);
                            setTimeout(() => setCopiedBatch(null), 2000);
                          } catch {
                            setCopiedBatch(null);
                          }
                        }}
                        className={`rounded-md border px-3 py-1 text-[11px] font-medium shadow-sm transition-colors ${
                          copiedBatch === idx
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {copiedBatch === idx
                          ? `Copied batch ${idx + 1}`
                          : `Copy batch ${idx + 1} (Q${
                              idx * 10 + 1
                            }–${(idx + 1) * 10})`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2 text-sm font-medium text-zinc-900">
              Paste the model's final JSON (or numbered answers)
            </div>
            <p className="text-xs text-zinc-600">
              After your AI has answered all 6 batches, copy its final JSON
              output (with answers for questions 1–60) and paste it here. You
              can also paste clearly numbered answers if the model could not
              produce JSON.
            </p>
            <AiPasteArea value={aiText} onChange={setAiText} />
            {parseErrors.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <div className="font-medium">Parsing notes</div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {parseErrors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("questions")}
                className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmitAi}
                disabled={loading || !aiText.trim()}
                className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {loading ? "Analyzing..." : "Compare scores"}
              </button>
            </div>
          </section>
        )}

        {step === "results" && humanTraitScores && aiTraitScores && summary && (
          <section className="flex flex-col gap-6">
            <h2 className="text-lg font-semibold">3. Results</h2>
            <p className="text-sm text-zinc-600">
              Big Five trait scores are normalized to a 0–100 scale (higher
              means more of the trait). Similarity is based on how far apart
              the 5 trait scores are on average: it is 1 minus the mean
              absolute difference of trait scores divided by 100, so values
              closer to 1 indicate more similar overall profiles.
            </p>
            <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                <ResultsRadarChart human={humanTraitScores} ai={aiTraitScores} />
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-zinc-900">
                    Summary
                  </div>
                  <dl className="mt-2 space-y-1 text-sm text-zinc-700">
                    <div className="flex justify-between">
                      <dt>Mean absolute difference</dt>
                      <dd>{summary.meanAbsoluteDifference.toFixed(1)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Similarity (0–1)</dt>
                      <dd>{summary.similarity.toFixed(3)}</dd>
                    </div>
                    {exactMatchPercent !== null && (
                      <div className="flex justify-between">
                        <dt>Exact same answer rate</dt>
                        <dd>{exactMatchPercent.toFixed(1)}%</dd>
                      </div>
                    )}
                    {nearMatchPercent !== null && (
                      <div className="flex justify-between">
                        <dt>Near miss (1-point, same side)</dt>
                        <dd>{nearMatchPercent.toFixed(1)}%</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 text-sm font-semibold text-zinc-900">
                    Trait-by-trait
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wide text-zinc-500">
                        <th className="py-1 pr-2">Trait</th>
                        <th className="py-1 pr-2">You</th>
                        <th className="py-1 pr-2">AI</th>
                        <th className="py-1 pr-2">Abs diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.perTrait.map((row) => (
                        <tr key={row.trait} className="border-b border-zinc-100">
                          <td className="py-1 pr-2 font-medium">{row.trait}</td>
                          <td className="py-1 pr-2">{row.human.toFixed(1)}</td>
                          <td className="py-1 pr-2">{row.ai.toFixed(1)}</td>
                          <td className="py-1 pr-2">
                            {row.absoluteDifference.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {perQuestion && perQuestion.length > 0 && (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="mb-2 text-sm font-semibold text-zinc-900">
                  Per-question answers (you vs AI)
                </div>
                <p className="mb-2 text-xs text-zinc-600">
                  Shows each item side by side. A match means you and the AI
                  chose the exact same 1–5 rating for that question. Near
                  misses are counted separately above: they are 1-point
                  differences where both of you were on the same side of the
                  scale (1–2 or 4–5), not involving the neutral 3.
                </p>
                <div className="max-h-80 overflow-auto border border-zinc-100">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500">
                        <th className="py-1 px-2">#</th>
                        <th className="py-1 px-2">Question</th>
                        <th className="py-1 px-2">You</th>
                        <th className="py-1 px-2">AI</th>
                        <th className="py-1 px-2">Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perQuestion.map((row) => (
                        <tr
                          key={row.index}
                          className="border-b border-zinc-100 align-top"
                        >
                          <td className="py-1 px-2 font-medium">
                            {row.index}
                          </td>
                          <td className="py-1 px-2 text-[11px] text-zinc-700">
                            {row.text}
                          </td>
                          <td className="py-1 px-2 text-center">
                            {row.human === null ? "–" : row.human}
                          </td>
                          <td className="py-1 px-2 text-center">
                            {row.ai === null ? "–" : row.ai}
                          </td>
                          <td className="py-1 px-2 text-center">
                            {row.human !== null && row.ai !== null
                              ? row.exactMatch
                                ? "✓"
                                : "×"
                              : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setStep("questions");
                  setResponses({});
                  setAiText("");
                  setParseErrors([]);
                  setPerQuestion(null);
                  setExactMatchPercent(null);
                  setNearMatchPercent(null);
                }}
                className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                Start over (same session)
              </button>
            </div>
          </section>
        )}

        {loading && step === "intro" && (
          <div className="text-sm text-zinc-500">Initializing session...</div>
        )}
      </main>
    </div>
  );
}
