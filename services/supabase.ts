import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://sjafvrqlunulksvfmsav.supabase.co';
const SUPABASE_KEY = 'sb_publishable_apv5M2SUV5IMj_Aj5MloXw_Y45p3MpI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface HotelNewsArticle {
  id: string;
  brand: string;
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  published_at: string;
  created_at: string;
}

function isCacheStale(articles: HotelNewsArticle[]): boolean {
  if (articles.length === 0) return true;
  const newest = new Date(articles[0].created_at).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - newest > sevenDays;
}

export async function getHotelNews(): Promise<HotelNewsArticle[]> {
  const { data: articles, error } = await supabase
    .from('hotel_news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error || !articles) {
    console.error('Failed to fetch hotel news:', error?.message);
    return [];
  }

  if (articles.length === 0 || isCacheStale(articles)) {
    supabase.functions.invoke('fetch-hotel-news')
      .then((result) => console.log('Hotel news refresh:', result))
      .catch((err) => console.error('Failed to refresh hotel news:', err));
  }

  return articles as HotelNewsArticle[];
}