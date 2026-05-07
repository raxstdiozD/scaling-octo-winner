"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function useRequireAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // We don't redirect here, we let the component handle the UI or manual redirect
        setIsLoading(false);
        return;
      }

      setUser(session.user);
      setIsLoading(false);
    }

    checkAuth();
  }, [supabase]);

  const redirectToLogin = (message?: string) => {
    const returnUrl = encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""));
    const msg = message || "Login required to use Pro tools and credits system";
    router.push(`/auth/login?returnUrl=${returnUrl}&message=${encodeURIComponent(msg)}`);
  };

  return { user, isLoading, redirectToLogin };
}
