export const inputSizeVariants = {
  small:   "h-8 text-11 px-2   sm:h-9  sm:text-xs sm:px-2.5",
  default: "h-9 text-xs px-2.5 sm:h-10 sm:text-13 sm:px-3",
  large:   "h-10 text-13 px-3  sm:h-11 sm:text-sm sm:px-3.5",
} as const;

export const selectTriggerVariants = {
  small:   "h-8 text-11 px-2   sm:h-9  sm:text-xs sm:px-2.5",
  default: "h-9 text-xs px-2.5 sm:h-10 sm:text-13 sm:px-3",
  large:   "h-10 text-13 px-3  sm:h-11 sm:text-sm sm:px-3.5",
} as const;

export const selectItemVariants = {
  small:   "text-11 py-1   px-1.5 sm:text-xs sm:py-1.5 sm:px-2",
  default: "text-xs py-1.5 px-2   sm:text-13 sm:py-2   sm:px-2.5",
  large:   "text-13 py-2   px-2.5 sm:text-sm sm:py-2.5 sm:px-3",
} as const;

export const textareaSizeVariants = {
  small:   "text-11 px-2   py-1.5 sm:text-xs sm:py-2   sm:px-2.5",
  default: "text-xs px-2.5 py-2   sm:text-13 sm:py-2.5 sm:px-3",
  large:   "text-13 px-3   py-2.5 sm:text-sm sm:py-3   sm:px-3.5",
} as const;

export type InputSize = keyof typeof inputSizeVariants;
