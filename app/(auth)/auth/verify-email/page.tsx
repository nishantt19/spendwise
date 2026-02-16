import { redirect } from "next/navigation";
import { VerifyEmailPrompt } from "@/components/auth/verify-email-prompt";

interface VerifyEmailPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const { email } = params;

  if (!email) {
    redirect("/auth/signup");
  }

  return <VerifyEmailPrompt email={email} />;
}
