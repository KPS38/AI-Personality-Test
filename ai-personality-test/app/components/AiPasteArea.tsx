"use client";

import React from "react";

interface AiPasteAreaProps {
  value: string;
  onChange: (value: string) => void;
}

export function AiPasteArea({ value, onChange }: AiPasteAreaProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-900">
        Paste AI-predicted answers
      </label>
      <textarea
        className="min-h-[160px] w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none"
        placeholder="Paste the model's answers here. JSON array, '1. 4', or similar formats are accepted. One 1-5 answer per question."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
