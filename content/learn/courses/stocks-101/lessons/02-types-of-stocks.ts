import type { Lesson } from "../../../types";

export const typesOfStocks: Lesson = {
  id: "stocks-101/types-of-stocks",
  slug: "types-of-stocks",
  title: "Types of Stocks",
  summary: "Not every stock plays the same role — here's how to tell them apart.",
  estimatedMinutes: 6,
  content: [
    { type: "heading", text: "Not all stocks are the same" },
    {
      type: "prose",
      body: [
        "Once you know a handful of simple labels, reading about any company gets a lot easier — because most stocks fall into a few well-known buckets. None of this is complicated; it's really just a vocabulary you'll start recognizing everywhere.",
      ],
    },

    { type: "heading", text: "By size: large-cap, mid-cap, small-cap" },
    {
      type: "prose",
      body: [
        "A company's \"market cap\" is simply its share price multiplied by its total shares outstanding — a rough price tag for the whole company. That number sorts stocks into three familiar buckets:",
        "Large-cap: big, well-established names most people have heard of — think Reliance, TCS, or HDFC Bank. Mid-cap: solid, growing companies that are past the risky early stage but not yet giants. Small-cap: smaller, younger, or more niche companies — higher potential upside, but a bumpier ride.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      body: "Bigger isn't automatically \"safer\" forever, but as a general pattern: large-caps tend to move more slowly and steadily, while small-caps swing harder in both directions.",
    },
    {
      type: "checkpoint",
      question: {
        id: "market-cap-risk",
        prompt: "Compared to a large-cap stock, a small-cap stock is generally...",
        options: [
          { id: "a", label: "Always a guaranteed safer bet" },
          { id: "b", label: "More volatile, with more upside and downside risk" },
          { id: "c", label: "Impossible to buy on a stock exchange" },
          { id: "d", label: "Exactly the same risk level" },
        ],
        correctOptionId: "b",
        explanation: "Smaller companies tend to be less established and less liquid, so their prices usually swing harder — for better or worse.",
      },
    },

    { type: "heading", text: "By ownership: common vs. preferred stock" },
    {
      type: "prose",
      body: [
        "When people say \"buying stock,\" they almost always mean common stock — the kind that gives you voting rights and a variable dividend (if the company pays one at all). This is what you'd buy through a regular brokerage account.",
        "Preferred stock is a less common cousin: it usually skips voting rights, but in exchange, it gets a more fixed, priority dividend — and gets paid before common shareholders if the company is ever wound down.",
      ],
    },
    {
      type: "checkpoint",
      question: {
        id: "common-vs-preferred",
        prompt: "If a company pays out its dividend, who typically gets paid first — common or preferred shareholders?",
        options: [
          { id: "a", label: "Common shareholders, always" },
          { id: "b", label: "Preferred shareholders" },
          { id: "c", label: "Neither — they're paid at random" },
          { id: "d", label: "It's decided by a public vote" },
        ],
        correctOptionId: "b",
        explanation: "Preferred stock trades away voting rights for priority — its dividend gets paid out before common shareholders see anything.",
      },
    },

    { type: "heading", text: "Blue-chip, cyclical, and defensive stocks" },
    {
      type: "prose",
      body: [
        "A few more labels you'll see constantly: Blue-chip stocks are the large, reputable, financially sound companies that have proven themselves over many years — the reliable veterans of the market.",
        "Cyclical stocks rise and fall with the broader economy — think cars, real estate, or luxury goods. When people feel confident and spend freely, these do well; in a downturn, they're often hit hardest.",
        "Defensive stocks barely notice the economy at all — think everyday essentials like food, healthcare, or electricity. People buy toothpaste and pay their electricity bill whether the economy is booming or not.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      body: "Think of defensive stocks like your favorite comfort snack brand — rain or shine, boom or bust, people keep buying it.",
    },
    {
      type: "checkpoint",
      question: {
        id: "cyclical-vs-defensive",
        prompt: "A company that makes air conditioners sees its sales swing hard with economic booms and busts. This company is best described as...",
        options: [
          { id: "a", label: "Defensive" },
          { id: "b", label: "Preferred" },
          { id: "c", label: "Cyclical" },
          { id: "d", label: "Small-cap, by definition" },
        ],
        correctOptionId: "c",
        explanation: "Big-ticket, discretionary purchases like air conditioners track the economy closely — that's the hallmark of a cyclical stock.",
      },
    },
  ],
};
