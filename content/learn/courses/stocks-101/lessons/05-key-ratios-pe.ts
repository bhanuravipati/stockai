import type { Lesson } from "../../../types";

export const keyRatiosPe: Lesson = {
  id: "stocks-101/key-ratios-pe",
  slug: "key-ratios-pe",
  title: "Key Ratios: P/E and Friends",
  summary: "Is a stock actually expensive, or does it just look that way?",
  estimatedMinutes: 5,
  content: [
    { type: "heading", text: "Price alone tells you almost nothing" },
    {
      type: "prose",
      body: [
        "A ₹2,000 share isn't automatically \"more expensive\" than a ₹200 share — it depends entirely on how much profit each share represents. That's what the Price-to-Earnings ratio, or P/E, measures.",
        "P/E = Share Price ÷ Earnings Per Share (EPS). It answers a simple question: how many years of the company's current profit would it take to earn back the price you paid for one share, if profits never changed?",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      body: "A P/E of 20x means investors are paying ₹20 for every ₹1 of annual profit. A lower P/E isn't automatically \"better\" — it can also mean the market expects that profit to shrink.",
    },
    { type: "widget", widget: "pe-ratio-explorer" },
    {
      type: "prose",
      body: [
        "P/E is most useful when you compare it — against the same company's own history, or against other companies in the same industry. A fast-growing tech company and a slow, steady utility company will naturally trade at very different \"normal\" P/E ranges.",
        "Here's the same calculator, but loaded with real numbers for a few large Indian companies:",
      ],
    },
    { type: "widget", widget: "real-pe-lookup" },
    {
      type: "callout",
      tone: "warn",
      body: "P/E breaks down when a company has little or no profit — dividing by a tiny or negative EPS produces a huge or meaningless number. Always sanity-check what's driving the ratio.",
    },
    {
      type: "checkpoint",
      question: {
        id: "compute-pe",
        prompt: "A stock trades at ₹450 and earned ₹15 per share over the last year. What's its P/E ratio?",
        options: [
          { id: "a", label: "3x" },
          { id: "b", label: "15x" },
          { id: "c", label: "30x" },
          { id: "d", label: "300x" },
        ],
        correctOptionId: "c",
        explanation: "P/E = Price ÷ EPS = 450 ÷ 15 = 30x.",
      },
    },
  ],
};
