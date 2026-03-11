"use client";

import React from "react";

const LABELS = [
  "Strongly disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly agree",
];

interface LikertScaleProps {
  name: string;
  value?: number;
  onChange: (value: number) => void;
}

export function LikertScale({ name, value, onChange }: LikertScaleProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{LABELS[0]}</span>
        <span>{LABELS[4]}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        {LABELS.map((label, index) => {
          const v = index + 1;
          return (
            <label
              key={v}
              className="flex flex-1 cursor-pointer flex-col items-center gap-1"
            >
              <input
                type="radio"
                name={name}
                value={v}
                checked={value === v}
                onChange={() => onChange(v)}
                className="h-4 w-4 cursor-pointer accent-zinc-900"
              />
              <span className="text-[11px] text-zinc-600">{v}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
