import type { FC } from "react";
import type { WidgetProps } from "../types";
import { GaugeWidget } from "./GaugeWidget";
import { CardWidget } from "./CardWidget";
import { SparklineWidget } from "./SparklineWidget";
import { ClockWidget } from "./ClockWidget";
import { TextWidget } from "./TextWidget";

export const WIDGET_REGISTRY: Record<string, FC<WidgetProps>> = {
  gauge: GaugeWidget,
  card: CardWidget,
  sparkline: SparklineWidget,
  clock: ClockWidget,
  text: TextWidget,
};
