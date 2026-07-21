import type { Course } from "../../types";
import { whatIsAStock } from "./lessons/01-what-is-a-stock";
import { typesOfStocks } from "./lessons/02-types-of-stocks";
import { howStockPricesMove } from "./lessons/03-how-stock-prices-move";
import { readingACandlestickChart } from "./lessons/04-reading-a-candlestick-chart";
import { keyRatiosPe } from "./lessons/05-key-ratios-pe";
import { investingStyles } from "./lessons/06-investing-styles";
import { tradingVsInvesting } from "./lessons/07-trading-vs-investing";
import { buildingADiversifiedPortfolio } from "./lessons/08-building-a-diversified-portfolio";
import { stocks101Quiz } from "./quiz";

const lessons = [
  whatIsAStock,
  typesOfStocks,
  howStockPricesMove,
  readingACandlestickChart,
  keyRatiosPe,
  investingStyles,
  tradingVsInvesting,
  buildingADiversifiedPortfolio,
];

export const stocks101: Course = {
  slug: "stocks-101",
  title: "Stocks 101",
  description: "The fundamentals of owning, pricing, and evaluating stocks — from what a share actually is and the different types of stocks, through investing styles and trading vs. investing, to building a diversified portfolio.",
  accent: "bg-chart-3/10 text-chart-3",
  status: "available",
  estimatedMinutes: lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0),
  lessons,
  endOfCourseQuiz: stocks101Quiz,
};
