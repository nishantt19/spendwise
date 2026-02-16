"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LogIn01 } from "@untitledui/icons";

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

import { loginSchema } from "@/schema/auth";
import type { LoginFormData } from "@/types/auth";
import { signIn } from "@/actions/auth";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    startTransition(async () => {
      const result = await signIn(data);
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
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 ring-8 ring-primary/5">
            <LogIn01 className="size-6 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Login to your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your email below to login to your account
            </p>
          </div>
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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="/auth/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline hover:text-primary"
            >
              Forgot your password?
            </a>
          </div>
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
        </Field>
        <Field>
          <Button type="submit" disabled={isPending}>
            <span className="flex justify-center items-center gap-1.5">
              {isPending ? <Spinner /> : ""} Login
            </span>
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="/auth/signup" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
