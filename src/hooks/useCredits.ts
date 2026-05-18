"use client";

import { useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PRICING_CONFIG } from '@/config/pricing';
import { create } from 'zustand';

export interface CreditState {
  dailyCredits: number;
  lifetimeCredits: number;
  creditsLastReset: string;
  aiMessagesToday: number;
  aiMessagesReset: string;
  plan: 'free' | 'pro';
}

const FREE_LIMITS = {
  credits: 50,
  messages: Infinity // Unlimited messages, but subject to priority/load
};

const PRO_LIMITS = {
  credits: PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS,
  messages: Infinity
};

interface CreditStore {
  userId: string | null;
  state: CreditState | null;
  loading: boolean;
  showUpsell: boolean;
  notification: { message: string; type: 'success' | 'info' | 'warning' } | null;
  countdown: string;
  isInitialized: boolean;
  setUserId: (id: string | null) => void;
  setState: (state: CreditState | null | ((prev: CreditState | null) => CreditState | null)) => void;
  updateState: (partial: Partial<CreditState>) => void;
  setLoading: (l: boolean) => void;
  setShowUpsell: (s: boolean) => void;
  setNotification: (n: { message: string; type: 'success' | 'info' | 'warning' } | null) => void;
  setCountdown: (c: string) => void;
  setIsInitialized: (i: boolean) => void;
}

const useCreditStore = create<CreditStore>((set) => ({
  userId: null,
  state: null,
  loading: true,
  showUpsell: false,
  notification: null,
  countdown: "",
  isInitialized: false,
  setUserId: (id) => set({ userId: id }),
  setState: (updater) => set((prev) => ({
    state: typeof updater === 'function' ? updater(prev.state) : updater
  })),
  updateState: (partial) => set((prev) => ({
    state: prev.state ? { ...prev.state, ...partial } : null
  })),
  setLoading: (l) => set({ loading: l }),
  setShowUpsell: (s) => set({ showUpsell: s }),
  setNotification: (n) => set({ notification: n }),
  setCountdown: (c) => set({ countdown: c }),
  setIsInitialized: (i) => set({ isInitialized: i }),
}));

export function useCredits() {
  const supabase = createClient();
  const store = useCreditStore();
  const { 
    userId, state, loading, showUpsell, notification, countdown, isInitialized,
    setUserId, setState, updateState, setLoading, setShowUpsell, setNotification, setCountdown, setIsInitialized
  } = store;

  // Single global initialization for user, countdown, and real-time listener
  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);

    const updateCountdown = () => {
      try {
        const now = new Date();
        const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const nowIST = new Date(istString);
        
        const nextResetIST = new Date(nowIST);
        nextResetIST.setHours(24, 0, 0, 0); 
        
        const diff = nextResetIST.getTime() - nowIST.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } catch (err) {
        console.error("Countdown error:", err);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const newUserId = session?.user?.id || null;
      if (useCreditStore.getState().userId !== newUserId) {
        setUserId(newUserId);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id || null;
      if (useCreditStore.getState().userId !== newUserId) {
        setUserId(newUserId);
      }
    });

    return () => {
      clearInterval(timer);
      subscription.unsubscribe();
      // Do not reset isInitialized so global state persists across remounts
    };
  }, [supabase, isInitialized, setCountdown, setUserId, setIsInitialized]);

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, [setNotification]);

  const fetchCredits = useCallback(async () => {
    if (!userId) return;
    
    // Prevent refetching if we already have the state and are not loading
    if (useCreditStore.getState().state) {
      setLoading(false);
      return;
    }

    try {
      // Use no-store to avoid Next.js caching across users or sessions
      const response = await fetch('/api/user/credits', { cache: 'no-store' });
      const json = await response.json();

      if (json.success && json.data) {
        const data = json.data;
        setState({
          dailyCredits: data.dailyCredits,
          lifetimeCredits: data.lifetimeCredits,
          creditsLastReset: data.lastReset || new Date().toISOString(),
          aiMessagesToday: data.aiMessagesToday || 0,
          aiMessagesReset: new Date().toISOString(),
          plan: data.plan || 'free',
        });
      } else {
        console.warn('Credits API returned error:', json.error);
      }
    } catch (err) {
      console.error('Failed to fetch credits via API:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, setState, setLoading]);

  useEffect(() => {
    if (userId) {
      fetchCredits();
    }
  }, [userId, fetchCredits]);

  // Real-time listener specifically for the current user
  useEffect(() => {
    if (!userId) return;

    const channelId = `credits-${userId}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'User',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const data = payload.new;
          updateState({
            dailyCredits: data.daily_credits,
            lifetimeCredits: data.lifetime_credits,
            aiMessagesToday: data.ai_messages_today,
            plan: data.plan,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, updateState]);

  const deductCredits = async (amount: number) => {
    if (!userId || !state) return false;

    try {
      const response = await fetch('/api/user/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct', amount })
      });

      const json = await response.json();

      if (json.success) {
        showNotification(`${amount} credits deducted`, 'info');
        return true;
      } else {
        if (json.error === 'Insufficient credits') {
          setShowUpsell(true);
        }
        console.error("Deduction failed:", json.error);
        return false;
      }
    } catch (err) {
      console.error("Deduction error:", err);
      return false;
    }
  };

  const addCredits = async (amount: number) => {
    if (!userId || !state) return false;
    try {
      const newLifetime = state.lifetimeCredits + amount;
      const { error } = await supabase
        .from('User')
        .update({ lifetime_credits: newLifetime })
        .eq('id', userId);
      
      if (error) throw error;
      showNotification(`Success! ${amount} permanent credits added.`, 'success');
      return true;
    } catch (err) {
      return false;
    }
  };

  const consumeMessage = async () => {
    if (!userId) return false;
    
    if (!state || loading) {
      await fetchCredits();
    }

    if (!useCreditStore.getState().state) {
      console.warn("[Credits] State missing after fetch, but bypassing to allow chat for user:", userId);
      return true;
    }

    const currentState = useCreditStore.getState().state!;
    const limit = currentState.plan === 'pro' ? PRO_LIMITS.messages : FREE_LIMITS.messages;
    
    if (currentState.plan === 'free' && currentState.aiMessagesToday >= limit) {
      setShowUpsell(true);
      return true;
    }

    try {
      updateState({ aiMessagesToday: currentState.aiMessagesToday + 1 });

      await fetch('/api/user/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'consume-message', amount: 1 })
      });

      return true; 
    } catch (err) {
      console.warn("Credit check failed, but allowing message due to safety bypass:", err);
      return true;
    }
  };

  return {
    credits: (state?.lifetimeCredits ?? 0) + (state?.dailyCredits ?? 0),
    dailyCredits: state?.dailyCredits ?? 0,
    lifetimeCredits: state?.lifetimeCredits ?? 0,
    messagesUsed: state?.aiMessagesToday ?? 0,
    plan: state?.plan ?? 'free',
    isPro: state?.plan === 'pro',
    loading,
    userId,
    deductCredits,
    addCredits,
    consumeMessage,
    showUpsell,
    setShowUpsell,
    notification,
    toast: showNotification,
    refreshCredits: () => {
      // Force fetch by skipping state check
      if (userId) {
        setLoading(true);
        fetch('/api/user/credits', { cache: 'no-store' })
          .then(res => res.json())
          .then(json => {
            if (json.success && json.data) {
              setState({
                dailyCredits: json.data.dailyCredits,
                lifetimeCredits: json.data.lifetimeCredits,
                creditsLastReset: json.data.lastReset || new Date().toISOString(),
                aiMessagesToday: json.data.aiMessagesToday || 0,
                aiMessagesReset: new Date().toISOString(),
                plan: json.data.plan || 'free',
              });
            }
          }).finally(() => setLoading(false));
      }
    },
    countdown
  };
}
