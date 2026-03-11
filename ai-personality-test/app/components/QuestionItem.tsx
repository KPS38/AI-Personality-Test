"use client";

import React from "react";
import type { IpipQuestion } from "../../lib/ipip-neo-60";
import { LikertScale } from "./LikertScale";

interface QuestionItemProps {
  question: IpipQuestion;
  value?: number;
  onChange: (value: number) => void;
}

export function QuestionItem({ question, value, onChange }: QuestionItemProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium text-zinc-900">
          {question.index}. {question.text}
        </div>
        <div className="text-xs uppercase tracking-wide text-zinc-400">
          {question.domain}
        </div>
      </div>
      <LikertScale
        name={`q-${question.index}`}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
