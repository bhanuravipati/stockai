"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialTable, type RowDef, type StatementRow } from "@/components/company/financial-table";

export function PeriodToggleTable({
  annual,
  quarterly,
  rows,
}: {
  annual: StatementRow[];
  quarterly: StatementRow[];
  rows: RowDef[];
}) {
  const [period, setPeriod] = useState<"annual" | "quarterly">("annual");

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as "annual" | "quarterly")}>
        <TabsList>
          <TabsTrigger value="annual">Annual</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
        </TabsList>
      </Tabs>
      <FinancialTable statements={period === "annual" ? annual : quarterly} rows={rows} />
    </div>
  );
}
