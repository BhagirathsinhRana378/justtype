"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TestPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/type");
  }, [router]);

  return null;
}
