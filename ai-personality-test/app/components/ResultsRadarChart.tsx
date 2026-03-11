"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { TraitScores } from "../../lib/scoring";

interface ResultsRadarChartProps {
  human: TraitScores;
  ai: TraitScores;
}

export function ResultsRadarChart({ human, ai }: ResultsRadarChartProps) {
  const data = ["O", "C", "E", "A", "N"].map((trait) => ({
    trait,
    human: human[trait as keyof TraitScores] ?? 0,
    ai: ai[trait as keyof TraitScores] ?? 0,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid />
          <PolarAngleAxis dataKey="trait" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Human"
            dataKey="human"
            stroke="#0f172a"
            fill="#0f172a"
            fillOpacity={0.4}
          />
          <Radar
            name="AI"
            dataKey="ai"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.4}
          />
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
