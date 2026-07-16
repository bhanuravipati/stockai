"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegenerateInsightsButton({ symbol }: { symbol: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${symbol}/regenerate-insights`, { method: "POST" });
      const data = await res.json();
      if (data.stub) {
        toast.info("AI service not connected yet", { description: data.message });
      } else {
        toast.success("Insights regenerated");
      }
    } catch {
      toast.error("Failed to regenerate insights");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      Regenerate Insights
    </Button>
  );
}
