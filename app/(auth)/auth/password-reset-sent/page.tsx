import { redirect } from "next/navigation";
import { PasswordResetSentPrompt } from "@/components/auth/password-reset-sent-prompt";

interface PasswordResetSentPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function PasswordResetSentPage({
  searchParams,
}: PasswordResetSentPageProps) {
  const params = await searchParams;
  const { email } = params;

  if (!email) {
    redirect("/auth/forgot-password");
  }

  return <PasswordResetSentPrompt email={email} />;
}