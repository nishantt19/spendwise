import React, { type CSSProperties, type ComponentType } from "react";
import {
  ShoppingCart01, ShoppingBag01,
  Home01, HomeSmile, HomeLine,
  Car01, Plane, Bus, Train, Truck01,
  Receipt, ReceiptCheck,
  MedicalCross, MedicalCircle,
  GraduationHat01, BookOpen01, BookClosed,
  GamingPad01, Film01, Monitor01, MusicNote01, Microphone01, Palette, Camera01,
  Activity, ActivityHeart,
  Phone01,
  Lightbulb01, Zap, ZapFast, Drop,
  Gift01, Gift02,
  Repeat01,
  Scissors01, Brush01,
  Briefcase01, Building07, Laptop01,
  TrendUp01, TrendDown01,
  CoinsHand, CreditCard01, CreditCard02, Bank, BankNote01, PiggyBank01,
  Wallet01, Wallet02,
  Globe01,
  Heart, HeartCircle, HeartHand,
  Diamond01, Award01, Star01,
  Tag01, Package,
} from "@untitledui/icons";

type IconProps = { size?: number; className?: string; style?: CSSProperties };

// Map of icon name string (stored in DB) → component
export const ICON_NAME_MAP: Record<string, ComponentType<IconProps>> = {
  ShoppingCart01, ShoppingBag01,
  Home01, HomeSmile, HomeLine,
  Car01, Plane, Bus, Train, Truck01,
  Receipt, ReceiptCheck,
  MedicalCross, MedicalCircle,
  GraduationHat01, BookOpen01, BookClosed,
  GamingPad01, Film01, Monitor01, MusicNote01, Microphone01, Palette, Camera01,
  Activity, ActivityHeart,
  Phone01,
  Lightbulb01, Zap, ZapFast, Drop,
  Gift01, Gift02,
  Repeat01,
  Scissors01, Brush01,
  Briefcase01, Building07, Laptop01,
  TrendUp01, TrendDown01,
  CoinsHand, CreditCard01, CreditCard02, Bank, BankNote01, PiggyBank01,
  Wallet01, Wallet02,
  Globe01,
  Heart, HeartCircle, HeartHand,
  Diamond01, Award01, Star01,
  Tag01, Package,
};

// Legacy: maps old emoji values (still in DB for categories created before the icon-name migration) → component.
// DO NOT remove entries — existing rows may still reference these emojis.
// New categories always store an icon name string (e.g. "ShoppingCart01") resolved via ICON_NAME_MAP above.
const EMOJI_TO_ICON: Record<string, ComponentType<IconProps>> = {
  "🛒": ShoppingCart01, "🛍": ShoppingBag01, "🛍️": ShoppingBag01,
  "🍽": Receipt, "🍽️": Receipt, "🍔": Receipt, "🍕": Receipt,
  "🍜": Receipt, "🥗": Receipt, "🥘": Receipt, "🌮": Receipt, "🍱": Receipt,
  "☕": Zap, "🍷": Receipt, "🍺": Receipt, "🍹": Receipt,
  "🏠": Home01, "🏡": HomeSmile, "🏘": HomeLine, "🏘️": HomeLine,
  "🚗": Car01, "🚕": Car01, "🚙": Car01, "🚌": Bus, "🚆": Train, "🚚": Truck01,
  "✈": Plane, "✈️": Plane, "🛫": Plane, "🌍": Globe01,
  "💊": MedicalCross, "💉": MedicalCircle, "🏥": MedicalCircle,
  "🏋": Activity, "🏋️": Activity, "🤸": ActivityHeart,
  "🏃": Activity, "🚴": Activity, "🏊": ActivityHeart, "🏊️": ActivityHeart,
  "🎮": GamingPad01, "🎬": Film01, "📺": Monitor01, "🎭": Star01,
  "🎪": Star01, "🎨": Palette, "📷": Camera01, "📸": Camera01,
  "🎵": MusicNote01, "🎶": MusicNote01, "🎤": Microphone01,
  "🎸": MusicNote01, "🎹": MusicNote01, "🎻": MusicNote01,
  "🎓": GraduationHat01, "📚": BookOpen01, "📖": BookOpen01, "📕": BookClosed,
  "💰": CoinsHand, "💵": BankNote01, "💳": CreditCard01, "🏦": Bank,
  "💎": Diamond01, "📈": TrendUp01, "📉": TrendDown01, "💹": TrendUp01,
  "🐖": PiggyBank01, "🏧": Bank,
  "💼": Briefcase01, "🏢": Building07, "🏗": Building07,
  "💡": Lightbulb01, "⚡": Zap, "🔌": ZapFast, "💧": Drop, "🌊": Drop,
  "📱": Phone01, "📞": Phone01, "☎": Phone01,
  "🎁": Gift01, "🎀": Gift02, "🎊": Gift01,
  "✂": Scissors01, "✂️": Scissors01, "💇": Scissors01, "💇️": Scissors01,
  "🧹": Brush01, "🎗": Award01,
  "🔄": Repeat01,
  "🐾": HeartHand, "👶": HeartCircle, "🧸": HeartCircle,
  "💅": Diamond01, "👑": Award01, "💐": Heart, "🌸": Heart,
  "📦": Package, "🚛": Truck01,
  // income extras
  "💻": Laptop01, "🤝": HeartHand,
};

const FALLBACK_ICON: ComponentType<IconProps> = Tag01;

// Resolves icon name (new) or emoji (legacy) → component
export function CategoryIcon({
  icon,
  size = 14,
  className,
  style,
}: {
  icon: string | null | undefined;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const IconComponent =
    (icon && ICON_NAME_MAP[icon]) ??
    (icon && EMOJI_TO_ICON[icon]) ??
    FALLBACK_ICON;
  return React.createElement(IconComponent, { size, className, style });
}
