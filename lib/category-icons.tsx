import {
  BookOpen01,
  VideoRecorder,
  MedicalCross,
  Home03,
  User03,
  ShoppingCart03,
  ShoppingBag03,
  CreditCardRefresh,
  Car01,
  Plane,
  Flash,
  CurrencyRupee,
  CoinsStacked03,
  Snowflake02,
} from "@untitledui/icons";
import type { ComponentType, CSSProperties } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type IconProps = {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

// ─── Name → icon map ──────────────────────────────────────────────────────────

const CATEGORY_ICON_MAP: Record<string, ComponentType<IconProps>> = {
  "education": BookOpen01,
  "entertainment": VideoRecorder,
  "hospital": MedicalCross,
  "housing": Home03,
  "personal care": User03,
  "shopping": ShoppingCart03,
  "groceries": ShoppingBag03,
  "subscription": CreditCardRefresh,
  "subscriptions": CreditCardRefresh,
  "transportation": Car01,
  "travel": Plane,
  "utilities": Flash,
  "self transfer": CurrencyRupee,
  "others": CoinsStacked03,
  "other": CoinsStacked03,
  "food and dining": Snowflake02,
  "food & dining": Snowflake02,
};

export function getCategoryIconComponent(name: string): ComponentType<IconProps> {
  return CATEGORY_ICON_MAP[name.toLowerCase()] ?? CoinsStacked03;
}

// ─── CategoryIcon component ───────────────────────────────────────────────────

export function CategoryIcon({
  name,
  size = 14,
  color,
  className,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = getCategoryIconComponent(name);
  return <Icon size={size} color={color} className={className} style={style} />;
}
