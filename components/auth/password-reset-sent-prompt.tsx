"use client";
import { useState, useTransition, useEffect } from "react";
import { Mail01 } from "@untitledui/icons";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldDescription } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { forgotPassword } from "@/actions/auth";

interface PasswordResetSentPromptProps extends React.ComponentProps<"div"> {
  email: string;
}

const RESEND_COOLDOWN = 60;

export function PasswordResetSentPrompt({
  email,
  className,
  ...props
}: PasswordResetSentPromptProps) {
  const [isPending, startTransition] = useTransition();
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendEmail = () => {
    startTransition(async () => {
      const result = await forgotPassword({ email });
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        setResendCooldown(RESEND_COOLDOWN);
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup className="gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-2 items-center">
            <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 ring-8 ring-primary/5">
              <Mail01 className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Check Your Email</h1>
            <p className="text-muted-foreground text-sm text-balance">
              {`We've sent password reset instructions to`}
            </p>
            <p className="font-semibold text-foreground">{email}</p>
          </div>

          <div className="w-full p-4 bg-muted/50 rounded-lg space-y-3 text-left">
            <p className="text-sm font-medium">Next steps:</p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the password reset link in the email</li>
              <li>{`You'll be able to create a new password`}</li>
            </ol>
          </div>

          <div className="w-full p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
            <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
              ⚠️ Important: The reset link expires in 6 minutes for security.
              Please use it promptly.
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {`Didn't receive the email?`}
              </p>
              <Button
                onClick={handleResendEmail}
                disabled={isPending || resendCooldown > 0}
                variant="outline"
                className="w-full gap-2"
              >
                {resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <span className="flex justify-center items-center gap-1.5">
                    {isPending ? <Spinner /> : <Mail01 className="size-4" />}{" "}
                    Resend Reset Email
                  </span>
                )}
              </Button>
            </div>
          </div>

          <FieldDescription className="text-xs text-center text-muted-foreground">
            Remember your password?{" "}
            <a
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Back to login
            </a>
          </FieldDescription>
        </div>
      </FieldGroup>
    </div>
  );
}
