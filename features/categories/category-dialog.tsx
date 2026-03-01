"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type {
  Category,
  CategoryFormData,
  CategoryType,
} from "@/types/categories";

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#64748b",
  "#6b7280",
  "#0f172a",
];

const PRESET_ICONS: Record<CategoryType, string[]> = {
  expense: [
    "🍽️",
    "🚗",
    "🏠",
    "⚡",
    "🏥",
    "🛍️",
    "🎬",
    "📚",
    "✈️",
    "💆",
    "📱",
    "💸",
    "🎮",
    "🐾",
    "🔧",
    "💡",
    "🧴",
    "🏋️",
  ],
  income: [
    "💼",
    "💻",
    "📈",
    "🎁",
    "💰",
    "🏦",
    "🤝",
    "🏢",
    "🎯",
    "💎",
    "🌟",
    "🔑",
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
      icon: PRESET_ICONS[defaultType][0],
      color: "#6366f1",
      type: defaultType,
    },
  });

  const isLoading = isSaving || isDeleting;

  const watchedName = useWatch({ control, name: "name" });
  const watchedIcon = useWatch({ control, name: "icon" });
  const watchedColor = useWatch({ control, name: "color" });
  const watchedType = useWatch({ control, name: "type" });

  const iconPresets = PRESET_ICONS[watchedType];

  // Sync form values whenever sheet opens or category changes
  useEffect(() => {
    if (!open) return;

    if (category) {
      reset({
        name: category.name,
        icon: category.icon ?? PRESET_ICONS[category.type][0],
        color: category.color,
        type: category.type,
      });
    } else {
      reset({
        name: "",
        icon: PRESET_ICONS[defaultType][0],
        color: "#6366f1",
        type: defaultType,
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
      {/* Mobile: 95vw wide. sm+: standard max-w-md. Close button visible. */}
      <SheetContent
        className="flex flex-col gap-0 p-0 w-[95vw] sm:max-w-md"
        side="right"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SheetHeader className="border-b px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <SheetTitle className="text-base sm:text-lg">
            {isEditing ? `Edit "${category.name}"` : "New Category"}
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            {isEditing
              ? "Update this category's details."
              : `Create a new ${defaultType} category.`}
          </SheetDescription>
        </SheetHeader>

        {/* ── Scrollable body + fixed footer, wrapped in form ────────── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col min-h-0 overflow-hidden"
        >
          {/* Scrollable fields */}
          <div className="flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
            {/* ── Live preview ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
              <div
                className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-lg text-lg sm:text-xl"
                style={{
                  backgroundColor: `${watchedColor}1a`,
                  border: `1.5px solid ${watchedColor}40`,
                }}
              >
                {watchedIcon || "?"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs sm:text-sm font-medium leading-none">
                  {watchedName || "Category name"}
                </p>
                <p className="mt-1 text-1.5xs sm:text-xs capitalize text-muted-foreground">
                  {watchedType}
                </p>
              </div>
            </div>

            {/* ── Name ─────────────────────────────────────────────── */}
            <Field>
              <FieldLabel htmlFor="cat-name" className="text-xs sm:text-sm">
                Name
              </FieldLabel>
              <Input
                id="cat-name"
                placeholder="e.g. Groceries"
                disabled={isLoading}
                className="text-xs sm:text-sm"
                {...register("name")}
              />
              {errors.name && (
                <FieldDescription className="text-destructive text-xs sm:text-sm">
                  {errors.name.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Icon ─────────────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-sm">Icon</FieldLabel>
              <Input
                placeholder="Paste or type an emoji"
                disabled={isLoading}
                value={watchedIcon}
                onChange={(e) =>
                  setValue("icon", e.target.value, { shouldValidate: true })
                }
                className="w-24 sm:w-28 text-center text-sm sm:text-base"
              />
              <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-1">
                {iconPresets.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      setValue("icon", emoji, { shouldValidate: true })
                    }
                    className={`flex size-7 sm:size-8 items-center justify-center rounded-md text-sm sm:text-base transition-colors hover:bg-muted disabled:pointer-events-none ${
                      watchedIcon === emoji
                        ? "bg-muted ring-2 ring-primary ring-offset-1"
                        : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {errors.icon && (
                <FieldDescription className="text-destructive text-xs sm:text-sm">
                  {errors.icon.message}
                </FieldDescription>
              )}
            </Field>

            {/* ── Color ────────────────────────────────────────────── */}
            <Field>
              <FieldLabel className="text-xs sm:text-sm">Color</FieldLabel>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      setValue("color", color, { shouldValidate: true })
                    }
                    aria-label={color}
                    className="size-6 sm:size-7 rounded-full transition-transform hover:scale-110 focus:outline-none disabled:pointer-events-none"
                    style={{ backgroundColor: color }}
                  >
                    {watchedColor === color && (
                      <span className="flex items-center justify-center text-1.5xs font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {errors.color && (
                <FieldDescription className="text-destructive text-xs sm:text-sm">
                  {errors.color.message}
                </FieldDescription>
              )}
            </Field>
          </div>

          {/* ── Footer — always visible ─────────────────────────────────── */}
          <div className="flex flex-col gap-2 border-t px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            {/* Delete row — only in edit mode */}
            {isEditing && (
              <div className="flex w-full items-center gap-2">
                {!confirmDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                    className="w-full text-xs sm:text-sm"
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
                      className="text-xs sm:text-sm"
                      disabled={isLoading}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="text-xs sm:text-sm"
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

            {/* Save row */}
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs sm:text-sm"
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1 text-xs sm:text-sm"
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
