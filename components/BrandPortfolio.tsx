import React, { useMemo, useState } from 'react';
import { BrandGroup, Stay } from '../types';
import { Building2, Calendar, Moon, MapPin, Trophy, Banknote, TrendingUp, TrendingDown, Home, Plane, Filter, MessageCircle, User, Sparkles } from 'lucide-react';
import { BRAND_LOGOS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BrandPortfolioProps {
  stays: Stay[];
}

const BrandLogo: React.FC<{ brand: string }> = ({ brand }) => {
  const [error, setError] = useState(false);
  const logoUrl = BRAND_LOGOS[brand];

  if (logoUrl && !error) {
    return (
      <img 
        src={logoUrl} 
        alt={brand} 
        onError={() => setError(true)}
        className="h-full w-full object-contain" 
      />
    );
  }

  return (
     <Building2 size={24} className="text-slate-300" />
  );
};

export const BrandPortfolio: React.FC<BrandPortfolioProps> = ({ stays }) => {
  const [chartMode, setChartMode] = useState<'month' | 'weekday' | 'year'>('month');
  const [timeFilter, setTimeFilter] = useState<string>('All Time');
  const [persona, setPersona] = useState<'mom' | 'hype'>('mom');

  // Extract available years for filter
  const availableYears = useMemo(() => {
    const years = new Set(stays.map(s => new Date(s.checkInDate).getFullYear()));
    return Array.from(years).sort((a: number, b: number) => b - a).map(String);
  }, [stays]);

  // Filter Logic
  const filteredStays = useMemo(() => {
    if (timeFilter === 'All Time') return stays;
    return stays.filter(s => new Date(s.checkInDate).getFullYear().toString() === timeFilter);
  }, [stays, timeFilter]);

  // --- Calculations ---
  const { brandGroups, totalNights, totalBrands, countriesVisited, topCountry, topHotel, chartData, financial } = useMemo(() => {
    const groups: Record<string, Stay[]> = {};
    const countryCounts: Record<string, number> = {};
    const hotelCounts: Record<string, number> = {};
    let nightsSum = 0;
    let costSum = 0;
    let maxCostStay: Stay | null = null;
    let minCostStay: Stay | null = null;
    
    // Chart Data Pre-fill
    const monthCounts = Array(12).fill(0);
    const dayCounts = Array(7).fill(0);
    const yearCounts: Record<string, number> = {};

    filteredStays.forEach(stay => {
      // Groups
      const b = stay.brand || 'Unbranded';
      if (!groups[b]) groups[b] = [];
      groups[b].push(stay);

      // Nights
      const s = new Date(stay.checkInDate);
      const e = new Date(stay.checkOutDate);
      const n = Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      nightsSum += n;

      // Countries
      const c = stay.country || 'Unknown';
      countryCounts[c] = (countryCounts[c] || 0) + 1;

      // Hotels
      hotelCounts[stay.hotelName] = (hotelCounts[stay.hotelName] || 0) + 1;

      // Cost
      const cost = stay.cost || 0;
      costSum += cost;
      if (cost > 0) {
        if (!maxCostStay || cost > (maxCostStay.cost || 0)) maxCostStay = stay;
        if (!minCostStay || cost < (minCostStay.cost || 0)) minCostStay = stay;
      }

      // Charts
      monthCounts[s.getMonth()]++;
      const day = s.getDay(); // 0 is Sunday
      dayCounts[day]++;
      
      const yr = s.getFullYear().toString();
      yearCounts[yr] = (yearCounts[yr] || 0) + 1;
    });

    const sortedGroups = Object.entries(groups)
      .map(([brand, stays]) => ({
        brand,
        count: stays.length,
        stays: stays.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
      }))
      .sort((a, b) => b.count - a.count);

    const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
    const sortedHotels = Object.entries(hotelCounts).sort((a, b) => b[1] - a[1]);

    // Chart Formatting
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    let formattedChartData: any[] = [];
    
    if (chartMode === 'month') {
        formattedChartData = monthCounts.map((count, i) => ({ name: monthNames[i], stays: count }));
    } else if (chartMode === 'weekday') {
        formattedChartData = dayCounts.map((count, i) => ({ name: dayNames[i], stays: count }));
    } else {
        const yearsToShow = timeFilter === 'All Time' ? availableYears : [timeFilter];
        formattedChartData = yearsToShow.sort().map(y => ({ name: y, stays: yearCounts[y] || 0 }));
    }

    return {
      brandGroups: sortedGroups,
      totalNights: nightsSum,
      totalBrands: Object.keys(groups).length,
      countriesVisited: Object.keys(countryCounts).length,
      topCountry: sortedCountries[0],
      topHotel: sortedHotels[0],
      chartData: formattedChartData,
      financial: {
        total: costSum,
        avgNight: nightsSum > 0 ? costSum / nightsSum : 0,
        maxStay: maxCostStay,
        minStay: minCostStay
      }
    };
  }, [filteredStays, chartMode, timeFilter, availableYears, stays]);

  // --- Persona Comment Generators ---
  const getNaggyComment = (nights: number, cost: number) => {
    if (nights === 0) return "So you're finally staying home? I suppose that's good, but when are you going to visit your grandmother?";
    const random = Math.random();
    if (cost > 5000) return "You spent THAT much on sleeping? You know your cousin Timmy just put a down payment on a house. Just saying.";
    if (nights > 50) return "Do you even have a real home anymore? Should I send your mail to the Marriott? You look tired in your photos.";
    if (nights > 20) return "Always running around. You treat your apartment like a storage unit. Don't forget to water your plants... oh wait, they're dead.";
    if (random > 0.5) return "Oh, another trip? Must be nice. I've been here knitting socks. Enjoy your fluffy hotel pillows.";
    return "Have you been eating enough? Hotel food is full of salt. Make sure you pack a sweater, the AC is always too cold.";
  };

  const getHypeComment = (nights: number, cost: number) => {
    if (nights === 0) return "Manifesting a trip for you bestie! 🧘‍♀️ The world is waiting. Let's get those points!";
    if (cost > 5000) return "It's giving WEALTH. 💅 Treat yourself, you earned every penny! That room service life chose you.";
    if (nights > 50) return "CEO of catching flights! ✈️ Leave some luxury for the rest of us! You're literally glowing.";
    if (nights > 20) return "Main character energy only! 📸 Keep building that passport portfolio. Your feed is looking immaculate.";
    return "Yesss! Living your best life! ✨ Catch flights not feelings. We love a globetrotting icon.";
  };

  return (
    <div className="space-y-10 pb-20">
      
      {/* Header */}
      <div className="text-center space-y-2">
         <div className="inline-block p-3 bg-indigo-100 rounded-full text-indigo-600 mb-2">
            <Trophy size={32} />
         </div>
         <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Portfolio Passport</h1>
         <p className="text-slate-500 max-w-md mx-auto">A visual breakdown of your hospitality conquest.</p>
      </div>

      {/* SECTION 1: The Breakdown (With Time Filter) */}
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
             <div className="flex items-center gap-2">
                 <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
                 <h2 className="text-lg font-bold text-slate-800">The Breakdown</h2>
             </div>
             
             {/* Time Filter Pills */}
             <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 sm:pb-0 scrollbar-hide">
                <button
                    onClick={() => setTimeFilter('All Time')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        timeFilter === 'All Time' 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    All Time
                </button>
                {availableYears.map(year => (
                    <button
                        key={year}
                        onClick={() => setTimeFilter(year)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            timeFilter === year 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {year}
                    </button>
                ))}
             </div>
         </div>
         
         {/* Center Aligned Stats */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-32">
                 <div className="flex items-center gap-2 text-indigo-600 mb-1"><Moon size={16} /><span className="text-xs font-bold uppercase">Nights</span></div>
                 <p className="text-3xl font-black text-slate-800">{totalNights}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-32">
                 <div className="flex items-center gap-2 text-emerald-600 mb-1"><Plane size={16} /><span className="text-xs font-bold uppercase">Countries</span></div>
                 <p className="text-3xl font-black text-slate-800">{countriesVisited}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-32">
                 <div className="flex items-center gap-2 text-amber-600 mb-1"><Building2 size={16} /><span className="text-xs font-bold uppercase">Brands</span></div>
                 <p className="text-3xl font-black text-slate-800">{totalBrands}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-32">
                 <div className="flex items-center gap-2 text-rose-600 mb-1"><Home size={16} /><span className="text-xs font-bold uppercase">Avg Stay</span></div>
                 <p className="text-3xl font-black text-slate-800">{filteredStays.length > 0 ? (totalNights / filteredStays.length).toFixed(1) : 0}</p>
                 <span className="text-xs font-medium text-slate-400">nights / stay</span>
             </div>
         </div>

         {/* Chart Section */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <h3 className="font-bold text-slate-700">Stays Frequency ({timeFilter})</h3>
                 <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium w-full sm:w-auto">
                     <button 
                        onClick={() => setChartMode('month')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${chartMode === 'month' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Monthly
                     </button>
                     <button 
                        onClick={() => setChartMode('weekday')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${chartMode === 'weekday' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Weekdays
                     </button>
                     <button 
                        onClick={() => setChartMode('year')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${chartMode === 'year' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Yearly
                     </button>
                 </div>
             </div>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                        />
                        <Bar dataKey="stays" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.stays > 0 ? '#4f46e5' : '#e2e8f0'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
         </div>
      </div>

      {/* SECTION 2: Reality Check (With Persona Slider) */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`h-6 w-1 rounded-full ${persona === 'mom' ? 'bg-rose-500' : 'bg-purple-500'}`}></div>
                <h2 className="text-lg font-bold text-slate-800">Reality Check</h2>
            </div>
            
            {/* Persona Toggle */}
            <div className="bg-slate-100 p-1 rounded-full inline-flex relative cursor-pointer">
                <button 
                    onClick={() => setPersona('mom')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all relative z-10 flex items-center gap-1 ${persona === 'mom' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <User size={12} /> Mom
                </button>
                <button 
                    onClick={() => setPersona('hype')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all relative z-10 flex items-center gap-1 ${persona === 'hype' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Sparkles size={12} /> Bestie
                </button>
            </div>
         </div>

         {/* Chat Bubble Interface */}
         <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex gap-4 items-start transition-colors duration-500">
             <div className="flex-shrink-0">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                     persona === 'mom' ? 'bg-rose-100 border-rose-200 text-rose-500' : 'bg-purple-100 border-purple-200 text-purple-500'
                 }`}>
                    {persona === 'mom' ? <User size={24} /> : <Sparkles size={24} />}
                 </div>
             </div>
             <div className="flex-1 space-y-2">
                 <div className="flex items-center gap-2">
                     <span className="font-bold text-slate-800 text-sm">{persona === 'mom' ? 'Mom' : 'Hype Bestie'}</span>
                     <span className="text-xs text-slate-400">Just now</span>
                 </div>
                 <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 inline-block max-w-lg">
                     <p className="text-slate-700 leading-relaxed text-sm md:text-base animate-fade-in">
                        "{persona === 'mom' 
                            ? getNaggyComment(totalNights, financial.total) 
                            : getHypeComment(totalNights, financial.total)
                        }"
                     </p>
                 </div>
                 
                 {/* Stats Bubble */}
                 <div className="flex flex-wrap gap-2 pt-2">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors duration-500 ${
                         persona === 'mom' 
                         ? 'bg-rose-50 text-rose-600 border-rose-100' 
                         : 'bg-purple-50 text-purple-600 border-purple-100'
                     }`}>
                        {totalNights} Nights Away
                     </span>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors duration-500 ${
                         persona === 'mom' 
                         ? 'bg-rose-50 text-rose-600 border-rose-100' 
                         : 'bg-purple-50 text-purple-600 border-purple-100'
                     }`}>
                        {topCountry ? `Mostly ${topCountry[0]}` : 'No travels yet'}
                     </span>
                 </div>
             </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                    <MapPin size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Top Country ({timeFilter})</p>
                    <p className="text-lg font-bold text-slate-800">{topCountry ? topCountry[0] : 'None yet'}</p>
                    <p className="text-xs text-slate-500">{topCountry ? `${topCountry[1]} visits` : ''}</p>
                </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                    <Building2 size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Top Hotel ({timeFilter})</p>
                    <p className="text-lg font-bold text-slate-800 truncate max-w-[150px]">{topHotel ? topHotel[0] : 'None yet'}</p>
                    <p className="text-xs text-slate-500">{topHotel ? `${topHotel[1]} stays` : ''}</p>
                </div>
            </div>
         </div>
      </div>

      {/* SECTION 3: Financials */}
      <div className="space-y-6">
         <div className="flex items-center gap-2 mb-2">
             <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
             <h2 className="text-lg font-bold text-slate-800">The Wallet Impact</h2>
         </div>

         <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                 <div>
                    <p className="text-sm font-medium text-slate-500">
                        Total Spend ({timeFilter})
                    </p>
                    <p className="text-3xl font-black text-slate-800">${financial.total.toLocaleString()}</p>
                 </div>
                 <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100 text-emerald-600">
                    <Banknote size={24} />
                 </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                 <div className="p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Average / Night</p>
                    <p className="text-xl font-bold text-slate-800">${financial.avgNight.toFixed(0)}</p>
                 </div>
                 <div className="p-5">
                    <div className="flex items-center gap-2 text-rose-500 mb-1">
                        <TrendingUp size={14} />
                        <p className="text-xs font-bold uppercase">Most Expensive</p>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">{financial.maxStay?.hotelName || '-'}</p>
                    <p className="text-xs text-slate-500">${financial.maxStay?.cost?.toLocaleString() || 0}</p>
                 </div>
                 <div className="p-5">
                    <div className="flex items-center gap-2 text-emerald-500 mb-1">
                        <TrendingDown size={14} />
                        <p className="text-xs font-bold uppercase">Best Value</p>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">{financial.minStay?.hotelName || '-'}</p>
                    <p className="text-xs text-slate-500">${financial.minStay?.cost?.toLocaleString() || 0}</p>
                 </div>
             </div>
         </div>
      </div>

      {/* Legacy List of Brands (Also Filtered) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 pt-4">Brand List ({timeFilter})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {brandGroups.map((group) => (
            <div key={group.brand} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-16 bg-white rounded-lg border border-slate-100 p-2 flex items-center justify-center shrink-0">
                            <BrandLogo brand={group.brand} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{group.brand}</h3>
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                        {group.count} {group.count === 1 ? 'Stay' : 'Stays'}
                    </span>
                </div>
                
                <div className="p-4 max-h-60 overflow-y-auto space-y-3 custom-scrollbar bg-white">
                {group.stays.map(stay => {
                    const s = new Date(stay.checkInDate);
                    const e = new Date(stay.checkOutDate);
                    const nights = Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));

                    return (
                        <div key={stay.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Building2 size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-slate-800 text-sm truncate">{stay.hotelName}</p>
                                {stay.cost ? <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">${stay.cost}</span> : null}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>{s.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-400">
                                    <Moon size={10} />
                                    <span>{nights}n</span>
                                </div>
                            </div>
                        </div>
                        </div>
                    );
                })}
                </div>
            </div>
            ))}
        </div>
      </div>
      
      {filteredStays.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600">No stays in {timeFilter}</h3>
          <p className="text-slate-400 text-sm">You were apparently very well behaved this year.</p>
        </div>
      )}
    </div>
  );
};