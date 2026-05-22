import { cn } from "@/lib/utils";

export const TypographyH1 = ({ className, children, ...props }: React.ComponentProps<"h1">) => (
  <h1 className={cn("text-2xl sm:text-3xl text-foreground font-bold", className)} {...props}>
    {children}
  </h1>
);

export const TypographyH2 = ({ className, children, ...props }: React.ComponentProps<"h2">) => (
  <h2 className={cn("text-xl sm:text-22 text-foreground font-semibold tracking-tight", className)} {...props}>
    {children}
  </h2>
);

export const TypographyH3 = ({ className, children, ...props }: React.ComponentProps<"h3">) => (
  <h3 className={cn("text-lg sm:text-xl text-foreground font-semibold", className)} {...props}>
    {children}
  </h3>
);

export const TypographyH4 = ({ className, children, ...props }: React.ComponentProps<"h4">) => (
  <h4 className={cn("text-base sm:text-lg text-foreground font-semibold", className)} {...props}>
    {children}
  </h4>
);

/** Card-level heading: text-sm on mobile, text-15 on sm+ */
export const TypographyH5 = ({ className, children, ...props }: React.ComponentProps<"h5">) => (
  <h5 className={cn("text-sm sm:text-15 text-foreground font-semibold", className)} {...props}>
    {children}
  </h5>
);
