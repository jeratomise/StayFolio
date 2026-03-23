const SUPABASE_URL = 'https://sjafvrqlunulksvfmsav.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYWZ2cnFsdW51bGtzdmZtc2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzMwOTQsImV4cCI6MjA4MzcwOTA5NH0.Cc_pLSJFFvF6xalYEg1nu1oommzS9oFcL7MAdMM0xHE';

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

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

// Lightweight Supabase REST client (avoids adding @supabase/supabase-js as a dependency)
async function supabaseGet<T>(
  table: string,
  query: string = ''
): Promise<SupabaseResponse<T>> {
  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${query}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!resp.ok) {
      return { data: null, error: { message: `HTTP ${resp.status}` } };
    }
    const data = await resp.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: String(err) } };
  }
}

async function invokeEdgeFunction(name: string): Promise<{ status: string; articlesProcessed?: number }> {
  const resp = await fetch(
    `${SUPABASE_URL}/functions/v1/${name}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return resp.json();
}

// Fetch hotel news, triggering a refresh if cache is stale
export async function getHotelNews(): Promise<HotelNewsArticle[]> {
  // First, try to get cached articles
  const { data: articles, error } = await supabaseGet<HotelNewsArticle[]>(
    'hotel_news',
    'select=*&order=published_at.desc&limit=20'
  );

  if (error || !articles) {
    console.error('Failed to fetch hotel news:', error?.message);
    return [];
  }

  // Check if cache is stale (oldest created_at > 7 days)
  if (articles.length === 0 || isCacheStale(articles)) {
    // Trigger refresh in the background
    invokeEdgeFunction('fetch-hotel-news')
      .then((result) => {
        console.log('Hotel news refresh:', result);
      })
      .catch((err) => {
        console.error('Failed to refresh hotel news:', err);
      });
  }

  return articles;
}

function isCacheStale(articles: HotelNewsArticle[]): boolean {
  if (articles.length === 0) return true;
  const newest = new Date(articles[0].created_at).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - newest > sevenDays;
}
