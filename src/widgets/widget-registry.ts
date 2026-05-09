import type { FC } from "react";
import type { WidgetProps } from "../types";
import { GaugeWidget } from "./GaugeWidget";
import { CardWidget } from "./CardWidget";
import { SparklineWidget } from "./SparklineWidget";
import { ClockWidget } from "./ClockWidget";
import { TextWidget } from "./TextWidget";
import { YouTubeWidget } from "../mods/YouTubeWidget";
import { DiscordWidget } from "../mods/DiscordWidget";
import { SteamWidget } from "../mods/SteamWidget";
import { GameFpsWidget } from "../mods/GameFpsWidget";

export const WIDGET_REGISTRY: Record<string, FC<WidgetProps>> = {
  gauge: GaugeWidget,
  card: CardWidget,
  sparkline: SparklineWidget,
  clock: ClockWidget,
  text: TextWidget,
  youtube: YouTubeWidget,
  discord: DiscordWidget,
  steam: SteamWidget,
  gamefps: GameFpsWidget,
};
