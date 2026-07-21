import type { MCQQuestion } from "../../types";

export const stocks101Quiz: MCQQuestion[] = [
  {
    id: "quiz-ownership",
    prompt: "Buying a share of a company mainly makes you...",
    options: [
      { id: "a", label: "A lender the company must repay on a fixed schedule" },
      { id: "b", label: "A part-owner entitled to a proportional slice of profits and votes" },
      { id: "c", label: "An employee of the company" },
      { id: "d", label: "Guaranteed a fixed annual return" },
    ],
    correctOptionId: "b",
    explanation: "Shares represent ownership, not a loan — that's what separates stocks from bonds.",
  },
  {
    id: "quiz-price-driver",
    prompt: "Day to day, a stock's price is most directly determined by...",
    options: [
      { id: "a", label: "The company's board of directors" },
      { id: "b", label: "A government-set official value" },
      { id: "c", label: "What buyers and sellers agree to trade at" },
      { id: "d", label: "The stock exchange's opening price, fixed for the day" },
    ],
    correctOptionId: "c",
    explanation: "Prices are negotiated trade by trade between buyers and sellers — there's no other price-setter.",
  },
  {
    id: "quiz-candle-color",
    prompt: "On most candlestick charts, what does a red (or filled) candle indicate?",
    options: [
      { id: "a", label: "The stock is halted from trading" },
      { id: "b", label: "It closed lower than it opened" },
      { id: "c", label: "It closed higher than it opened" },
      { id: "d", label: "The company reported a loss that quarter" },
    ],
    correctOptionId: "b",
    explanation: "Red/filled = bearish = close below open. It says nothing directly about quarterly profit.",
  },
  {
    id: "quiz-pe-meaning",
    prompt: "A P/E ratio of 25x roughly means...",
    options: [
      { id: "a", label: "Investors are paying ₹25 for every ₹1 of the company's annual profit" },
      { id: "b", label: "The stock has risen 25% this year" },
      { id: "c", label: "The company pays a 25% dividend" },
      { id: "d", label: "The stock will double in 25 months" },
    ],
    correctOptionId: "a",
    explanation: "P/E = price ÷ EPS, so a 25x P/E means 25 rupees of price per rupee of annual earnings.",
  },
  {
    id: "quiz-diversification-goal",
    prompt: "The main goal of diversifying a portfolio is to...",
    options: [
      { id: "a", label: "Guarantee higher returns than any single stock" },
      { id: "b", label: "Reduce how much one company or sector's bad outcome can hurt you" },
      { id: "c", label: "Avoid paying any brokerage fees" },
      { id: "d", label: "Make the portfolio easier to track on one page" },
    ],
    correctOptionId: "b",
    explanation: "Diversification spreads company- and sector-specific risk — it manages risk, it doesn't guarantee returns.",
  },
  {
    id: "quiz-shares-outstanding",
    prompt: "A company's \"shares outstanding\" changes when...",
    options: [
      { id: "a", label: "The stock price moves up or down" },
      { id: "b", label: "The company issues new shares or buys some back" },
      { id: "c", label: "Every single trading day" },
      { id: "d", label: "A shareholder sells their shares to someone else" },
    ],
    correctOptionId: "b",
    explanation: "Ordinary buying and selling just moves shares between owners — the total count only changes via issuance or buybacks.",
  },
  {
    id: "quiz-cyclical",
    prompt: "A stock whose fortunes rise and fall closely with the broader economy — like carmakers or real estate — is best described as...",
    options: [
      { id: "a", label: "Defensive" },
      { id: "b", label: "Preferred" },
      { id: "c", label: "Cyclical" },
      { id: "d", label: "Index-linked" },
    ],
    correctOptionId: "c",
    explanation: "Cyclical stocks track the broader economy — they thrive when people spend freely and struggle when spending slows.",
  },
  {
    id: "quiz-growth-investing",
    prompt: "An investor who pays a premium for a fast-growing company, betting its profits will be much bigger down the line, is practicing...",
    options: [
      { id: "a", label: "Value investing" },
      { id: "b", label: "Growth investing" },
      { id: "c", label: "Day trading" },
      { id: "d", label: "Income investing" },
    ],
    correctOptionId: "b",
    explanation: "Growth investing means paying more today for a company expected to expand quickly — the opposite bet from value investing.",
  },
  {
    id: "quiz-trading-timeframe",
    prompt: "What most clearly separates trading from long-term investing?",
    options: [
      { id: "a", label: "Trading only happens on weekends" },
      { id: "b", label: "Trading uses much shorter holding periods, aiming to profit from price swings" },
      { id: "c", label: "Investing is illegal for individuals" },
      { id: "d", label: "There is no real difference" },
    ],
    correctOptionId: "b",
    explanation: "Trading is about short-term price movement over minutes to months; investing is about a business's growth over years.",
  },
];
