export type BigFiveDomain = "O" | "C" | "E" | "A" | "N";

export type KeyedDirection = "normal" | "reverse";

export interface IpipQuestion {
  index: number; // 1-60
  domain: BigFiveDomain;
  facet?: string;
  text: string;
  keyedDirection: KeyedDirection;
}

export const IPIP_NEO_60: IpipQuestion[] = [
  // Neuroticism (N1 Anxiety)
  {
    index: 1,
    domain: "N",
    facet: "N1 Anxiety",
    text: "Worry about things.",
    keyedDirection: "normal",
  },
  {
    index: 2,
    domain: "N",
    facet: "N1 Anxiety",
    text: "Get stressed out easily.",
    keyedDirection: "normal",
  },
  // N2 Anger
  {
    index: 3,
    domain: "N",
    facet: "N2 Anger",
    text: "Get angry easily.",
    keyedDirection: "normal",
  },
  {
    index: 4,
    domain: "N",
    facet: "N2 Anger",
    text: "Lose my temper.",
    keyedDirection: "normal",
  },
  // N3 Depression
  {
    index: 5,
    domain: "N",
    facet: "N3 Depression",
    text: "Often feel blue.",
    keyedDirection: "normal",
  },
  {
    index: 6,
    domain: "N",
    facet: "N3 Depression",
    text: "Dislike myself.",
    keyedDirection: "normal",
  },
  // N4 Self-consciousness
  {
    index: 7,
    domain: "N",
    facet: "N4 Self-consciousness",
    text: "Find it difficult to approach others.",
    keyedDirection: "normal",
  },
  {
    index: 8,
    domain: "N",
    facet: "N4 Self-consciousness",
    text: "Am easily intimidated.",
    keyedDirection: "normal",
  },
  // N5 Immoderation (reverse-scored)
  {
    index: 9,
    domain: "N",
    facet: "N5 Immoderation",
    text: "Rarely overindulge.",
    keyedDirection: "reverse",
  },
  {
    index: 10,
    domain: "N",
    facet: "N5 Immoderation",
    text: "Am able to control my cravings.",
    keyedDirection: "reverse",
  },
  // N6 Vulnerability (reverse-scored)
  {
    index: 11,
    domain: "N",
    facet: "N6 Vulnerability",
    text: "Remain calm under pressure.",
    keyedDirection: "reverse",
  },
  {
    index: 12,
    domain: "N",
    facet: "N6 Vulnerability",
    text: "Am calm even in tense situations.",
    keyedDirection: "reverse",
  },

  // Extraversion (E1 Friendliness)
  {
    index: 13,
    domain: "E",
    facet: "E1 Friendliness",
    text: "Make friends easily.",
    keyedDirection: "normal",
  },
  {
    index: 14,
    domain: "E",
    facet: "E1 Friendliness",
    text: "Act comfortably with others.",
    keyedDirection: "normal",
  },
  // E2 Gregariousness
  {
    index: 15,
    domain: "E",
    facet: "E2 Gregariousness",
    text: "Love large parties.",
    keyedDirection: "normal",
  },
  {
    index: 16,
    domain: "E",
    facet: "E2 Gregariousness",
    text: "Avoid crowds.",
    keyedDirection: "reverse",
  },
  // E3 Assertiveness
  {
    index: 17,
    domain: "E",
    facet: "E3 Assertiveness",
    text: "Take charge.",
    keyedDirection: "normal",
  },
  {
    index: 18,
    domain: "E",
    facet: "E3 Assertiveness",
    text: "Try to lead others.",
    keyedDirection: "normal",
  },
  // E4 Activity Level
  {
    index: 19,
    domain: "E",
    facet: "E4 Activity Level",
    text: "Am always busy.",
    keyedDirection: "normal",
  },
  {
    index: 20,
    domain: "E",
    facet: "E4 Activity Level",
    text: "Am always on the go.",
    keyedDirection: "normal",
  },
  // E5 Excitement Seeking
  {
    index: 21,
    domain: "E",
    facet: "E5 Excitement Seeking",
    text: "Love excitement.",
    keyedDirection: "normal",
  },
  {
    index: 22,
    domain: "E",
    facet: "E5 Excitement Seeking",
    text: "Seek adventure.",
    keyedDirection: "normal",
  },
  // E6 Cheerfulness
  {
    index: 23,
    domain: "E",
    facet: "E6 Cheerfulness",
    text: "Have a lot of fun.",
    keyedDirection: "normal",
  },
  {
    index: 24,
    domain: "E",
    facet: "E6 Cheerfulness",
    text: "Love life.",
    keyedDirection: "normal",
  },

  // Openness (O1 Imagination)
  {
    index: 25,
    domain: "O",
    facet: "O1 Imagination",
    text: "Have a vivid imagination.",
    keyedDirection: "normal",
  },
  {
    index: 26,
    domain: "O",
    facet: "O1 Imagination",
    text: "Love to daydream.",
    keyedDirection: "normal",
  },
  // O2 Artistic Interests
  {
    index: 27,
    domain: "O",
    facet: "O2 Artistic Interests",
    text: "Believe in the importance of art.",
    keyedDirection: "normal",
  },
  {
    index: 28,
    domain: "O",
    facet: "O2 Artistic Interests",
    text: "Do not like art.",
    keyedDirection: "reverse",
  },
  // O3 Emotionality
  {
    index: 29,
    domain: "O",
    facet: "O3 Emotionality",
    text: "Experience my emotions intensely.",
    keyedDirection: "normal",
  },
  {
    index: 30,
    domain: "O",
    facet: "O3 Emotionality",
    text: "Am not easily affected by my emotions.",
    keyedDirection: "reverse",
  },
  // O4 Adventurousness (reverse-scored)
  {
    index: 31,
    domain: "O",
    facet: "O4 Adventurousness",
    text: "Prefer to stick with things that I know.",
    keyedDirection: "reverse",
  },
  {
    index: 32,
    domain: "O",
    facet: "O4 Adventurousness",
    text: "Don’t like the idea of change.",
    keyedDirection: "reverse",
  },
  // O5 Intellect (reverse-scored)
  {
    index: 33,
    domain: "O",
    facet: "O5 Intellect",
    text: "Avoid philosophical discussions.",
    keyedDirection: "reverse",
  },
  {
    index: 34,
    domain: "O",
    facet: "O5 Intellect",
    text: "Am not interested in theoretical discussions.",
    keyedDirection: "reverse",
  },
  // O6 Liberalism
  {
    index: 35,
    domain: "O",
    facet: "O6 Liberalism",
    text: "Tend to vote for liberal political candidates.",
    keyedDirection: "normal",
  },
  {
    index: 36,
    domain: "O",
    facet: "O6 Liberalism",
    text: "Believe in one true religion.",
    keyedDirection: "reverse",
  },

  // Agreeableness (A1 Trust)
  {
    index: 37,
    domain: "A",
    facet: "A1 Trust",
    text: "Trust others.",
    keyedDirection: "normal",
  },
  {
    index: 38,
    domain: "A",
    facet: "A1 Trust",
    text: "Believe that others have good intentions.",
    keyedDirection: "normal",
  },
  // A2 Morality (reverse-scored)
  {
    index: 39,
    domain: "A",
    facet: "A2 Morality",
    text: "Cheat to get ahead.",
    keyedDirection: "reverse",
  },
  {
    index: 40,
    domain: "A",
    facet: "A2 Morality",
    text: "Take advantage of others.",
    keyedDirection: "reverse",
  },
  // A3 Altruism
  {
    index: 41,
    domain: "A",
    facet: "A3 Altruism",
    text: "Love to help others.",
    keyedDirection: "normal",
  },
  {
    index: 42,
    domain: "A",
    facet: "A3 Altruism",
    text: "Am concerned about others.",
    keyedDirection: "normal",
  },
  // A4 Cooperation (reverse-scored)
  {
    index: 43,
    domain: "A",
    facet: "A4 Cooperation",
    text: "Insult people.",
    keyedDirection: "reverse",
  },
  {
    index: 44,
    domain: "A",
    facet: "A4 Cooperation",
    text: "Get back at others.",
    keyedDirection: "reverse",
  },
  // A5 Modesty (reverse-scored)
  {
    index: 45,
    domain: "A",
    facet: "A5 Modesty",
    text: "Believe that I am better than others.",
    keyedDirection: "reverse",
  },
  {
    index: 46,
    domain: "A",
    facet: "A5 Modesty",
    text: "Think highly of myself.",
    keyedDirection: "reverse",
  },
  // A6 Sympathy
  {
    index: 47,
    domain: "A",
    facet: "A6 Sympathy",
    text: "Sympathize with the homeless.",
    keyedDirection: "normal",
  },
  {
    index: 48,
    domain: "A",
    facet: "A6 Sympathy",
    text: "Feel sympathy for those who are worse off than myself.",
    keyedDirection: "normal",
  },

  // Conscientiousness (C1 Self Efficacy)
  {
    index: 49,
    domain: "C",
    facet: "C1 Self Efficacy",
    text: "Handle tasks smoothly.",
    keyedDirection: "normal",
  },
  {
    index: 50,
    domain: "C",
    facet: "C1 Self Efficacy",
    text: "Know how to get things done.",
    keyedDirection: "normal",
  },
  // C2 Orderliness (reverse-scored)
  {
    index: 51,
    domain: "C",
    facet: "C2 Orderliness",
    text: "Like to tidy up.",
    keyedDirection: "normal",
  },
  {
    index: 52,
    domain: "C",
    facet: "C2 Orderliness",
    text: "Leave a mess in my room.",
    keyedDirection: "reverse",
  },
  // C3 Dutifulness (reverse-scored)
  {
    index: 53,
    domain: "C",
    facet: "C3 Dutifulness",
    text: "Tell the truth.",
    keyedDirection: "normal",
  },
  {
    index: 54,
    domain: "C",
    facet: "C3 Dutifulness",
    text: "Break my promises.",
    keyedDirection: "reverse",
  },
  // C4 Achievement Striving
  {
    index: 55,
    domain: "C",
    facet: "C4 Achievement Striving",
    text: "Work hard.",
    keyedDirection: "normal",
  },
  {
    index: 56,
    domain: "C",
    facet: "C4 Achievement Striving",
    text: "Set high standards for myself and others.",
    keyedDirection: "normal",
  },
  // C5 Self Discipline (reverse-scored)
  {
    index: 57,
    domain: "C",
    facet: "C5 Self Discipline",
    text: "Carry out my plans.",
    keyedDirection: "normal",
  },
  {
    index: 58,
    domain: "C",
    facet: "C5 Self Discipline",
    text: "Have difficulty starting tasks.",
    keyedDirection: "reverse",
  },
  // C6 Cautiousness (reverse-scored)
  {
    index: 59,
    domain: "C",
    facet: "C6 Cautiousness",
    text: "Make rash decisions.",
    keyedDirection: "reverse",
  },
  {
    index: 60,
    domain: "C",
    facet: "C6 Cautiousness",
    text: "Act without thinking.",
    keyedDirection: "reverse",
  },
];
