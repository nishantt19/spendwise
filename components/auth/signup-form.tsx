"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserPlus01 } from "@untitledui/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { signupSchema } from "@/schema/auth";
import type { SignupFormData } from "@/types/auth";
import { signUp } from "@/actions/auth";
import { Spinner } from "../ui/spinner";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormData) => {
    startTransition(async () => {
      const result = await signUp(data);
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(data.email)}`,
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
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 ring-8 ring-primary/5">
            <UserPlus01 className="size-6 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Fill in the form below to create your account
            </p>
          </div>
        </div>
        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            {...register("name")}
          />
          {errors.name && (
            <FieldDescription className="text-destructive">
              {errors.name.message}
            </FieldDescription>
          )}
        </Field>
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
              {isPending ? <Spinner /> : ""} Create Account
            </span>
          </Button>
          <FieldDescription className="px-6 text-center">
            Already have an account? <a href="/auth/login">Login</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
