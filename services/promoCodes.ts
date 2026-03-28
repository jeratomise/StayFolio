import { supabase } from './supabase';
import { PromoCode, PromoRedemption } from '../types';

// --- Mapping helpers (snake_case → camelCase) ---

const mapPromoCodeFromDb = (row: any): PromoCode => ({
  id: row.id,
  code: row.code,
  description: row.description || '',
  grantDays: row.grant_days,
  isSingleUse: row.is_single_use,
  maxUses: row.max_uses,
  timesUsed: row.times_used,
  isActive: row.is_active,
  expiresAt: row.expires_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

// --- Admin Functions ---

export const createPromoCode = async (params: {
  code: string;
  description?: string;
  grantDays?: number;
  isSingleUse: boolean;
  maxUses?: number | null;
  expiresAt?: string | null;
}): Promise<PromoCode | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code: params.code.toUpperCase().trim(),
      description: params.description || '',
      grant_days: params.grantDays ?? 90,
      is_single_use: params.isSingleUse,
      max_uses: params.isSingleUse ? 1 : (params.maxUses ?? null),
      is_active: true,
      expires_at: params.expiresAt || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating promo code:', error);
    throw new Error(error.code === '23505' ? 'A code with this name already exists.' : 'Failed to create promo code.');
  }
  return mapPromoCodeFromDb(data);
};

export const getAllPromoCodes = async (): Promise<PromoCode[]> => {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching promo codes:', error);
    return [];
  }
  return (data || []).map(mapPromoCodeFromDb);
};

export const togglePromoCodeActive = async (id: string, isActive: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('promo_codes')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    console.error('Error toggling promo code:', error);
    return false;
  }
  return true;
};

export const deletePromoCode = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('promo_codes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting promo code:', error);
    return false;
  }
  return true;
};

export const getRedemptionsForCode = async (codeId: string): Promise<PromoRedemption[]> => {
  const { data, error } = await supabase
    .from('promo_redemptions')
    .select('*')
    .eq('code_id', codeId)
    .order('redeemed_at', { ascending: false });

  if (error) {
    console.error('Error fetching redemptions:', error);
    return [];
  }
  return (data || []).map((r: any) => ({
    id: r.id,
    codeId: r.code_id,
    userId: r.user_id,
    redeemedAt: r.redeemed_at,
  }));
};

// --- User Functions ---

export const redeemPromoCode = async (codeString: string): Promise<{
  success: boolean;
  error?: string;
  grantDays?: number;
  newExpiresAt?: string;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  // 1. Check if user is already a paid Pro user (via Stripe)
  const { data: subData } = await supabase
    .from('user_subscriptions')
    .select('status, stripe_customer_id, expires_at')
    .eq('user_id', user.id)
    .single();

  if (subData?.status === 'pro' && subData?.stripe_customer_id) {
    return { success: false, error: 'You already have an active paid Pro subscription.' };
  }

  // 2. Look up the code
  const { data: codeData, error: codeLookupError } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', codeString.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (codeLookupError || !codeData) {
    return { success: false, error: 'Invalid or expired promo code.' };
  }

  // 3. Check expiry
  if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
    return { success: false, error: 'This promo code has expired.' };
  }

  // 4. Check usage limits
  if (codeData.is_single_use && codeData.times_used >= 1) {
    return { success: false, error: 'This code has already been used.' };
  }
  if (codeData.max_uses !== null && codeData.times_used >= codeData.max_uses) {
    return { success: false, error: 'This code has reached its maximum number of uses.' };
  }

  // 5. Check if this user already redeemed this code
  const { data: existingRedemption } = await supabase
    .from('promo_redemptions')
    .select('id')
    .eq('code_id', codeData.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingRedemption) {
    return { success: false, error: 'You have already redeemed this code.' };
  }

  // 6. Calculate new expiry (extend from current expiry if already pro, else from now)
  let baseDate = new Date();
  if (subData?.status === 'pro' && subData?.expires_at) {
    const currentExpiry = new Date(subData.expires_at);
    if (currentExpiry > baseDate) {
      baseDate = currentExpiry;
    }
  }
  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + codeData.grant_days);
  const newExpiresAt = newExpiry.toISOString();

  // 7. Record redemption
  const { error: redemptionError } = await supabase
    .from('promo_redemptions')
    .insert({
      code_id: codeData.id,
      user_id: user.id,
    });

  if (redemptionError) {
    console.error('Redemption insert failed:', redemptionError);
    return { success: false, error: 'Failed to redeem code. Please try again.' };
  }

  // 8. Increment times_used
  await supabase
    .from('promo_codes')
    .update({ times_used: codeData.times_used + 1 })
    .eq('id', codeData.id);

  // 9. Update user subscription to pro
  const { error: subError } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'pro',
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (subError) {
    console.error('Subscription update failed:', subError);
    return { success: false, error: 'Code redeemed but failed to activate Pro. Contact support.' };
  }

  return {
    success: true,
    grantDays: codeData.grant_days,
    newExpiresAt,
  };
};
