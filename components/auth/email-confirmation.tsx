"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail01 } from "@untitledui/icons";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { resendVerificationEmail } from "@/actions/auth";
import type { AuthActionResult } from "@/types/auth";

interface EmailConfirmationProps extends React.ComponentProps<"div"> {
  result: AuthActionResult;
  userEmail?: string;
}

const REDIRECT_DELAY = 5;
const RESEND_COOLDOWN = 60;

export function EmailConfirmation({
  result,
  userEmail,
  className,
  ...props
}: EmailConfirmationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState(userEmail || "");
  const [showResendForm, setShowResendForm] = useState(false);

  useEffect(() => {
    if (result.status !== "success") return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }

    router.push("/");
  }, [countdown, result.status, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleRedirectToHome = () => {
    router.push("/");
  };

  const handleRedirectToSignup = () => {
    router.push("/auth/signup");
  };

  const handleRedirectToLogin = () => {
    router.push("/auth/login");
  };

  const handleResendEmail = () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    startTransition(async () => {
      const resendResult = await resendVerificationEmail(email);
      if (resendResult.status === "error") {
        toast.error(resendResult.message);
      } else {
        toast.success(resendResult.message);
        setResendCooldown(RESEND_COOLDOWN);
        setShowResendForm(false);
      }
    });
  };

  const toggleResendForm = () => {
    setShowResendForm(!showResendForm);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup className="gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          {result.status === "success" ? (
            <>
              <h1 className="text-2xl font-bold">Email Verified!</h1>
              <p className="text-muted-foreground text-sm text-balance">
                {result.message}
              </p>
              <p className="text-muted-foreground text-sm">
                Redirecting to home in{" "}
                <span className="font-semibold text-foreground">
                  {countdown}
                </span>{" "}
                {countdown === 1 ? "second" : "seconds"}...
              </p>
              <Button onClick={handleRedirectToHome} className="w-full">
                Go to Home Now
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Verification Failed</h1>
              <p className="text-destructive text-sm text-balance">
                {result.message}
              </p>
              <p className="text-xs text-muted-foreground">
                Note: Verification links expire after 6 minutes for security.
              </p>

              {/* Resend verification email section */}
              <div className="w-full mt-4 p-4 bg-muted/50 rounded-lg">
                {!showResendForm ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Need a new verification link?
                    </p>
                    <Button
                      onClick={toggleResendForm}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Mail01 className="h-4 w-4" />
                      Resend Verification Email
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Field>
                      <FieldLabel htmlFor="resend-email">
                        Email Address
                      </FieldLabel>
                      <Input
                        id="resend-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isPending || resendCooldown > 0}
                      />
                      <FieldDescription>
                        {resendCooldown > 0
                          ? `Please wait ${resendCooldown}s before requesting another email`
                          : "We'll send a new verification link to this email"}
                      </FieldDescription>
                    </Field>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleResendEmail}
                        disabled={isPending || resendCooldown > 0 || !email}
                        className="flex-1"
                      >
                        {isPending ? (
                          <span className="flex items-center gap-1.5">
                            <Spinner /> Sending...
                          </span>
                        ) : (
                          "Send Verification Email"
                        )}
                      </Button>
                      <Button
                        onClick={toggleResendForm}
                        variant="outline"
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 w-full mt-4">
                <Button
                  onClick={handleRedirectToSignup}
                  variant="outline"
                  className="w-full"
                >
                  Create New Account
                </Button>
                <Button
                  onClick={handleRedirectToLogin}
                  variant="default"
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </>
          )}
        </div>
      </FieldGroup>
    </div>
  );
}
