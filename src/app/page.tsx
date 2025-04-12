"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/logo";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/auth/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#42B4E6]">
      <Logo variant="splash" />
    </div>
  );
}
