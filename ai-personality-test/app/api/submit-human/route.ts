import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { computeTraitScores } from "../../../lib/scoring";

interface HumanPayload {
  sessionId: string;
  responses: { questionIndex: number; value: number }[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HumanPayload;
    const { sessionId, responses } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 },
      );
    }

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: "No responses provided" },
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

    const questions = await prisma.question.findMany({
      where: { index: { in: responses.map((r) => r.questionIndex) } },
    });

    const indexToId = new Map<number, number>();
    questions.forEach((q) => indexToId.set(q.index, q.id));

    const data = responses
      .filter((r) => r.value >= 1 && r.value <= 5)
      .map((r) => ({
        sessionId,
        questionId: indexToId.get(r.questionIndex)!,
        value: r.value,
      }))
      .filter((r) => r.questionId != null);

    if (data.length === 0) {
      return NextResponse.json(
        { error: "No valid responses" },
        { status: 400 },
      );
    }

    await prisma.humanResponse.createMany({ data });

    const responseMap: Record<number, number> = {};
    for (const r of responses) {
      if (r.value >= 1 && r.value <= 5) {
        responseMap[r.questionIndex] = r.value;
      }
    }

    const traitScores = computeTraitScores(responseMap);

    return NextResponse.json({ traitScores });
  } catch (error) {
    console.error("submit-human error", error);
    return NextResponse.json(
      { error: "Failed to submit human responses" },
      { status: 500 },
    );
  }
}
