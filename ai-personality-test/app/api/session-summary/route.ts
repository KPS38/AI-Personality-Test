import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import {
  computeTraitScores,
  compareTraitScores,
  type ResponseMap,
} from "../../../lib/scoring";

interface PerQuestionComparison {
  index: number;
  text: string;
  human: number | null;
  ai: number | null;
  exactMatch: boolean;
  absoluteDifference: number | null;
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 },
      );
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 },
      );
    }

    const humanResponses = await prisma.humanResponse.findMany({
      where: { sessionId },
      include: { question: true },
    });

    if (humanResponses.length === 0) {
      return NextResponse.json(
        { error: "No human responses for this session" },
        { status: 404 },
      );
    }

    const aiPredictions = await prisma.aiPrediction.findMany({
      where: { sessionId },
      include: { question: true },
      orderBy: { id: "asc" },
    });

    if (aiPredictions.length === 0) {
      return NextResponse.json(
        { error: "No AI predictions for this session yet" },
        { status: 404 },
      );
    }

    const humanMap: ResponseMap = {};
    humanResponses.forEach((r) => {
      humanMap[r.question.index] = r.value;
    });

    const aiMap: ResponseMap = {};
    // If multiple predictions exist for the same question, the last one wins.
    aiPredictions.forEach((p) => {
      aiMap[p.question.index] = p.value;
    });

    const humanTraitScores = computeTraitScores(humanMap);
    const aiTraitScores = computeTraitScores(aiMap);
    const summary = compareTraitScores(humanTraitScores, aiTraitScores);

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
      humanTraitScores,
      aiTraitScores,
      summary,
      perQuestion,
      exactMatchPercent,
      nearMatchPercent,
    });
  } catch (error) {
    console.error("session-summary error", error);
    return NextResponse.json(
      { error: "Failed to load session summary" },
      { status: 500 },
    );
  }
}
