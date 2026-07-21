import type { Lesson } from "../../../types";

export const tradingVsInvesting: Lesson = {
  id: "stocks-101/trading-vs-investing",
  slug: "trading-vs-investing",
  title: "Trading vs. Investing",
  summary: "Same stock market, two very different games.",
  estimatedMinutes: 5,
  content: [
    { type: "heading", text: "Same market, very different games" },
    {
      type: "prose",
      body: [
        "\"Trading\" and \"investing\" both mean buying and selling stocks — but the timeframe, the goal, and the mindset behind them are almost completely different. Mixing them up is one of the easiest ways for a beginner to get burned.",
      ],
    },

    { type: "heading", text: "Investing: playing the long game" },
    {
      type: "prose",
      body: [
        "Investing means buying shares of a company and holding them for years, betting on the business — and the economy around it — growing over time. Along the way, the price will rise and fall constantly, but a long-term investor mostly ignores the day-to-day noise and stays focused on the destination.",
        "Picture someone buying shares today and simply holding them for the next fifteen years while they save for retirement — riding out every dip and rally in between.",
      ],
    },

    { type: "heading", text: "Trading: playing the short game" },
    {
      type: "prose",
      body: [
        "Trading means buying and selling over much shorter windows — anywhere from minutes to a few months — trying to profit from price swings themselves, rather than a company's long-term growth. Day trading closes every position the same day; swing trading holds for days or weeks.",
        "Trading demands a lot: constant attention, quick decisions, and a stomach for risk. It's also worth knowing upfront — most beginners who try to trade actively end up underperforming a simple, boring, long-term investing approach.",
      ],
    },
    {
      type: "callout",
      tone: "warn",
      body: "Trading isn't a shortcut to getting rich quickly — it's a demanding, skill-intensive pursuit where even most professionals struggle to consistently beat the market.",
    },
    {
      type: "checkpoint",
      question: {
        id: "trading-vs-investing-scenario",
        prompt: "Priya buys shares in a company and plans to hold them for the next 15 years while she saves for retirement. This is best described as...",
        options: [
          { id: "a", label: "Day trading" },
          { id: "b", label: "Swing trading" },
          { id: "c", label: "Investing" },
          { id: "d", label: "Preferred-stock trading" },
        ],
        correctOptionId: "c",
        explanation: "A multi-year holding period aimed at long-term growth — not short-term price swings — is the defining feature of investing, not trading.",
      },
    },

    { type: "heading", text: "Which one is right for you?" },
    {
      type: "prose",
      body: [
        "There's no need to decide right now — but for most people just starting out, long-term investing is both the easier and the historically more reliable path: understand what you own, stay patient, and let time do most of the work. That's exactly the mindset this course is built around.",
      ],
    },
    {
      type: "checkpoint",
      question: {
        id: "defining-feature-of-trading",
        prompt: "Which of these is a defining feature of trading rather than long-term investing?",
        options: [
          { id: "a", label: "Holding a stock for over a decade" },
          { id: "b", label: "Frequent buying and selling over short time frames" },
          { id: "c", label: "Owning a diversified portfolio" },
          { id: "d", label: "Reinvesting dividends automatically" },
        ],
        correctOptionId: "b",
        explanation: "Short holding periods and frequent buying/selling to catch price swings are what set trading apart from long-term investing.",
      },
    },
  ],
};
