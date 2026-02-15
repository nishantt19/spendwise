"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signOut } from "@/actions/auth";

export default function Home() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const result = await signOut();

      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.push("/auth/login");
      }
    });
  };

  return (
    <>
      Spendwise
      <Button onClick={handleLogout} disabled={isPending}>
        <span className="flex justify-center items-center gap-1.5">
          {isPending ? <Spinner /> : ""} Logout
        </span>
      </Button>
    </>
  );
}
