"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PRICING_CONFIG } from '@/config/pricing';

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
  messages: 50 // Increased to match daily credits
};

const PRO_LIMITS = {
  credits: PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS,
  messages: Infinity
};

export function useCredits() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [state, setState] = useState<CreditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpsell, setShowUpsell] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'warning'} | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const now = new Date();
        // Get current time in IST
        const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const nowIST = new Date(istString);
        
        // Calculate next 12 AM IST
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
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchCredits = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/user/credits');
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
  }, [userId]);

  // Real-time listener
  useEffect(() => {
    if (!userId) return;

    // Use a unique channel name for each instance to prevent subscription collisions
    const channelId = `credits-${userId}-${Math.random().toString(36).substring(2, 9)}`;
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
          setState(prev => prev ? {
            ...prev,
            dailyCredits: data.daily_credits ?? prev.dailyCredits,
            lifetimeCredits: data.lifetime_credits ?? prev.lifetimeCredits,
            aiMessagesToday: data.ai_messages_today ?? prev.aiMessagesToday,
            plan: data.plan ?? prev.plan,
          } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  useEffect(() => {
    if (userId) {
      fetchCredits();
    }
  }, [userId, fetchCredits]);

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
    if (!userId || !state) return false;
    const limit = state.plan === 'pro' ? PRO_LIMITS.messages : FREE_LIMITS.messages;
    if (state.plan === 'free' && state.aiMessagesToday >= limit) {
      setShowUpsell(true);
      return false;
    }
    try {
      await supabase
        .from('User')
        .update({ ai_messages_today: state.aiMessagesToday + 1 })
        .eq('id', userId);
      return true;
    } catch (err) {
      return false;
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
    refreshCredits: fetchCredits,
    countdown
  };
}
