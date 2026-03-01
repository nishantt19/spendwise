import type { CSSProperties } from "react";

// Renders the emoji icon stored in the category's `icon` database field.
// Falls back to a generic coin emoji when the field is null/empty.

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
  return (
    <span
      role="img"
      aria-hidden="true"
      className={className}
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        ...style,
      }}
    >
      {icon || "💰"}
    </span>
  );
}
