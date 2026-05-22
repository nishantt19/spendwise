"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

import { categorySchema } from "@/schema/categories";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/actions/categories";
import { CategoryIcon, ICON_NAME_MAP } from "@/lib/category-icons";
import { getCategoryColor, getCategoryBg } from "@/lib/category-color";
import type {
  Category,
  CategoryFormData,
  CategoryType,
} from "@/types/categories";

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#ec4899", "#64748b", "#6b7280", "#0f172a",
];

// Icon names (stored in DB) shown in picker per category type
const PRESET_ICON_NAMES: Record<CategoryType, string[]> = {
  expense: [
    "Receipt", "ShoppingCart01", "ShoppingBag01", "Home01",
    "Car01", "Plane", "Bus", "Train",
    "MedicalCross", "Activity", "GraduationHat01", "BookOpen01",
    "GamingPad01", "Film01", "Monitor01", "MusicNote01",
    "Phone01", "Lightbulb01", "Zap", "Repeat01",
    "Scissors01", "Gift01", "CoinsHand", "Package",
    "Palette", "Camera01", "Briefcase01", "Tag01",
  ],
  income: [
    "Briefcase01", "Laptop01", "Building07", "TrendUp01",
    "Home01", "Gift01", "CreditCard02", "Wallet02",
    "CoinsHand", "BankNote01", "Star01", "Award01",
    "HeartHand", "Globe01", "Diamond01", "PiggyBank01",
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: CategoryType;
  category?: Category | null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function CategoryDialog({
  open,
  onOpenChange,
  defaultType,
  category,
}: CategoryDialogProps) {
  const isEditing = !!category;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      icon: PRESET_ICON_NAMES[defaultType][0],
      color: "#6366f1",
      type: defaultType,
      monthly_budget: null,
    },
  });

  const isLoading = isSaving || isDeleting;

  const watchedName = useWatch({ control, name: "name" });
  const watchedIcon = useWatch({ control, name: "icon" });
  const watchedColor = useWatch({ control, name: "color" });
  const watchedType = useWatch({ control, name: "type" });

  const iconPresets = PRESET_ICON_NAMES[watchedType];
  const previewColor = getCategoryColor(watchedColor, isDark);
  const previewIconBg = getCategoryBg(watchedColor, isDark);

  useEffect(() => {
    if (!open) return;

    if (category) {
      reset({
        name: category.name,
        icon: category.icon ?? PRESET_ICON_NAMES[category.type][0],
        color: category.color,
        type: category.type,
        monthly_budget: category.monthly_budget ?? null,
      });
    } else {
      reset({
        name: "",
        icon: PRESET_ICON_NAMES[defaultType][0],
        color: "#6366f1",
        type: defaultType,
        monthly_budget: null,
      });
    }
  }, [open, category, defaultType, reset]);

  function onSubmit(values: CategoryFormData) {
    startSaveTransition(async () => {
      const result = isEditing
        ? await updateCategory(category.id, values)
        : await createCategory(values);

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onOpenChange(false);
    });
  }

  function onDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCategory(category!.id);

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex flex-col gap-0 p-0 w-[95vw] sm:max-w-md"
        side="right"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SheetHeader className="border-b px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <SheetTitle className="text-base sm:text-lg">
            {isEditing ? `Edit "${category.name}"` : "New Category"}
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-13">
            {isEditing
              ? "Update this category's details."
              : `Create a new ${defaultType} category.`}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col min-h-0 overflow-hidden"
        >
          {/* Scrollable fields */}
          <div className="flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
            {/* ── Live preview ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
              <div
                className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: previewIconBg, color: previewColor }}
              >
                <CategoryIcon icon={watchedIcon} size={20} style={{ color: previewColor }} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs sm:text-13 font-medium leading-none">
                  {watchedName || "Category name"}
                </p>
                <p className="mt-1 text-11 sm:text-xs capitalize text-muted-foreground">
                  {watchedType}
                </p>
              </div>
            </div>

            {/* ── Name ─────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="cat-name" className="text-xs sm:text-13">
                Name
              </FieldLabel>
              <Input
                id="cat-name"
                placeholder="e.g. Groceries"
                disabled={isLoading}
                className="text-xs sm:text-13"
                {...register("name")}
              />
              {errors.name && (
                <FieldDescription className="text-destructive text-xs sm:text-13">
                  {errors.name.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Monthly Budget (expense only) ─────────────────────── */}
            {watchedType === "expense" && (
              <Field>
                <FieldLabel htmlFor="cat-budget" className="text-xs sm:text-13">
                  Monthly Budget
                  <span className="ml-1.5 text-muted-foreground font-normal">(optional)</span>
                </FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-13 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="cat-budget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isLoading}
                    className="pl-7!"
                    {...register("monthly_budget", {
                      setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
                    })}
                  />
                </div>
                <FieldDescription className="text-xs sm:text-13">
                  Set a spending limit to track your progress each month.
                </FieldDescription>
                {errors.monthly_budget && (
                  <FieldDescription className="text-destructive text-xs sm:text-13">
                    {errors.monthly_budget.message}
                  </FieldDescription>
                )}
              </Field>
            )}

            {/* ── Icon picker ────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-13">Icon</FieldLabel>
              <div className="grid grid-cols-8 gap-0.5 pt-1">
                {iconPresets.map((iconName) => {
                  const isSelected = watchedIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setValue("icon", iconName, { shouldValidate: true })}
                      className={`flex size-8 sm:size-9 items-center justify-center rounded-lg transition-colors disabled:pointer-events-none focus:outline-none ${
                        isSelected ? "" : "hover:bg-muted"
                      }`}
                      style={
                        isSelected
                          ? { background: previewIconBg, color: previewColor }
                          : undefined
                      }
                      title={iconName}
                    >
                      <CategoryIcon
                        icon={iconName}
                        size={16}
                        style={isSelected ? { color: previewColor } : undefined}
                        className={isSelected ? undefined : "text-muted-foreground"}
                      />
                    </button>
                  );
                })}
              </div>
              {errors.icon && (
                <FieldDescription className="text-destructive text-xs sm:text-13">
                  {errors.icon.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Color ────────────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-13">Color</FieldLabel>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setValue("color", color, { shouldValidate: true })}
                    aria-label={color}
                    className="size-6 sm:size-7 rounded-full transition-transform hover:scale-110 focus:outline-none disabled:pointer-events-none"
                    style={{ backgroundColor: color }}
                  >
                    {watchedColor === color && (
                      <span className="flex items-center justify-center text-11 font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {errors.color && (
                <FieldDescription className="text-destructive text-xs sm:text-13">
                  {errors.color.message}
                </FieldDescription>
              )}
            </Field>

          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2 border-t px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            {isEditing && (
              <div className="flex w-full items-center gap-2">
                {!confirmDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                    className="w-full text-xs sm:text-13"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete category
                  </Button>
                ) : (
                  <>
                    <span className="flex-1 text-xs text-muted-foreground">
                      Are you sure?
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-13"
                      disabled={isLoading}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="text-xs sm:text-13"
                      disabled={isLoading}
                      onClick={onDelete}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {isDeleting ? <Spinner /> : ""}
                        Yes, delete
                      </span>
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs sm:text-13"
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1 text-xs sm:text-13"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center gap-1.5">
                  {isSaving ? <Spinner /> : ""}
                  {isEditing ? "Save changes" : "Create"}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
