"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { signOut } from "@/actions/auth";

export function useLogout() {
  const [isPending, startTransition] = useTransition();

  const logout = () => {
    startTransition(async () => {
      const result = await signOut();
      if (result?.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return { logout, isPending };
}
