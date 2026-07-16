import { Badge } from "@/components/ui/badge";

/** Renders nothing unless price data + circuit limits are both present and the price is actually at a limit. */
export function CircuitBadge({
  price,
  upperCircuitLimit,
  lowerCircuitLimit,
}: {
  price?: number | null;
  upperCircuitLimit?: number | null;
  lowerCircuitLimit?: number | null;
}) {
  if (price == null) return null;

  if (upperCircuitLimit != null && price >= upperCircuitLimit) {
    return (
      <Badge variant="outline" className="border-gain/40 bg-gain/10 text-gain">
        At Upper Circuit
      </Badge>
    );
  }

  if (lowerCircuitLimit != null && price <= lowerCircuitLimit) {
    return <Badge variant="destructive">At Lower Circuit</Badge>;
  }

  return null;
}
