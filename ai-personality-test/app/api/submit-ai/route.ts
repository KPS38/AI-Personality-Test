import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { parseAiAnswers } from "../../../lib/parseAiAnswers";
import {
  computeTraitScores,
  compareTraitScores,
  type ResponseMap,
} from "../../../lib/scoring";

interface AiPayload {
  sessionId: string;
  rawText: string;
}

interface PerQuestionComparison {
  index: number;
  text: string;
  human: number | null;
  ai: number | null;
  exactMatch: boolean;
  absoluteDifference: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AiPayload;
    const { sessionId, rawText } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 },
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 },
      );
    }

    const { values, errors } = parseAiAnswers(rawText, 60);

    if (Object.keys(values).length === 0) {
      return NextResponse.json(
        { error: "Could not parse any AI answers", parseErrors: errors },
        { status: 400 },
      );
    }

    const questionsForAi = await prisma.question.findMany({
      where: { index: { in: Object.keys(values).map((k) => Number(k)) } },
    });

    const indexToId = new Map<number, number>();
    questionsForAi.forEach((q) => indexToId.set(q.index, q.id));

    const aiData = Object.entries(values)
      .map(([indexStr, value]) => {
        const questionIndex = Number(indexStr);
        const questionId = indexToId.get(questionIndex);
        if (!questionId) return null;
        return {
          sessionId,
          questionId,
          value,
          rawText,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (aiData.length === 0) {
      return NextResponse.json(
        { error: "No valid AI responses after mapping to questions" },
        { status: 400 },
      );
    }

    await prisma.aiPrediction.createMany({ data: aiData });

    const humanResponses = await prisma.humanResponse.findMany({
      where: { sessionId },
      include: { question: true },
    });

    const humanMap: ResponseMap = {};
    humanResponses.forEach((r) => {
      humanMap[r.question.index] = r.value;
    });

    const aiMap: ResponseMap = values;

    const humanTraitScores = computeTraitScores(humanMap);
    const aiTraitScores = computeTraitScores(aiMap);

    const summary = compareTraitScores(humanTraitScores, aiTraitScores);

    // Build per-question comparison data so the UI can show
    // side-by-side answers for each of the 60 items.
    const allQuestions = await prisma.question.findMany({
      orderBy: { index: "asc" },
    });

    const perQuestion: PerQuestionComparison[] = allQuestions.map((q) => {
      const human = humanMap[q.index] ?? null;
      const ai = aiMap[q.index] ?? null;
      const exactMatch = human !== null && ai !== null && human === ai;
      const absoluteDifference =
        human !== null && ai !== null ? Math.abs(human - ai) : null;
      return {
        index: q.index,
        text: q.text,
        human,
        ai,
        exactMatch,
        absoluteDifference,
      };
    });

    const comparable = perQuestion.filter(
      (p) => p.human !== null && p.ai !== null,
    );
    const exactMatches = comparable.filter((p) => p.exactMatch).length;
    const exactMatchPercent =
      comparable.length > 0
        ? (exactMatches / comparable.length) * 100
        : 0;

    // "Near misses": off by 1 point, but both answers are on
    // the same side of the spectrum (1–2 or 4–5), and neither
    // answer is the neutral 3.
    const nearMatches = comparable.filter((p) => {
      if (p.human == null || p.ai == null) return false;
      if (p.human === 3 || p.ai === 3) return false;
      if (p.exactMatch) return false;
      const diff = Math.abs(p.human - p.ai);
      if (diff !== 1) return false;
      const bothLow = p.human <= 2 && p.ai <= 2;
      const bothHigh = p.human >= 4 && p.ai >= 4;
      return bothLow || bothHigh;
    }).length;
    const nearMatchPercent =
      comparable.length > 0
        ? (nearMatches / comparable.length) * 100
        : 0;

    return NextResponse.json({
      parseErrors: errors,
      humanTraitScores,
      aiTraitScores,
      summary,
      perQuestion,
      exactMatchPercent,
      nearMatchPercent,
    });
  } catch (error) {
    console.error("submit-ai error", error);
    return NextResponse.json(
      { error: "Failed to submit AI responses" },
      { status: 500 },
    );
  }
}
