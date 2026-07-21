import type { Lesson } from "../../../types";

export const whatIsAStock: Lesson = {
  id: "stocks-101/what-is-a-stock",
  slug: "what-is-a-stock",
  title: "What Is a Stock?",
  summary: "Owning a piece of a company, in plain terms.",
  estimatedMinutes: 4,
  content: [
    { type: "heading", text: "A stock is a slice of ownership" },
    {
      type: "prose",
      body: [
        "When a company wants to raise money to grow, it can sell small slices of itself to the public. Each slice is called a share, and the total collection of shares is the company's stock.",
        "If a company has issued 10,000,000 shares and you own 10,000 of them, you own 0.1% of that company — no more, no less. Your 0.1% entitles you to 0.1% of its profits (if it pays a dividend) and 0.1% of the vote at shareholder meetings.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      body: "Buying a share doesn't make you a lender to the company — it makes you a part-owner. That's the key difference between a stock and a bond, which you'll see in a later course.",
    },
    {
      type: "prose",
      body: [
        "The number of shares a company has issued is called its shares outstanding. It doesn't change often — only when the company issues new shares (dilution) or buys some back (buybacks).",
      ],
    },
    { type: "widget", widget: "ownership-stake-slider" },
    {
      type: "checkpoint",
      question: {
        id: "ownership-percent",
        prompt: "A company has 2,000,000 shares outstanding. You own 20,000 of them. What percentage of the company do you own?",
        options: [
          { id: "a", label: "0.1%" },
          { id: "b", label: "1%" },
          { id: "c", label: "2%" },
          { id: "d", label: "20%" },
        ],
        correctOptionId: "b",
        explanation: "20,000 ÷ 2,000,000 = 0.01, which is 1%.",
      },
    },
  ],
};
