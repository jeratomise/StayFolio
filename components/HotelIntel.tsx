import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Rss } from 'lucide-react';
import { HotelNewsArticle, getHotelNews } from '../services/supabase';
import { BRAND_LOGOS } from '../constants';

const BrandIcon: React.FC<{ brand: string }> = ({ brand }) => {
  const [error, setError] = useState(false);
  const logoUrl = BRAND_LOGOS[brand];

  if (logoUrl && !error) {
    return (
      <img
        src={logoUrl}
        alt={brand}
        onError={() => setError(true)}
        className="w-full h-full object-contain"
      />
    );
  }
  return <Newspaper size={14} className="text-slate-400" />;
};

const timeAgo = (dateStr: string): string => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SectionHeader: React.FC = () => (
  <div className="flex items-center gap-2">
    <div className="h-6 w-1 bg-amber-500 rounded-full"></div>
    <h2 className="text-lg font-bold text-slate-800">Hotel Intel</h2>
    <span className="bg-amber-50 text-amber-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-wider">
      Weekly
    </span>
  </div>
);

export const HotelIntel: React.FC = () => {
  const [articles, setArticles] = useState<HotelNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true);
    try {
      const news = await getHotelNews();
      setArticles(news);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <SectionHeader />
        <div className="flex items-center justify-center py-8 bg-white rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <RefreshCw size={14} className="animate-spin" />
            Loading hotel intel...
          </div>
        </div>
      </div>
    );
  }

  if (error || articles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader />
        <button
          onClick={() => fetchNews(true)}
          disabled={refreshing}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-50"
          title="Refresh intel"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
        {articles.slice(0, 10).map((article) => (
          <a
            key={article.id}
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="snap-center shrink-0 w-[280px] bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-4 flex flex-col gap-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-50 rounded-md p-0.5 border border-slate-100 flex items-center justify-center">
                  <BrandIcon brand={article.brand} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {article.brand.split(' ')[0]}
                </span>
              </div>
              <ExternalLink size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>

            <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
              {article.title}
            </h4>

            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
              {article.summary}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Rss size={10} />
                via {article.source_name}
              </div>
              <span className="text-[10px] text-slate-400">
                {timeAgo(article.published_at)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
