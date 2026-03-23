import { Stay, UserSummary, Subscription } from '../types';
import { supabase } from './supabase';

const STATUS_KEY = 'stayfolio_status_overrides';

// --- Supabase Data Methods ---

export const getStays = async (): Promise<Stay[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('stays')
    .select('*')
    .order('check_in_date', { ascending: false });

  if (error) {
    console.error('Error fetching stays:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    userId: item.user_id,
    userEmail: item.user_email,
    hotelName: item.hotel_name,
    brand: item.brand,
    country: item.country,
    checkInDate: item.check_in_date,
    checkOutDate: item.check_out_date,
    cost: Number(item.cost),
    rating: item.rating,
    createdAt: new Date(item.created_at).getTime()
  }));
};

// --- Subscription & Registry Management ---

/**
 * Ensures a user has a record in the subscription table and that their email is synced.
 * This effectively "registers" them in the public user list for the SuperAdmin.
 */
export const syncUserRegistry = async (): Promise<Subscription | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: user.id,
            email: user.email,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) {
        console.error("Registry sync failed:", error);
        return null;
    }

    return {
        userId: data.user_id,
        status: data.status,
        expiresAt: data.expires_at,
        stripeCustomerId: data.stripe_customer_id
    };
};

export const getUserSubscription = async (userId?: string): Promise<Subscription | null> => {
    let targetId = userId;
    if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        targetId = user.id;
    }

    const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', targetId)
        .single();

    if (error || !data) {
        return {
            userId: targetId,
            status: 'free',
            expiresAt: null
        };
    }

    return {
        userId: data.user_id,
        status: data.status,
        expiresAt: data.expires_at,
        stripeCustomerId: data.stripe_customer_id
    };
};

export const adminUpdateSubscription = async (userId: string, status: 'free' | 'pro', expiresAt: string | null): Promise<boolean> => {
    const { error } = await supabase
        .from('user_subscriptions')
        .update({
            status,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    if (error) {
        console.error("Error updating subscription:", error);
        return false;
    }
    return true;
};

// --- App Config (Stripe Toggle) ---

export const getStripeConfig = async (): Promise<boolean> => {
    const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'stripe_enabled')
        .single();
    
    return data?.value === true || data?.value === 'true';
};

export const setStripeConfig = async (enabled: boolean): Promise<boolean> => {
    const { error } = await supabase
        .from('app_config')
        .upsert({
            key: 'stripe_enabled',
            value: enabled
        });
        
    return !error;
};

// --- Admin: Get ALL Registered Users ---
export const getAdminUserSummary = async (): Promise<UserSummary[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== 'jeratomise@gmail.com') return [];

  // 1. Fetch all registered users from subscriptions table
  const { data: allUsers, error: userError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (userError || !allUsers) return [];

  // 2. Fetch stay counts for all users
  const { data: stayCounts, error: stayError } = await supabase
    .from('stays')
    .select('user_id');

  if (stayError) return [];

  // 3. Aggregate stay data
  const stayMap: Record<string, number> = {};
  stayCounts.forEach((s: any) => {
      stayMap[s.user_id] = (stayMap[s.user_id] || 0) + 1;
  });

  // 4. Merge
  return allUsers.map((u: any) => ({
    userId: u.user_id,
    email: u.email || 'Unknown User',
    totalStays: stayMap[u.user_id] || 0,
    lastActive: u.updated_at || u.created_at,
    subscription: {
        userId: u.user_id,
        status: u.status,
        expiresAt: u.expires_at,
        stripeCustomerId: u.stripe_customer_id
    }
  }));
};

// --- Avatar Management ---
export const uploadUserAvatar = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (uploadError) return null;

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
    });

    return publicUrl;
};

export const addStay = async (stay: Omit<Stay, 'id' | 'createdAt' | 'userId' | 'userEmail'>): Promise<Stay | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbPayload = {
    user_id: user.id,
    user_email: user.email,
    hotel_name: stay.hotelName,
    brand: stay.brand,
    country: stay.country,
    check_in_date: stay.checkInDate,
    check_out_date: stay.checkOutDate,
    cost: stay.cost,
    rating: stay.rating
  };

  const { data, error } = await supabase
    .from('stays')
    .insert([dbPayload])
    .select()
    .single();

  if (error) return null;

  return {
    id: data.id,
    userId: data.user_id,
    userEmail: data.user_email,
    hotelName: data.hotel_name,
    brand: data.brand,
    country: data.country,
    checkInDate: data.check_in_date,
    checkOutDate: data.check_out_date,
    cost: Number(data.cost),
    rating: data.rating,
    createdAt: new Date(data.created_at).getTime()
  };
};

export const updateStay = async (id: string, updates: Partial<Stay>): Promise<Stay | null> => {
  const dbPayload: any = {};
  if (updates.hotelName) dbPayload.hotel_name = updates.hotelName;
  if (updates.brand) dbPayload.brand = updates.brand;
  if (updates.country) dbPayload.country = updates.country;
  if (updates.checkInDate) dbPayload.check_in_date = updates.checkInDate;
  if (updates.checkOutDate) dbPayload.check_out_date = updates.checkOutDate;
  if (updates.cost !== undefined) dbPayload.cost = updates.cost;
  if (updates.rating !== undefined) dbPayload.rating = updates.rating;

  const { data, error } = await supabase
    .from('stays')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) return null;

  return {
    id: data.id,
    userId: data.user_id,
    userEmail: data.user_email,
    hotelName: data.hotel_name,
    brand: data.brand,
    country: data.country,
    checkInDate: data.check_in_date,
    checkOutDate: data.check_out_date,
    cost: Number(data.cost),
    rating: data.rating,
    createdAt: new Date(data.created_at).getTime()
  };
};

export const deleteStay = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('stays').delete().eq('id', id);
  return !error;
};

export const importStays = async (newStays: any[]): Promise<Stay[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const payload = newStays.map((s: any) => ({
    user_id: user.id,
    user_email: user.email,
    hotel_name: s.hotelName,
    brand: s.brand,
    country: s.country || 'Unknown',
    check_in_date: s.checkInDate || s.date,
    check_out_date: s.checkOutDate || (s.date ? addDays(s.date, 1) : ''),
    cost: s.cost || 0,
    rating: typeof s.rating === 'number' ? s.rating : null
  })).filter(s => s.hotel_name && s.brand && s.check_in_date);

  if (payload.length === 0) return [];

  const { data, error } = await supabase.from('stays').insert(payload).select();
  if (error) return [];

  return data.map((item: any) => ({
    id: item.id,
    userId: item.user_id,
    userEmail: item.user_email,
    hotelName: item.hotel_name,
    brand: item.brand,
    country: item.country,
    checkInDate: item.check_in_date,
    checkOutDate: item.check_out_date,
    cost: Number(item.cost),
    rating: item.rating,
    createdAt: new Date(item.created_at).getTime()
  }));
};

export const getManualStatuses = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
  } catch {
    return {};
  }
};

export const saveManualStatus = (programId: string, statusName: string) => {
  const current = getManualStatuses();
  if (statusName === 'Member') delete current[programId];
  else current[programId] = statusName;
  localStorage.setItem(STATUS_KEY, JSON.stringify(current));
  return current;
};