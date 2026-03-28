import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Briefcase, Share2, Plus, Hotel, Trash2, Pencil, Download, Upload, Moon, Award, TrendingUp, Star, Building2, Crown, ChevronLeft, ChevronRight, Lock, LogOut, Loader2, User, KeyRound, X, Users, Settings, Bot, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Stay, ViewMode, StatSummary, Subscription } from './types';
import { getStays, addStay, deleteStay, updateStay, importStays, getUserSubscription, getStripeConfig, syncUserRegistry } from './services/storage';
import { supabase } from './services/supabase';
import { StayForm } from './components/StayForm';
import { BrandPortfolio } from './components/BrandPortfolio';
import { ShareView } from './components/ShareView';
import { EliteStatusView } from './components/EliteStatusView';
import { DataManagementModal } from './components/DataManagementModal';
import { Auth } from './components/Auth';
import { ProfileView } from './components/ProfileView';
import { AdminUserList } from './components/AdminUserList';
import { ConciergeView } from './components/ConciergeView';
import { InstallPrompt } from './components/InstallPrompt';
import { SmartImport } from './components/SmartImport';
import { CampaignTracker } from './components/CampaignTracker';
import { ProExpiryBanner } from './components/ProExpiryBanner';
import { ELITE_PROGRAMS, BRAND_LOGOS } from './constants';

const StatusTracker: React.FC<{ stays: Stay[] }> = ({ stays }) => {
  const trackerData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const maxStayYear = stays.length > 0 
        ? Math.max(...stays.map(s => new Date(s.checkInDate).getFullYear())) 
        : currentYear;
    const trackingYear = maxStayYear >= currentYear ? maxStayYear : currentYear;
    
    const activePrograms = ELITE_PROGRAMS.map(program => {
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
       <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
           {trackerData.map((data) => (
               <div 
                 key={data.id}
                 className="snap-center shrink-0 w-[280px] relative rounded-2xl overflow-hidden shadow-lg bg-white text-white min-h-[160px] flex flex-col"
               >
                   <div className={`absolute inset-0 ${data.color} opacity-90`}></div>
                   <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/40"></div>

                   <div className="relative p-4 flex flex-col h-full z-10">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-8 h-8 bg-white rounded-lg p-1 shadow-sm shrink-0">
                                <img src={data.logo} alt={data.brand} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            </div>
                            <span className="text-[10px] font-bold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                                {data.currentTierName}
                            </span>
                        </div>
                        <h4 className="text-lg font-black leading-tight mb-auto">{data.brand}</h4>
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

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
        {icon}
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // App Data
  const [stays, setStays] = useState<Stay[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // UI State
  const [view, setView] = useState<ViewMode>('portfolio'); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [editingStay, setEditingStay] = useState<Stay | undefined>(undefined);
  
  // Auth State
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Subscription State
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [expiryBannerDismissed, setExpiryBannerDismissed] = useState(false);

  // Admin Config
  const isAdmin = useMemo(() => session?.user?.email === 'jeratomise@gmail.com', [session]);
  const [adminSimulateFree, setAdminSimulateFree] = useState(false);

  // Derived Pro State
  const isPro = useMemo(() => {
      if (isAdmin && !adminSimulateFree) return true;
      if (!subscription) return false;
      if (subscription.status === 'pro') {
          if (!subscription.expiresAt) return true;
          return new Date() < new Date(subscription.expiresAt);
      }
      return false;
  }, [subscription, isAdmin, adminSimulateFree]);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('type=magiclink'))) {
        setRecoveryMode(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
    });

    const handleClickOutside = (event: MouseEvent) => {
        if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
            setIsProfileMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        authSub.unsubscribe();
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (session) {
      fetchStays();
      // On login, ensure user is registered in the public list
      syncUserRegistry().then(async (sub) => {
          if (sub) setSubscription(sub);
          // Check for pending promo code from signup
          const pendingPromo = localStorage.getItem('stayfolio_pending_promo');
          if (pendingPromo) {
            localStorage.removeItem('stayfolio_pending_promo');
            const { redeemPromoCode } = await import('./services/promoCodes');
            const result = await redeemPromoCode(pendingPromo);
            if (result.success) {
              fetchSubscription();
            }
          }
      });
      fetchSubscription();
    } else {
        setStays([]);
    }
  }, [session]);

  const fetchStays = async () => {
    setDataLoading(true);
    const data = await getStays();
    setStays(data);
    setDataLoading(false);
  };

  const fetchSubscription = async () => {
      const [subData, stripeConfig] = await Promise.all([
          getUserSubscription(),
          getStripeConfig()
      ]);
      setSubscription(subData);
      setStripeEnabled(stripeConfig);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) {
          alert("Password updated successfully!");
          setRecoveryMode(false);
          setNewPassword('');
          window.history.replaceState(null, '', window.location.pathname);
      } else {
          alert("Error: " + error.message);
      }
      setPasswordLoading(false);
  };

  const handleSaveStay = async (stayData: Omit<Stay, 'id' | 'createdAt'>) => {
    if (editingStay) {
      const updated = await updateStay(editingStay.id, stayData);
      if (updated) setStays(prev => prev.map(s => s.id === updated.id ? updated : s));
    } else {
      const newStay = await addStay(stayData);
      if (newStay) setStays(prev => [newStay, ...prev]);
    }
  };

  const handleDeleteStay = async (id: string) => {
    const success = await deleteStay(id);
    if (success) setStays(prev => prev.filter(s => s.id !== id));
  };

  const handleSetRating = async (id: string, rating: number) => {
    const updated = await updateStay(id, { rating });
    if (updated) setStays(prev => prev.map(s => s.id === updated.id ? updated : s));
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

  const handleImportData = async (importedStays: any[]) => {
      setDataLoading(true);
      const newStays = await importStays(importedStays);
      if (newStays.length > 0) fetchStays();
      else setDataLoading(false);
  };

  const handleBookSimilar = (stay: Stay) => {
      const query = encodeURIComponent(`${stay.hotelName} ${stay.country}`);
      window.open(`https://www.google.com/travel/hotels?q=${query}`, '_blank');
  };

  const handleUpgrade = () => {
      if (isAdmin) {
          setAdminSimulateFree(prev => !prev);
          return;
      }
      if (stripeEnabled) alert("Redirecting to Stripe Checkout...");
      else alert("Online upgrades are currently disabled. Please contact support.");
  };

  const myStays = useMemo(() => {
      if (!session) return [];
      return stays.filter(s => !s.userId || s.userId === session.user.id);
  }, [stays, session]);

  const stats: StatSummary = useMemo(() => {
    const uniqueBrands = new Set(myStays.map(s => s.brand));
    const brandCounts: Record<string, number> = {};
    let totalNights = 0;
    myStays.forEach(s => {
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
      totalStays: myStays.length,
      totalNights,
      uniqueBrands: uniqueBrands.size,
      topBrand,
      thisYearStays: myStays.filter(s => new Date(s.checkInDate).getFullYear() === new Date().getFullYear()).length
    };
  }, [myStays]);

  const brandChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    myStays.forEach(s => {
        if (!s.checkInDate || !s.checkOutDate) return;
        const start = new Date(s.checkInDate).getTime();
        const end = new Date(s.checkOutDate).getTime();
        const nights = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        counts[s.brand] = (counts[s.brand] || 0) + nights;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [myStays]);

  const availableYears = useMemo(() => {
      const years = new Set(stays.map(s => new Date(s.checkInDate).getFullYear()));
      return Array.from(years).sort((a: number, b: number) => b - a).map(String);
  }, [stays]);

  const filteredStays = useMemo(() => {
    return stays.filter(s => {
        const d = new Date(s.checkInDate);
        if (filterYear !== 'All' && d.getFullYear().toString() !== filterYear) return false;
        if (filterMonth !== 'All' && d.toLocaleString('default', { month: 'short' }) !== filterMonth) return false;
        return true;
    });
  }, [stays, filterYear, filterMonth]);

  const formatStayDate = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const nights = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return {
        dateStr: `${s.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${e.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`,
        nights: Math.max(0, nights)
    };
  };

  const formatBrandLabel = (val: string) => {
      const brandMap: Record<string, string> = {
        'World of Hyatt': 'Hyatt', 'Marriott Bonvoy': 'Marriott', 'IHG One Rewards': 'IHG', 'Hilton Honors': 'Hilton', 'Accor Live Limitless': 'Accor'
      };
      if (brandMap[val]) return brandMap[val];
      return val.length > 8 ? val.substring(0, 6) + '..' : val;
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600">
              <Loader2 size={32} className="animate-spin" />
          </div>
      );
  }

  if (!session) return <Auth />;

  const userAvatar = session.user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-slate-50">
      {recoveryMode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                  <button onClick={() => setRecoveryMode(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400">
                      <X size={20} />
                  </button>
                  <div className="text-center mb-6">
                      <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
                          <KeyRound size={24} />
                      </div>
                      <h2 className="text-xl font-bold text-slate-800">Set New Password</h2>
                  </div>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
                      </div>
                      <button type="submit" disabled={passwordLoading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                          {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      <header className="bg-white sticky top-0 z-30 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Hotel size={20} /></div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">StayFolio</h1>
          </div>
          <div className="flex items-center gap-4">
            {!isPro && (
                <button onClick={() => setView('profile')} className="hidden sm:flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200 hover:bg-amber-100 transition-colors">
                    <Crown size={12} /> Upgrade to Pro
                </button>
            )}
            <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full hidden sm:block">
              {dataLoading ? 'Syncing...' : `${stats.totalNights} Nights • ${stats.totalStays} Stays`}
            </div>
            <div className="relative" ref={profileMenuRef}>
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 focus:outline-none">
                    <div className="w-9 h-9 rounded-full bg-slate-200 border border-white shadow-sm overflow-hidden flex items-center justify-center">
                        {userAvatar ? <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" /> : <User size={18} className="text-slate-500" />}
                    </div>
                </button>
                {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-fade-in-up origin-top-right z-50">
                        <div className="px-4 py-2 border-b border-slate-50 mb-1">
                            <p className="text-xs font-bold text-slate-400 uppercase">Signed in as</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{session.user.email}</p>
                            <div className="mt-1">
                                {isPro ? <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">PRO MEMBER</span> : <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">FREE PLAN</span>}
                            </div>
                        </div>
                        <button onClick={() => { setView('profile'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"><User size={16} /> My Profile</button>
                        {isAdmin && (
                            <button onClick={() => { setView('admin_users'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"><Users size={16} /> User Management</button>
                        )}
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => supabase.auth.signOut()} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"><LogOut size={16} /> Sign Out</button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {subscription?.expiresAt && !subscription?.stripeCustomerId && !expiryBannerDismissed && (
          <ProExpiryBanner expiresAt={subscription.expiresAt} onDismiss={() => setExpiryBannerDismissed(true)} />
        )}
        {dataLoading && stays.length === 0 ? <div className="py-20 flex justify-center text-slate-300"><Loader2 size={32} className="animate-spin" /></div> : (
        <>
        {view === 'profile' && <ProfileView user={session.user} onOpenDataModal={() => setIsDataModalOpen(true)} isPro={isPro} onTogglePro={handleUpgrade} hasStripeSubscription={!!subscription?.stripeCustomerId} onRedeemed={fetchSubscription} />}
        {view === 'admin_users' && isAdmin && <AdminUserList />}
        {view === 'concierge' && <ConciergeView stays={myStays} isPro={isPro} onUpgrade={handleUpgrade} />}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <StatusTracker stays={myStays} />
            <button onClick={() => { setEditingStay(undefined); setIsFormOpen(true); }} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"><Plus size={20} strokeWidth={3} /> Log New Adventure</button>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                 <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={18} className="text-indigo-600" /> Nights by Brand</h3></div>
                 <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={brandChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} dy={10} tickFormatter={formatBrandLabel} /><YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} itemStyle={{ color: '#1e293b', fontWeight: 'bold' }} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{brandChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />))}</Bar></BarChart></ResponsiveContainer>
                 </div>
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800"><h3 className="font-bold text-lg">My Stays</h3><div className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">{filteredStays.length}</div>{isAdmin && <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded border border-rose-200 ml-auto">SUPER ADMIN MODE</span>}</div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button onClick={() => setFilterYear('All')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filterYear === 'All' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>All Years</button>
                        {availableYears.map(year => (<button key={year} onClick={() => setFilterYear(year)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filterYear === year ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>{year}</button>))}
                    </div>
                </div>
            </div>
            <div className="space-y-2 pb-24">
                {filteredStays.length === 0 ? (<div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200"><TrendingUp size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-slate-500 font-medium">No stays match your filters.</p></div>) : (filteredStays.map(stay => {
                        const { dateStr, nights } = formatStayDate(stay.checkInDate, stay.checkOutDate);
                        const currentRating = stay.rating || 0;
                        const isForeign = stay.userId && stay.userId !== session.user.id;
                        return (<div key={stay.id} className={`bg-white px-4 py-3 rounded-xl shadow-sm border ${isForeign ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'} hover:shadow-md transition-all flex items-center justify-between group`}><div className="flex items-center gap-3 overflow-hidden"><div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0 border border-slate-100">{stay.brand.charAt(0)}</div><div className="min-w-0"><div className="flex items-baseline gap-2"><h3 className="font-bold text-slate-800 text-sm truncate">{stay.hotelName}</h3><span className="text-xs text-slate-400 truncate hidden sm:inline">{stay.brand}</span></div><div className="flex items-center gap-2 text-xs text-slate-500"><span>{stay.country}</span><span>•</span><span>{dateStr}</span></div></div></div><div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-2"><button onClick={() => handleBookSimilar(stay)} className="p-1.5 text-slate-300 hover:text-emerald-600 rounded-md"><ExternalLink size={14} /></button><div className="hidden sm:flex items-center">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => handleSetRating(stay.id, star)} className="p-0.5"><Star size={14} className={`${currentRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} /></button>))}</div><div className="flex items-center gap-1"><button onClick={() => handleEditClick(stay)} className="p-1.5 text-slate-300 hover:text-indigo-600 rounded-md"><Pencil size={14} /></button><button onClick={() => handleDeleteStay(stay.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-md"><Trash2 size={14} /></button></div></div></div>);}))}
            </div>
          </div>
        )}
        {view === 'portfolio' && <BrandPortfolio stays={myStays} />}
        {view === 'status' && <EliteStatusView stays={myStays} isPro={isPro} onUpgrade={handleUpgrade} />}
        {view === 'share' && <ShareView stays={myStays} summary={stats} />}
        {view === 'campaigns' && <CampaignTracker />}
        </>
        )}
      </main>

      {view === 'dashboard' && (<button onClick={() => { setEditingStay(undefined); setIsFormOpen(true); }} className="md:hidden fixed bottom-24 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl z-20"><Plus size={24} /></button>)}

      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 py-3 px-6 md:px-0 z-30">
        <div className="max-w-xl mx-auto flex justify-between md:justify-center md:gap-6">
            <NavButton active={view === 'portfolio'} onClick={() => setView('portfolio')} icon={<Briefcase size={24} />} label="Portfolio" />
            <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={24} />} label="Manage" />
            <NavButton active={view === 'campaigns'} onClick={() => setView('campaigns')} icon={<Award size={24} />} label="Promos" />
            <div className="relative -top-5"><button onClick={() => setView('concierge')} className={`p-3 rounded-full shadow-lg border-4 border-slate-50 transition-all ${view === 'concierge' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}><Bot size={28} /></button></div>
            <NavButton active={view === 'status'} onClick={() => setView('status')} icon={<Crown size={24} />} label="Status" />
            <NavButton active={view === 'share'} onClick={() => setView('share')} icon={<Share2 size={24} />} label="Share" />
        </div>
      </nav>

      {isFormOpen && <StayForm initialData={editingStay} onSave={handleSaveStay} onClose={handleCloseForm} />}
      {isDataModalOpen && <DataManagementModal currentStaysCount={stays.length} onClose={() => setIsDataModalOpen(false)} onImport={handleImportData} onExport={handleExport} />}
    </div>
  );
};

export default App;