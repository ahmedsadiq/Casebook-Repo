"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type BackToCasesLinkProps = {
  className?: string;
  label?: string;
};

export default function BackToCasesLink({
  className = "",
  label = "Back to Cases",
}: BackToCasesLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        startTransition(() => {
          router.push(`/advocate/cases?refresh=${Date.now()}`);
        });
      }}
      disabled={isPending}
    >
      {isPending ? "Opening cases..." : label}
    </button>
  );
}
