"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TypographyH2 } from "@/components/ui/typography";

export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-2xl">⚠️</span>
      </div>
      <div>
        <TypographyH2>Unable to load categories</TypographyH2>
        <p className="mt-1 text-xs sm:text-13 text-muted-foreground">
          There was a problem fetching your categories. Please try again.
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
