"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useCredits } from "./useCredits";

export interface DashboardStats {
  creditsRemaining: number;
  dailyCredits: number;
  lifetimeCredits: number;
  toolsUsedToday: number;
  totalGenerations: number;
  plan: string;
  isPro: boolean;
  loading: boolean;
}

export function useDashboardStats() {
  const { credits, dailyCredits, lifetimeCredits, plan, isPro, userId, loading: creditsLoading } = useCredits();
  const [stats, setStats] = useState({
    toolsUsedToday: 0,
    totalGenerations: 0,
    loading: true
  });
  const supabase = createClient();

  const fetchUsageStats = useCallback(async () => {
    if (!userId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Total Generations from User table
      const { data: userData } = await supabase
        .from('User')
        .select('aiGenerationsUsed')
        .eq('id', userId)
        .single();

      // 2. Tools used today from UserFile table
      const { count: todayCount } = await supabase
        .from('UserFile')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .gte('createdAt', today.toISOString());

      setStats({
        toolsUsedToday: todayCount || 0,
        totalGenerations: userData?.aiGenerationsUsed || 0,
        loading: false
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [userId, supabase]);

  useEffect(() => {
    if (userId) {
      fetchUsageStats();
    }
  }, [userId, fetchUsageStats]);

  // Realtime listeners for usage
  useEffect(() => {
    if (!userId) return;

    const channelId = `dashboard-stats-${userId}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'User', 
          filter: `id=eq.${userId}` 
        },
        (payload) => {
          setStats(prev => ({
            ...prev,
            totalGenerations: payload.new.aiGenerationsUsed ?? prev.totalGenerations
          }));
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'UserFile', 
          filter: `userId=eq.${userId}` 
        },
        () => {
          setStats(prev => ({
            ...prev,
            toolsUsedToday: prev.toolsUsedToday + 1
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return {
    creditsRemaining: credits,
    dailyCredits,
    lifetimeCredits,
    toolsUsedToday: stats.toolsUsedToday,
    totalGenerations: stats.totalGenerations,
    plan,
    isPro,
    loading: creditsLoading || stats.loading
  };
}
