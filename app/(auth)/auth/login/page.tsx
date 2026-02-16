import { LoginForm } from "@/components/auth/login-form";
import { getUserSession } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const response = await getUserSession();
  if (response?.user) {
    redirect("/");
  }

  return <LoginForm />;
}
