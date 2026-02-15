"use client";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { resetPasswordSchema } from "@/schema/auth";
import type { ResetPasswordFormData } from "@/types/auth";
import { resetPassword } from "@/actions/auth";
import { Spinner } from "../ui/spinner";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    startTransition(async () => {
      const result = await resetPassword(
        data,
        searchParams.get("code") as string,
      );
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.push("/");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup className="gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Set new password</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Your new password must be different from the previously used
            passwords.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="********"
            {...register("password")}
          />
          {errors.password && (
            <FieldDescription className="text-destructive">
              {errors.password.message}
            </FieldDescription>
          )}
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            placeholder="********"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <FieldDescription className="text-destructive">
              {errors.confirmPassword.message}
            </FieldDescription>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isPending}>
            <span className="flex justify-center items-center gap-1.5">
              {isPending ? <Spinner /> : ""} Reset Password
            </span>
          </Button>
          <FieldDescription className="text-center">
            Remember your password? <a href="/auth/login">Login</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
