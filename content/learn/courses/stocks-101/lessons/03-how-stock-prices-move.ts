import type { Lesson } from "../../../types";

export const howStockPricesMove: Lesson = {
  id: "stocks-101/how-stock-prices-move",
  slug: "how-stock-prices-move",
  title: "How Stock Prices Move",
  summary: "Supply, demand, and why prices tick up and down all day.",
  estimatedMinutes: 4,
  content: [
    { type: "heading", text: "Every price is a tug-of-war" },
    {
      type: "prose",
      body: [
        "A stock's price isn't set by the company or by any single authority — it's set by whatever price the next buyer and the next seller agree on. Every trade is a tiny negotiation.",
        "When more people want to buy a stock than sell it at the current price, buyers start offering a little more to get someone to sell to them — and the price rises. When more people want to sell than buy, sellers start accepting a little less just to find a buyer — and the price falls.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      body: "This is why news moves prices instantly: good news makes more people want to buy (or fewer want to sell), which shifts the balance and the price follows — often before you've even finished reading the headline.",
    },
    { type: "widget", widget: "supply-demand-price" },
    {
      type: "prose",
      body: [
        "Zoom out far enough and the same mechanism explains long-term moves too: a company that keeps growing its profits attracts more buyers over years, pushing its price up over time — even though any single day's move is just this same buyer/seller tug-of-war playing out.",
      ],
    },
    {
      type: "checkpoint",
      question: {
        id: "demand-vs-supply",
        prompt: "If far more people suddenly want to buy a stock than want to sell it, what typically happens to the price?",
        options: [
          { id: "a", label: "It falls, since more buyers means more competition" },
          { id: "b", label: "It rises, since buyers compete for a limited supply of sellers" },
          { id: "c", label: "It stays exactly the same" },
          { id: "d", label: "It becomes impossible to trade" },
        ],
        correctOptionId: "b",
        explanation: "With more buyers than sellers at the current price, buyers bid the price up to convince someone to sell.",
      },
    },
  ],
};
