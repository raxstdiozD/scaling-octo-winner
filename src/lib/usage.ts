import { supabase } from './supabase';

/**
 * Increments the generation count for a specific user in the current month.
 * This is intended to be called after a successful AI generation.
 */
export async function incrementGenerations(userId: string) {
  try {
    const { error } = await supabase.rpc('increment_generations', {
      target_user_id: userId,
    });

    if (error) {
      console.error('Error incrementing generations:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error incrementing generations:', err);
    return { success: false, error: err };
  }
}

/**
 * Gets the current usage for a user.
 */
export async function getUserUsage(userId: string) {
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const { data, error } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('period', period)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { data: null, error };
  }

  return { data, error: null };
}
