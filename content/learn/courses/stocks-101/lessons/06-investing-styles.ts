import type { Lesson } from "../../../types";

export const investingStyles: Lesson = {
  id: "stocks-101/investing-styles",
  slug: "investing-styles",
  title: "Investing Styles: Growth, Value & More",
  summary: "Same market, different playbooks — find the philosophy that fits.",
  estimatedMinutes: 5,
  content: [
    { type: "heading", text: "Different investors, different playbooks" },
    {
      type: "prose",
      body: [
        "Ask ten investors how they pick stocks and you'll get a handful of different philosophies — not because some are right and some are wrong, but because they're solving the same problem in different ways. Two of the biggest schools of thought: growth and value.",
      ],
    },

    { type: "heading", text: "Growth investing" },
    {
      type: "prose",
      body: [
        "Growth investors hunt for companies whose profits and revenue are expanding fast, betting that the company's best days are still ahead. These businesses often reinvest every rupee back into expansion instead of paying dividends — and the market usually prices that optimism in with a higher P/E ratio.",
        "Picture a young company doubling its customer base every year — growth investors are happy to pay a premium today for a much bigger business tomorrow.",
      ],
    },

    { type: "heading", text: "Value investing" },
    {
      type: "prose",
      body: [
        "Value investors do the opposite: they hunt for solid companies that look cheap relative to their actual earnings — often measured by a low P/E ratio — betting that the market has temporarily mispriced them and will eventually catch on.",
        "Picture a well-established, profitable company that's fallen out of favor for reasons that don't really threaten its business — value investors see a bargain where others see a company nobody's talking about.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      body: "If growth investing is \"pay more for a company that's about to get much bigger,\" value investing is \"pay less for a company that's already solid.\" Same goal — profit — very different entry points.",
    },
    {
      type: "checkpoint",
      question: {
        id: "growth-vs-value",
        prompt: "An investor looks for companies whose share price seems cheap relative to their earnings, betting the market will eventually correct itself. This investor is practicing...",
        options: [
          { id: "a", label: "Growth investing" },
          { id: "b", label: "Value investing" },
          { id: "c", label: "Day trading" },
          { id: "d", label: "Preferred-stock investing" },
        ],
        correctOptionId: "b",
        explanation: "Hunting for stocks that look underpriced relative to fundamentals — and waiting for the market to notice — is the core idea behind value investing.",
      },
    },

    { type: "heading", text: "Other styles: income and index investing" },
    {
      type: "prose",
      body: [
        "Income (or dividend) investing prioritizes companies that pay steady, reliable dividends — often the same blue-chip and defensive stocks from the last lesson — aiming for cash flow as much as price growth.",
        "Index investing skips picking individual companies altogether: instead, you buy a fund that holds a whole basket of stocks tracking an entire market, like the Nifty 50. The philosophy is simple — if consistently picking winners is hard, why not just own the whole market?",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      body: "None of these styles is the single \"correct\" one — plenty of investors blend several. Knowing the vocabulary just makes it easier to understand what strategy you're actually following.",
    },
    {
      type: "checkpoint",
      question: {
        id: "index-investing",
        prompt: "Which investing style involves buying a fund that mirrors an entire market index, rather than picking individual companies?",
        options: [
          { id: "a", label: "Growth investing" },
          { id: "b", label: "Value investing" },
          { id: "c", label: "Index investing" },
          { id: "d", label: "Preferred-stock investing" },
        ],
        correctOptionId: "c",
        explanation: "Index investing intentionally skips stock-picking — you buy a basket that tracks a whole index, like the Nifty 50, in one go.",
      },
    },
  ],
};
