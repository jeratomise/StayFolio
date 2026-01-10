import React, { useState, useMemo } from 'react';
import { Stay, StatSummary } from '../types';
import { Sparkles, RefreshCw, MapPin, Building2, Copy, Check } from 'lucide-react';
import { generateSocialCaption } from '../services/ai';

interface ShareViewProps {
  stays: Stay[];
  summary: StatSummary;
}

export const ShareView: React.FC<ShareViewProps> = ({ stays, summary }) => {
  const [caption, setCaption] = useState<string | null>(null);
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Static Background for Guest Book aesthetic
  const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=3024&auto=format&fit=crop";

  const handleGenerateCaption = async () => {
    setLoadingCaption(true);
    const text = await generateSocialCaption(stays);
    setCaption(text);
    setLoadingCaption(false);
  };

  const copyToClipboard = () => {
    if (caption) {
      navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate stats for the view
  const totalCountries = useMemo(() => {
    const countries = new Set(stays.map(s => s.country).filter(c => c && c !== 'Unknown'));
    return countries.size;
  }, [stays]);

  // Calculate top countries
  const topCountries = useMemo(() => {
    const counts: Record<string, number> = {};
    stays.forEach(s => {
        const c = s.country || 'Unknown';
        counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
  }, [stays]);

  // Calculate top brands (for the list view)
  const topBrands = useMemo(() => {
    const counts: Record<string, number> = {};
    stays.forEach(s => counts[s.brand] = (counts[s.brand] || 0) + 1);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [stays]);

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20">
      
      {/* The Guest Book Card (Visual for Sharing) */}
      <div className="relative group rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] bg-slate-900">
        
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
             <img 
                src={BACKGROUND_IMAGE} 
                alt="Travel Guest Book" 
                className="w-full h-full object-cover opacity-90" 
             />
             <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Paper / Card Overlay */}
        <div className="absolute inset-6 sm:inset-10 bg-[#f8f5f2] rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden text-slate-800">
            
            {/* Texture overlay for paper feel */}
            <div className="absolute inset-0 opacity-50 pointer-events-none mix-blend-multiply" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`}}></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                
                {/* Header */}
                <div className="text-center pt-8 pb-4 border-b-2 border-slate-800 mx-8">
                    <h1 className="font-serif text-3xl font-black uppercase tracking-widest text-slate-800">Guest Book</h1>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="h-px w-8 bg-slate-400"></span>
                        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-500">Chronicles {new Date().getFullYear()}</p>
                        <span className="h-px w-8 bg-slate-400"></span>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="flex-1 grid grid-cols-2 gap-px bg-slate-200 border-b border-slate-200 my-4 mx-8 border-2 border-slate-800">
                    <div className="bg-[#f8f5f2] p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-black text-slate-800">{summary.totalStays}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Stays</span>
                    </div>
                    <div className="bg-[#f8f5f2] p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-black text-slate-800">{summary.totalNights}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Nights</span>
                    </div>
                    <div className="bg-[#f8f5f2] p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-black text-slate-800">{totalCountries}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Countries</span>
                    </div>
                    <div className="bg-[#f8f5f2] p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-black text-slate-800">{summary.uniqueBrands}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Brands</span>
                    </div>
                </div>

                {/* Footer Details */}
                <div className="mt-auto bg-slate-100 p-6 grid grid-cols-2 gap-6 border-t border-slate-200">
                     
                     {/* Top Brands */}
                     <div>
                        <div className="flex items-center gap-1 text-slate-400 mb-2">
                             <Building2 size={10} />
                             <h3 className="text-[9px] font-bold uppercase tracking-widest">Top Groups</h3>
                        </div>
                        <ul className="space-y-1.5">
                            {topBrands.length > 0 ? topBrands.map(([brand, count]) => (
                                <li key={brand} className="flex justify-between items-center text-xs border-b border-slate-200 pb-1 last:border-0">
                                    <span className="font-bold text-slate-700 truncate pr-2">{brand}</span>
                                    <span className="text-slate-400">{count}</span>
                                </li>
                            )) : (
                                <li className="text-xs text-slate-400 italic">No stays recorded</li>
                            )}
                        </ul>
                     </div>

                     {/* Top Countries */}
                     <div>
                        <div className="flex items-center gap-1 text-slate-400 mb-2">
                             <MapPin size={10} />
                             <h3 className="text-[9px] font-bold uppercase tracking-widest">Destinations</h3>
                        </div>
                        <ul className="space-y-1.5">
                             {topCountries.length > 0 ? topCountries.map(([country, count]) => (
                                <li key={country} className="flex justify-between items-center text-xs border-b border-slate-200 pb-1 last:border-0">
                                    <span className="font-bold text-slate-700 truncate pr-2">{country}</span>
                                    <span className="text-slate-400">{count}</span>
                                </li>
                            )) : (
                                <li className="text-xs text-slate-400 italic">Go explore!</li>
                            )}
                        </ul>
                     </div>
                </div>
            </div>
        </div>
      </div>

      {/* AI Caption Generator (Manual Trigger Only) */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-indigo-600">
                <Sparkles size={18} />
                <h3 className="font-bold text-sm">AI Storyteller</h3>
            </div>
            
            <div className="space-y-3">
                {caption || loadingCaption ? (
                    <div className="relative">
                        {loadingCaption ? (
                            <div className="flex items-center justify-center py-6 space-x-2 text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-sm text-slate-700 italic leading-relaxed">
                                    "{caption}"
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                        <p className="text-sm text-slate-500 mb-3">Need a witty caption for this summary?</p>
                        <button 
                            onClick={handleGenerateCaption}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                        >
                            <Sparkles size={16} />
                            Generate Caption
                        </button>
                    </div>
                )}
                
                {caption && !loadingCaption && (
                    <div className="flex gap-3">
                        <button 
                            onClick={copyToClipboard} 
                            className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                        <button 
                            onClick={handleGenerateCaption} 
                            className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            title="Try another caption"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>

    </div>
  );
};
