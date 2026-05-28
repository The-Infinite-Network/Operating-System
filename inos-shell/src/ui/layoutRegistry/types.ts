import type { ComponentType } from "react";

export type WidgetDefinition<TProps = Record<string, unknown>> = {
  id: string;
  title: string;
  description: string;
  defaultSize?: "sm" | "md" | "lg";
  component: ComponentType<TProps>;
};

export type LayoutWidgetConfig = {
  widgetId: string;
  visible: boolean;
  order: number;
  props?: Record<string, unknown>;
};

export type LayoutConfig = {
  pageId: string;
  widgets: LayoutWidgetConfig[];
};
