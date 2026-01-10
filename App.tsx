import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Briefcase, Share2, Plus, Hotel, Trash2, Pencil, Download, Upload, Moon, Award, TrendingUp, Star, Building2, Crown, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Stay, ViewMode, StatSummary } from './types';
import { getStays, addStay, deleteStay, updateStay, importStays } from './services/storage';
import { StayForm } from './components/StayForm';
import { BrandPortfolio } from './components/BrandPortfolio';
import { ShareView } from './components/ShareView';
import { EliteStatusView } from './components/EliteStatusView';
import { DataManagementModal } from './components/DataManagementModal';
import { ELITE_PROGRAMS, BRAND_LOGOS } from './constants';

const StatusTracker: React.FC<{ stays: Stay[] }> = ({ stays }) => {
  
  const trackerData = useMemo(() => {
    // Determine the most relevant year to track. 
    // If the user has stays in a future year (e.g., 2026), track that. Otherwise current year.
    const currentYear = new Date().getFullYear();
    const maxStayYear = stays.length > 0 
        ? Math.max(...stays.map(s => new Date(s.checkInDate).getFullYear())) 
        : currentYear;
    
    // Use maxStayYear if it's >= currentYear, otherwise default to currentYear
    const trackingYear = maxStayYear >= currentYear ? maxStayYear : currentYear;
    
    // Map existing stays to programs
    const activePrograms = ELITE_PROGRAMS.map(program => {
        // Calculate nights for this brand in tracking year
        const brandNights = stays
            .filter(s => s.brand === program.name && new Date(s.checkInDate).getFullYear() === trackingYear)
            .reduce((acc, stay) => {
                if (!stay.checkInDate || !stay.checkOutDate) return acc;
                const start = new Date(stay.checkInDate);
                const end = new Date(stay.checkOutDate);
                const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                return acc + Math.max(0, nights);
            }, 0);

        if (brandNights === 0) return null;

        // Determine Status
        const tiers = [...program.tiers].sort((a, b) => (a.requirements.nights || 0) - (b.requirements.nights || 0));
        
        let nextTier = null;
        let currentTier = null;

        for (const tier of tiers) {
            const req = tier.requirements.nights || 0;
            if (brandNights >= req) {
                currentTier = tier;
            } else if (!nextTier) {
                nextTier = tier;
            }
        }

        const targetNights = nextTier ? (nextTier.requirements.nights || 0) : (currentTier?.requirements.nights || 0);
        const progress = Math.min(100, (brandNights / targetNights) * 100);
        const isMax = !nextTier;

        return {
            id: program.id,
            brand: program.name,
            nights: brandNights,
            currentTierName: currentTier?.name || 'Member',
            nextTierName: nextTier?.name || 'Top Tier',
            targetNights,
            remaining: Math.max(0, targetNights - brandNights),
            progress,
            isMax,
            color: program.color,
            logo: BRAND_LOGOS[program.name],
            year: trackingYear
        };
    }).filter((p): p is NonNullable<typeof p> => p !== null);

    return activePrograms.sort((a, b) => b.nights - a.nights);
  }, [stays]);

  if (trackerData.length === 0) {
      return (
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white p-5 text-center mb-6">
            <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Crown size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Start Your Climb</h3>
            <p className="text-slate-400 text-xs mt-1">Log a stay to unlock status tracking.</p>
        </div>
      );
  }

  return (
    <div className="mb-6">
       <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Award size={16} className="text-indigo-600" />
            Active Challenges ({trackerData[0].year})
       </h3>
       
       {/* Horizontal Scroll Container (Tiles) */}
       <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
           {trackerData.map((data) => (
               <div 
                 key={data.id}
                 className="snap-center shrink-0 w-[280px] relative rounded-2xl overflow-hidden shadow-lg bg-white text-white min-h-[160px] flex flex-col"
               >
                   {/* Background */}
                   <div className={`absolute inset-0 ${data.color} opacity-90`}></div>
                   <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/40"></div>

                   <div className="relative p-4 flex flex-col h-full z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-8 h-8 bg-white rounded-lg p-1 shadow-sm shrink-0">
                                <img src={data.logo} alt={data.brand} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            </div>
                            <span className="text-[10px] font-bold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                                {data.currentTierName}
                            </span>
                        </div>

                        {/* Brand Name */}
                        <h4 className="text-lg font-black leading-tight mb-auto">{data.brand}</h4>

                        {/* Stats */}
                        <div className="mt-4">
                             <div className="flex justify-between items-end mb-1.5">
                                 <div>
                                     <span className="text-2xl font-black">{data.nights}</span>
                                     <span className="text-xs font-medium opacity-80"> / {data.targetNights} Nights</span>
                                 </div>
                                 {!data.isMax && (
                                     <span className="text-[10px] font-bold opacity-80 mb-1">{data.remaining} to {data.nextTierName}</span>
                                 )}
                             </div>
                             
                             {/* Bar */}
                             <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                                <div 
                                    className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                    style={{ width: `${data.progress}%` }}
                                ></div>
                             </div>
                        </div>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [stays, setStays] = useState<Stay[]>([]);
  const [view, setView] = useState<ViewMode>('portfolio'); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [editingStay, setEditingStay] = useState<Stay | undefined>(undefined);
  
  // Filtering States
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');

  useEffect(() => {
    setStays(getStays());
  }, []);

  const handleSaveStay = (stayData: Omit<Stay, 'id' | 'createdAt'>) => {
    if (editingStay) {
      const updated = updateStay(editingStay.id, stayData);
      if (updated) {
        setStays(prev => prev.map(s => s.id === updated.id ? updated : s));
      }
    } else {
      const newStay = addStay(stayData);
      setStays(prev => [newStay, ...prev]);
    }
  };

  const handleDeleteStay = (id: string) => {
    deleteStay(id);
    setStays(prev => prev.filter(s => s.id !== id));
  };

  const handleSetRating = (id: string, rating: number) => {
    const updated = updateStay(id, { rating });
    if (updated) {
        setStays(prev => prev.map(s => s.id === updated.id ? updated : s));
    }
  };

  const handleEditClick = (stay: Stay) => {
    setEditingStay(stay);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStay(undefined);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stays, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `stayfolio_data_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (importedStays: any[]) => {
      importStays(importedStays);
      setStays(getStays());
  };

  // --- Stats Calculation ---
  const stats: StatSummary = useMemo(() => {
    const uniqueBrands = new Set(stays.map(s => s.brand));
    const brandCounts: Record<string, number> = {};
    
    let totalNights = 0;
    stays.forEach(s => {
        brandCounts[s.brand] = (brandCounts[s.brand] || 0) + 1;
        if (s.checkInDate && s.checkOutDate) {
            const start = new Date(s.checkInDate).getTime();
            const end = new Date(s.checkOutDate).getTime();
            const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
            totalNights += Math.max(0, nights);
        }
    });
    
    const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    
    return {
      totalStays: stays.length,
      totalNights,
      uniqueBrands: uniqueBrands.size,
      topBrand,
      thisYearStays: stays.filter(s => new Date(s.checkInDate).getFullYear() === new Date().getFullYear()).length
    };
  }, [stays]);

  // --- Chart Data Calculation ---
  const brandChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    stays.forEach(s => {
        if (!s.checkInDate || !s.checkOutDate) return;
        const start = new Date(s.checkInDate).getTime();
        const end = new Date(s.checkOutDate).getTime();
        const nights = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        counts[s.brand] = (counts[s.brand] || 0) + nights;
    });

    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [stays]);

  // --- Filtering Logic ---
  const availableYears = useMemo(() => {
      const years = new Set(stays.map(s => new Date(s.checkInDate).getFullYear()));
      return Array.from(years).sort((a, b) => b - a).map(String);
  }, [stays]);

  const filteredStays = useMemo(() => {
    return stays.filter(s => {
        const d = new Date(s.checkInDate);
        if (filterYear !== 'All' && d.getFullYear().toString() !== filterYear) return false;
        if (filterMonth !== 'All' && d.toLocaleString('default', { month: 'short' }) !== filterMonth) return false;
        return true;
    });
  }, [stays, filterYear, filterMonth]);

  // Helper to format date range
  const formatStayDate = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const nights = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
        dateStr: `${s.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${e.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`,
        nights: Math.max(0, nights)
    };
  };

  // Helper for Chart Labels
  const formatBrandLabel = (val: string) => {
      const brandMap: Record<string, string> = {
        'World of Hyatt': 'Hyatt',
        'Marriott Bonvoy': 'Marriott',
        'IHG One Rewards': 'IHG',
        'Hilton Honors': 'Hilton',
        'Accor Live Limitless': 'Accor'
      };
      if (brandMap[val]) return brandMap[val];
      return val.length > 8 ? val.substring(0, 6) + '..' : val;
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-slate-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-30 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <Hotel size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900">StayFolio</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full mr-2 hidden sm:block">
              {stats.totalNights} Nights • {stats.totalStays} Stays
            </div>
            
            <button 
                onClick={() => setIsDataModalOpen(true)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" 
                title="Manage Data"
            >
                <Upload size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {/* Manage View (Formerly Dashboard) */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            
            {/* 1. Status Tracker Card (Replaces Generic Gamification) */}
            <StatusTracker stays={stays} />

            {/* Prominent Add Button (Moved out of card) */}
            <button 
                onClick={() => { setEditingStay(undefined); setIsFormOpen(true); }}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
                <Plus size={20} strokeWidth={3} />
                Log New Adventure
            </button>

            {/* 2. Nights by Brand Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Building2 size={18} className="text-indigo-600" />
                        Nights by Brand
                    </h3>
                 </div>
                 <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={brandChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} 
                                axisLine={false} 
                                tickLine={false} 
                                dy={10}
                                tickFormatter={formatBrandLabel}
                            />
                            <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {brandChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>

            {/* 3. Filter Bar */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                    <h3 className="font-bold text-lg">My Stays</h3>
                    <div className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">
                        {filteredStays.length}
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    {/* Year Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            onClick={() => setFilterYear('All')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                                filterYear === 'All' 
                                ? 'bg-slate-800 text-white border-slate-800' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            All Years
                        </button>
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => setFilterYear(year)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                                    filterYear === year 
                                    ? 'bg-slate-800 text-white border-slate-800' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>

                    {/* Month Filter (Optional - simplified for now) */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            onClick={() => setFilterMonth('All')}
                            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                                filterMonth === 'All' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            All Months
                        </button>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                            <button
                                key={m}
                                onClick={() => setFilterMonth(m)}
                                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                                    filterMonth === m ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Stays List - COMPACT DESIGN */}
            <div className="space-y-2 pb-24">
                {filteredStays.length === 0 ? (
                     <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <TrendingUp size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">No stays match your filters.</p>
                        <button onClick={() => { setFilterYear('All'); setFilterMonth('All'); }} className="mt-2 text-indigo-600 text-sm font-bold hover:underline">Clear Filters</button>
                    </div>
                ) : (
                    filteredStays.map(stay => {
                        const { dateStr, nights } = formatStayDate(stay.checkInDate, stay.checkOutDate);
                        const currentRating = stay.rating || 0;
                        
                        return (
                            <div key={stay.id} className="bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0 border border-slate-100">
                                        {stay.brand.charAt(0)}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="font-bold text-slate-800 text-sm truncate">{stay.hotelName}</h3>
                                            <span className="text-xs text-slate-400 truncate hidden sm:inline">{stay.brand}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="truncate max-w-[100px]">{stay.country}</span>
                                            <span className="text-slate-300">•</span>
                                            <span>{dateStr}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right Side: Ratings & Actions */}
                                <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-2">
                                    {/* Interactive Star Rating - HIDDEN ON MOBILE */}
                                    <div className="hidden sm:flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star}
                                                onClick={() => handleSetRating(stay.id, star)}
                                                className="p-0.5 focus:outline-none hover:scale-125 transition-transform"
                                            >
                                                <Star 
                                                    size={14} 
                                                    className={`${currentRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}`} 
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => handleEditClick(stay)}
                                            className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteStay(stay.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
          </div>
        )}

        {/* Portfolio View */}
        {view === 'portfolio' && (
             <BrandPortfolio stays={stays} />
        )}
        
        {/* Elite Status View */}
        {view === 'status' && (
            <EliteStatusView stays={stays} />
        )}

        {/* Share View */}
        {view === 'share' && (
            <ShareView stays={stays} summary={stats} />
        )}

      </main>

      {/* Floating Action Button for Mobile Add (Only visible on Manage tab) */}
      {view === 'dashboard' && (
         <button 
            onClick={() => { setEditingStay(undefined); setIsFormOpen(true); }}
            className="md:hidden fixed bottom-24 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-transform active:scale-95 z-20"
         >
            <Plus size={24} />
         </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-3 px-6 md:px-0 z-30">
        <div className="max-w-xl mx-auto flex justify-between md:justify-center md:gap-8">
            <NavButton 
                active={view === 'portfolio'} 
                onClick={() => setView('portfolio')} 
                icon={<Briefcase size={24} />} 
                label="Portfolio" 
            />
            <NavButton 
                active={view === 'dashboard'} 
                onClick={() => setView('dashboard')} 
                icon={<LayoutDashboard size={24} />} 
                label="Manage" 
            />
             <NavButton 
                active={view === 'status'} 
                onClick={() => setView('status')} 
                icon={<Crown size={24} />} 
                label="Status" 
            />
            <NavButton 
                active={view === 'share'} 
                onClick={() => setView('share')} 
                icon={<Share2 size={24} />} 
                label="Share" 
            />
        </div>
      </nav>

      {/* Modals */}
      {isFormOpen && (
        <StayForm 
            initialData={editingStay}
            onSave={handleSaveStay} 
            onClose={handleCloseForm} 
        />
      )}

      {isDataModalOpen && (
          <DataManagementModal
            currentStaysCount={stays.length}
            onClose={() => setIsDataModalOpen(false)}
            onImport={handleImportData}
            onExport={handleExport}
          />
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </button>
);

export default App;