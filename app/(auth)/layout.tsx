import { getUserSession } from "@/actions/auth";
import { CreditCard02 } from "@untitledui/icons";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const response = await getUserSession();
  if (response?.user) {
    redirect("/");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-primary relative hidden lg:block w-full h-full"></div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <CreditCard02 className="size-4" />
            </div>
            Spend Wise
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
