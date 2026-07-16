export default async function CompanySwotPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold">AI-Generated SWOT Analysis</h2>
        <p className="text-sm text-muted-foreground">
          SWOT analysis for <strong>{symbol}</strong> powered by live financial data and LLM insights
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 font-semibold">🚀 Phase 3 Feature</h3>
        <p className="text-sm text-muted-foreground">
          In Phase 3, SWOT analysis will be generated using:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>✓ Live financial data from yfinance (P&L, Balance Sheet, Ratios)</li>
          <li>✓ Peer company comparison data</li>
          <li>✓ Latest news sentiment analysis</li>
          <li>✓ LangChain + LangGraph orchestration</li>
          <li>✓ Groq Cloud LLM for fast generation</li>
        </ul>
      </div>

      <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Current Status:</strong> Ready for AI pipeline integration. All live data APIs in place.
        </p>
      </div>
    </div>
  );
}
