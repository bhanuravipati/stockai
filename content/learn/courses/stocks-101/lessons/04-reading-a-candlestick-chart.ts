import type { Lesson } from "../../../types";

export const readingACandlestickChart: Lesson = {
  id: "stocks-101/reading-a-candlestick-chart",
  slug: "reading-a-candlestick-chart",
  title: "Reading a Candlestick Chart",
  summary: "Decode the four numbers packed into every candle.",
  estimatedMinutes: 5,
  content: [
    { type: "heading", text: "Four prices, one shape" },
    {
      type: "prose",
      body: [
        "Most price charts you'll see aren't simple lines — they're made of candlesticks, one per day (or hour, or minute). Each candle packs four numbers into a single shape: the Open, High, Low, and Close for that period.",
        "The thin line — the wick — marks the full range the price traveled, from the lowest trade to the highest. The thick rectangle — the body — marks where the price started and ended.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      body: "Color is a shortcut for direction: a green (or hollow) candle closed higher than it opened — buyers won the day. A red (or filled) candle closed lower — sellers won.",
    },
    { type: "widget", widget: "candlestick-anatomy" },
    {
      type: "prose",
      body: [
        "A single candle tells you about one period. String hundreds of them together and patterns emerge — long green candles in a row suggest sustained buying pressure, long wicks suggest a price got pushed hard in one direction and then reversed.",
      ],
    },
    {
      type: "checkpoint",
      question: {
        id: "bullish-vs-bearish",
        prompt: "A candle opened at ₹100 and closed at ₹92. Is this candle bullish or bearish?",
        options: [
          { id: "a", label: "Bullish — the price went up" },
          { id: "b", label: "Bearish — the price closed lower than it opened" },
          { id: "c", label: "Neither — you need the high and low too" },
          { id: "d", label: "It depends on the wick length" },
        ],
        correctOptionId: "b",
        explanation: "Bearish just means close < open — here it closed ₹8 lower than it opened, so sellers won that period.",
      },
    },
  ],
};
