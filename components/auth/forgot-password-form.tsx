"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Spinner } from "@/components/ui/spinner";

import { forgotPasswordSchema } from "@/schema/auth";
import type { ForgotPasswordFormData } from "@/types/auth";
import { forgotPassword } from "@/actions/auth";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    startTransition(async () => {
      const result = await forgotPassword(data);
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.push(
          `/auth/password-reset-sent?email=${encodeURIComponent(data.email)}`,
        );
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
          <h1 className="text-2xl font-bold">Forgot your Password?</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to receive a password reset link
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
          />
          {errors.email && (
            <FieldDescription className="text-destructive">
              {errors.email.message}
            </FieldDescription>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isPending}>
            <span className="flex justify-center items-center gap-1.5">
              {isPending ? <Spinner /> : ""} Send password reset mail
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
