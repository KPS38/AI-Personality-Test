import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { IPIP_NEO_60 } from "../../../lib/ipip-neo-60";

export async function POST(_req: NextRequest) {
  try {
    // Ensure questions are seeded once
    const count = await prisma.question.count();
    if (count === 0 && IPIP_NEO_60.length > 0) {
      await prisma.question.createMany({
        data: IPIP_NEO_60.map((q) => ({
          index: q.index,
          text: q.text,
          domain: q.domain,
          facet: q.facet,
          keyedDirection: q.keyedDirection,
        })),
      });
    }

    const session = await prisma.session.create({
      data: {},
    });

    const questions = await prisma.question.findMany({
      orderBy: { index: "asc" },
    });

    return NextResponse.json({
      sessionId: session.id,
      questions,
    });
  } catch (error) {
    console.error("init-session error", error);
    return NextResponse.json(
      { error: "Failed to initialize session" },
      { status: 500 },
    );
  }
}
