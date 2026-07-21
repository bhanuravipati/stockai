import type { Lesson } from "../../../types";

export const buildingADiversifiedPortfolio: Lesson = {
  id: "stocks-101/building-a-diversified-portfolio",
  slug: "building-a-diversified-portfolio",
  title: "Building a Diversified Portfolio",
  summary: "Why spreading your bets is the closest thing to a free lunch in investing.",
  estimatedMinutes: 5,
  content: [
    { type: "heading", text: "Don't let one bad quarter sink you" },
    {
      type: "prose",
      body: [
        "Every individual stock carries risks specific to that one company: a bad product launch, a lawsuit, a key executive leaving. This is called company-specific risk, and it's largely avoidable.",
        "Diversification means spreading your money across many companies — and ideally across sectors that don't all rise and fall together — so that one company's bad quarter doesn't sink your whole portfolio.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      body: "Diversification doesn't just mean owning more stocks — owning 10 companies that are all in the same industry still leaves you exposed if that whole industry has a bad year.",
    },
    { type: "widget", widget: "diversification-pie-simulator" },
    {
      type: "prose",
      body: [
        "There's no single \"correct\" allocation — it depends on your goals and how much short-term ups and downs you can tolerate. But the underlying principle holds broadly: the more concentrated a portfolio, the more its fate rides on a small number of bets going right.",
      ],
    },
    {
      type: "checkpoint",
      question: {
        id: "compare-portfolios",
        prompt: "Portfolio A holds 90% in one company. Portfolio B spreads its money evenly across 8 companies in different sectors. Which is more diversified?",
        options: [
          { id: "a", label: "Portfolio A, because it's simpler to track" },
          { id: "b", label: "Portfolio B, because no single company or sector can sink it" },
          { id: "c", label: "They're equally diversified" },
          { id: "d", label: "Diversification only matters for bonds, not stocks" },
        ],
        correctOptionId: "b",
        explanation: "Portfolio B spreads company-specific and sector-specific risk across many independent bets, so no single one dominates the outcome.",
      },
    },
  ],
};
