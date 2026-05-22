import * as React from "react";

import { cn } from "@/lib/utils";
import { textareaSizeVariants, type InputSize } from "@/lib/variants";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  size?: InputSize;
}

function Textarea({ className, size = "default", ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full rounded-md border border-input bg-background text-foreground",
        "placeholder:text-muted-foreground shadow-xs transition-[color,box-shadow] resize-y min-h-20",
        "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        textareaSizeVariants[size],
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
