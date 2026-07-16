import { OverviewClient } from "./overview-client";

export default async function CompanyOverviewPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  return <OverviewClient symbol={symbol} />;
}
