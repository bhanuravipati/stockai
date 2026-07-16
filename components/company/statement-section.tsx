"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function StatementSection({
  title,
  table,
  dashboard,
  actions,
}: {
  title: string;
  table: React.ReactNode;
  dashboard: React.ReactNode;
  /** Optional extra controls (e.g. an "Edit columns" button) shown next to the Table/Dashboard toggle. */
  actions?: React.ReactNode;
}) {
  const [view, setView] = useState<"table" | "dashboard">("table");

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {actions}
          <Tabs value={view} onValueChange={(v) => setView(v as "table" | "dashboard")}>
            <TabsList variant="line">
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      {view === "table" ? table : dashboard}
    </div>
  );
}
