import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all duration-300 ease-in-out outline-none select-none cursor-pointer disabled:cursor-not-allowed focus-visible:border-transparent focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary border border-primary text-primary-foreground hover:bg-linear-to-r hover:from-primary hover:to-primary-gradient",
        "primary-outline":
          "shadow-xs bg-background border-primary text-primary hover:bg-accent hover:border-primary-hover hover:text-primary-hover aria-expanded:bg-accent aria-expanded:text-primary-hover aria-expanded:border-primary-hover",
        outline:
          "shadow-xs border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        tertiary:
          "bg-accent/70 text-primary hover:bg-accent hover:text-primary-hover aria-expanded:bg-accent aria-expanded:text-primary-hover",
        "primary-ghost":
          "text-primary hover:bg-accent hover:text-primary-hover aria-expanded:bg-accent aria-expanded:text-primary-hover",
        "secondary-ghost":
          "hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        "primary-success":
          "bg-success border border-success text-primary-foreground hover:bg-success/90 focus-visible:ring-success/50",
        success:
          "bg-success/10 border border-success/40 text-success hover:bg-success/20 focus-visible:border-success/40 focus-visible:ring-success/20",
        link: "text-primary underline-offset-4 hover:text-primary-hover hover:underline",
      },
      size: {
        sm: "h-8 gap-1 px-2 text-11 sm:h-9 sm:gap-1.5 sm:px-2.5 sm:text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        default:
          "h-9 gap-1.5 px-2.5 text-xs sm:h-10 sm:gap-2 sm:px-3 sm:text-13 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-10 gap-2 px-3 text-13 sm:h-11 sm:gap-2.5 sm:px-3.5 sm:text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8 sm:size-9",
        "icon-sm": "size-7 sm:size-8",
        "icon-lg": "size-9 sm:size-10",
        filter:
          "h-6.5 gap-1 px-2 text-10 sm:h-7 sm:gap-1.5 sm:px-2.5 sm:text-11",
        "filter-icon": "size-6.5 sm:size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
