import type { ComponentType } from "react";
import type { WidgetKey } from "@/content/learn/types";
import { OwnershipStakeSlider } from "./ownership-stake-slider";
import { SupplyDemandPriceWidget } from "./supply-demand-price-widget";
import { CandlestickAnatomyDiagram } from "./candlestick-anatomy-diagram";
import { PeRatioExplorer } from "./pe-ratio-explorer";
import { RealPeLookup } from "./real-pe-lookup";
import { DiversificationPieSimulator } from "./diversification-pie-simulator";

// Widgets have heterogeneous, unrelated prop shapes — this lookup table is a deliberate type-erasure boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WIDGET_REGISTRY: Record<WidgetKey, ComponentType<any>> = {
  "ownership-stake-slider": OwnershipStakeSlider,
  "supply-demand-price": SupplyDemandPriceWidget,
  "candlestick-anatomy": CandlestickAnatomyDiagram,
  "pe-ratio-explorer": PeRatioExplorer,
  "real-pe-lookup": RealPeLookup,
  "diversification-pie-simulator": DiversificationPieSimulator,
};
