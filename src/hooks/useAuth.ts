import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth(redirectOnLogin: string | null = '/dashboard') {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user && redirectOnLogin) {
          setIsRedirecting(true);
          router.push(redirectOnLogin);
        }
      }
    }
    
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && redirectOnLogin) {
          setIsRedirecting(true);
          router.push(redirectOnLogin);
        } else if (event === 'SIGNED_OUT') {
          setIsRedirecting(false);
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, redirectOnLogin]);

  return { user, loading, isRedirecting };
}
