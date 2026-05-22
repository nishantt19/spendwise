"use client";

import { useTheme } from "next-themes";
import { Sun, Moon01 } from "@untitledui/icons";
import { useEffect, useState } from "react";

export function AuthThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="absolute top-5 right-5 flex items-center justify-center size-9 rounded-lg border border-border-strong bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="size-4" /> : <Moon01 className="size-4" />}
    </button>
  );
}
