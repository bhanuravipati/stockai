import { IndustrySearch } from "@/components/industry/industry-search";

export default function IndustryPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Industry</h1>
        <p className="text-sm text-muted-foreground">Search a sector to browse its NSE + BSE stocks.</p>
      </div>
      <IndustrySearch />
    </div>
  );
}
