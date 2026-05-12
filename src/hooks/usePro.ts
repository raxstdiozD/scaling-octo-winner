"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSession } from "next-auth/react";

export function usePro() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { data: session } = useSession();
  const authUser = session?.user;
  const supabase = createClient();

  useEffect(() => {
    async function getProStatus() {
      if (session === undefined) return; // Wait for session to be fetched
      
      if (!authUser?.email) {
        setIsPro(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/me');
        if (!response.ok) throw new Error('Failed to fetch user data');
        
        const result = await response.json();
        const data = result.user;

        if (data) {
          setUser(data);
          const plan = (data.plan || data.planType || "free").toLowerCase();
          const rawExpiry = data.plan_expires_at || data.planExpiresAt;
          const expiresAt = rawExpiry ? new Date(rawExpiry) : null;
          const now = new Date();
          
          let isUserPro = plan === "pro";
          
          // If plan is pro but it has an expiry date in the past, they are no longer pro
          if (isUserPro && expiresAt && expiresAt < now) {
            isUserPro = false;
          }
          
          setIsPro(isUserPro);
        }
      } catch (err) {
        console.error('Error fetching pro status via API:', err);
      } finally {
        setIsLoading(false);
      }
    }

    getProStatus();

    // Set up realtime listener with unique name to avoid subscription conflicts
    const channelId = `pro_updates_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'User',
        },
        async (payload) => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email && (payload.new as any).email === session.user.email) {
            const newUser = payload.new as any;
            setUser(newUser);
            const plan = (newUser.plan || newUser.planType || "free").toLowerCase();
            const rawExpiry = newUser.plan_expires_at || newUser.planExpiresAt;
            const expiresAt = rawExpiry ? new Date(rawExpiry) : null;
            const now = new Date();
            
            let isUserPro = plan === "pro";
            if (isUserPro && expiresAt && expiresAt < now) {
              isUserPro = false;
            }
            
            setIsPro(isUserPro);
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session, authUser?.email]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/me');
      if (!response.ok) throw new Error('Failed to fetch user data');
      
      const result = await response.json();
      const data = result.user;

      if (data) {
        setUser(data);
        const plan = (data.plan || data.planType || "free").toLowerCase();
        const rawExpiry = data.plan_expires_at || data.planExpiresAt;
        const expiresAt = rawExpiry ? new Date(rawExpiry) : null;
        const now = new Date();
        let isUserPro = plan === "pro";
        if (isUserPro && expiresAt && expiresAt < now) isUserPro = false;
        setIsPro(isUserPro);
      }
    } catch (err) {
      console.error('Error refreshing pro status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { isPro, isLoading, user, authUser, refresh };
}
