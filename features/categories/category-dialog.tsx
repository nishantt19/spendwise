"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

import { categorySchema } from "@/schema/categories";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/actions/categories";
import type { Category, CategoryFormData, CategoryType } from "@/types/categories";

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
    "🍽️", "🚗", "🏠", "⚡", "🏥", "🛍️",
    "🎬", "📚", "✈️", "💆", "📱", "💸",
    "🎮", "🐾", "🔧", "💡", "🧴", "🏋️",
  ],
  income: [
    "💼", "💻", "📈", "🎁", "💰", "🏦",
    "🤝", "🏢", "🎯", "💎", "🌟", "🔑",
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

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      icon: PRESET_ICONS[defaultType][0],
      color: "#6366f1",
      type: defaultType,
    },
  });

  // Sync form values whenever dialog opens or category changes
  useEffect(() => {
    if (!open) return;

    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon ?? PRESET_ICONS[category.type][0],
        color: category.color,
        type: category.type,
      });
    } else {
      form.reset({
        name: "",
        icon: PRESET_ICONS[defaultType][0],
        color: "#6366f1",
        type: defaultType,
      });
    }
  }, [open, category, defaultType, form]);

  const watchedName = form.watch("name");
  const watchedIcon = form.watch("icon");
  const watchedColor = form.watch("color");
  const watchedType = form.watch("type");

  const iconPresets = PRESET_ICONS[watchedType];

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

  const isLoading = isSaving || isDeleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit "${category.name}"` : "New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this category's details."
              : `Create a new ${defaultType} category.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-1">
          {/* Live preview */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xl"
              style={{
                backgroundColor: `${watchedColor}1a`,
                border: `1.5px solid ${watchedColor}40`,
              }}
            >
              {watchedIcon || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-none">
                {watchedName || "Category name"}
              </p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {watchedType}
              </p>
            </div>
          </div>

          {/* Name */}
          <Field>
            <FieldLabel htmlFor="cat-name">Name</FieldLabel>
            <Input
              id="cat-name"
              placeholder="e.g. Groceries"
              disabled={isLoading}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <FieldDescription className="text-destructive">
                {form.formState.errors.name.message}
              </FieldDescription>
            )}
          </Field>

          {/* Icon */}
          <Field>
            <FieldLabel>Icon</FieldLabel>
            <Input
              placeholder="Paste or type an emoji"
              disabled={isLoading}
              value={watchedIcon}
              onChange={(e) =>
                form.setValue("icon", e.target.value, { shouldValidate: true })
              }
              className="w-28 text-center text-base"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {iconPresets.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    form.setValue("icon", emoji, { shouldValidate: true })
                  }
                  className={`flex size-8 items-center justify-center rounded-md text-base transition-colors hover:bg-muted disabled:pointer-events-none ${
                    watchedIcon === emoji
                      ? "bg-muted ring-2 ring-primary ring-offset-1"
                      : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {form.formState.errors.icon && (
              <FieldDescription className="text-destructive">
                {form.formState.errors.icon.message}
              </FieldDescription>
            )}
          </Field>

          {/* Color */}
          <Field>
            <FieldLabel>Color</FieldLabel>
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    form.setValue("color", color, { shouldValidate: true })
                  }
                  aria-label={color}
                  className="size-7 rounded-full transition-transform hover:scale-110 focus:outline-none disabled:pointer-events-none"
                  style={{ backgroundColor: color }}
                >
                  {watchedColor === color && (
                    <span className="flex items-center justify-center text-[11px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
            {form.formState.errors.color && (
              <FieldDescription className="text-destructive">
                {form.formState.errors.color.message}
              </FieldDescription>
            )}
          </Field>

          <DialogFooter className="gap-2 pt-2">
            {/* Delete — only visible in edit mode */}
            {isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                    className="mr-auto"
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      {isDeleting ? <Spinner /> : ""}
                      Delete
                    </span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this category?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deleting{" "}
                      <span className="font-medium text-foreground">
                        &quot;{category?.name}&quot;
                      </span>{" "}
                      is permanent. Transactions using it will become
                      uncategorized. You cannot delete a category that still has
                      active transactions.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isLoading}>
              <span className="flex items-center justify-center gap-1.5">
                {isSaving ? <Spinner /> : ""}
                {isEditing ? "Save changes" : "Create"}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
