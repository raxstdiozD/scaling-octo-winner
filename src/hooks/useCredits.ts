"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

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
  messages: 30
};

const PRO_LIMITS = {
  credits: 1500,
  messages: Infinity
};

export function useCredits() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [state, setState] = useState<CreditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpsell, setShowUpsell] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'warning'} | null>(null);

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
      let { data, error } = await supabase
        .from('User')
        .select('daily_credits, lifetime_credits, credits_last_reset, ai_messages_today, ai_messages_reset, plan')
        .eq('id', userId)
        .single();

      if (data) {
        const userData: CreditState = {
          dailyCredits: data.daily_credits ?? 50,
          lifetimeCredits: data.lifetime_credits ?? 0,
          creditsLastReset: data.credits_last_reset || new Date().toISOString(),
          aiMessagesToday: data.ai_messages_today ?? 0,
          aiMessagesReset: data.ai_messages_reset || new Date().toISOString(),
          plan: (data.plan as 'free' | 'pro') ?? 'free',
        };

        const now = new Date();
        const lastReset = new Date(userData.creditsLastReset);
        const isNewDay = now.toDateString() !== lastReset.toDateString();

        if (isNewDay) {
          const resetLimits = userData.plan === 'pro' ? PRO_LIMITS : FREE_LIMITS;
          const { data: updatedData } = await supabase
            .from('User')
            .update({
              daily_credits: resetLimits.credits,
              credits_last_reset: now.toISOString(),
              ai_messages_today: 0,
              ai_messages_reset: now.toISOString(),
            })
            .eq('id', userId)
            .select()
            .single();

          if (updatedData) {
            setState({
              dailyCredits: updatedData.daily_credits,
              lifetimeCredits: updatedData.lifetime_credits,
              creditsLastReset: updatedData.credits_last_reset,
              aiMessagesToday: updatedData.ai_messages_today,
              aiMessagesReset: updatedData.ai_messages_reset,
              plan: updatedData.plan,
            });
            return;
          }
        }
        setState(userData);
      }
    } catch (err) {
      console.warn('Error fetching credits:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

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

    const totalAvailable = state.lifetimeCredits + state.dailyCredits;
    if (totalAvailable < amount) {
      setShowUpsell(true);
      return false;
    }

    let newLifetime = state.lifetimeCredits;
    let newDaily = state.dailyCredits;

    // Priority: Deduct from Lifetime first
    if (newLifetime >= amount) {
      newLifetime -= amount;
    } else {
      const remaining = amount - newLifetime;
      newLifetime = 0;
      newDaily -= remaining;
    }

    try {
      const { error } = await supabase
        .from('User')
        .update({ 
          lifetime_credits: newLifetime,
          daily_credits: newDaily 
        })
        .eq('id', userId);

      if (error) throw error;
      
      showNotification(`${amount} credits deducted`, 'info');
      return true;
    } catch (err) {
      console.error("Deduction failed:", err);
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
    refreshCredits: fetchCredits
  };
}
