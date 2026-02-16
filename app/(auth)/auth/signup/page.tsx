import { SignupForm } from "@/components/auth/signup-form";
import { getUserSession } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const response = await getUserSession();
  if (response?.user) {
    redirect("/");
  }

  return <SignupForm />;
}
