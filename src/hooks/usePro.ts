"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function usePro() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getProStatus() {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user || null);
      
      if (!session?.user?.email) {
        setIsPro(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', session.user.email)
        .single();

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
      setIsLoading(false);
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const refresh = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      setIsPro(false);
      setIsLoading(false);
      return;
    }
    const { data } = await supabase
      .from('User')
      .select('*')
      .eq('email', session.user.email)
      .single();
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
    setIsLoading(false);
  };

  return { isPro, isLoading, user, authUser, refresh };
}
