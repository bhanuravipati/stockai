"use client";

import { Slider } from "@/components/ui/slider";

interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  onValueChange: (value: number) => void;
}

export function LabeledSlider({ label, value, min, max, step = 1, formatValue, onValueChange }: LabeledSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{formatValue ? formatValue(value) : value}</span>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onValueChange(next as number)}
      />
    </div>
  );
}
