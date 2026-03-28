import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, AlertTriangle, CheckCircle2, Crown, TrendingUp, Globe, Sparkles, Star, Zap, Calendar, Smartphone, Ticket } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('signup'); // Default to signup for landing page
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [promoCode, setPromoCode] = useState('');

  // Check for errors in URL (e.g. expired magic link)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('error_code=otp_expired')) {
        setMessage({ type: 'error', text: 'The login link has expired. Please request a new one.' });
        window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (promoCode.trim()) {
          localStorage.setItem('stayfolio_pending_promo', promoCode.trim().toUpperCase());
        }
        setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const scrollToAuth = () => {
      setMode('signup');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-50">
         <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
               <ShieldCheck size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">StayFolio</span>
         </div>
         <div className="flex items-center gap-4">
             <button 
                onClick={() => {
                    setMode('login');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block"
             >
                Log In
             </button>
             <button 
                onClick={scrollToAuth}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
             >
                Get Started
             </button>
         </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-20 lg:pt-16 lg:pb-32 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
         
         {/* Left: Copy */}
         <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wide animate-fade-in-up">
               <Sparkles size={12} />
               <span>New: AI Travel Captioning</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] text-slate-900">
               The <span className="text-indigo-600 relative inline-block">
                   Flighty
                   <svg className="absolute w-full h-3 -bottom-1 left-0 text-indigo-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg>
               </span> for your Hotel Stays.
            </h1>
            
            <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
               Stop using spreadsheets. StayFolio is the ultimate companion for the elite traveler. Track your history, visualize your footprint, and optimize your status strategy.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-sm font-medium text-slate-500">
               <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-1 rounded-full text-emerald-600"><CheckCircle2 size={14} /></div>
                  <span>Portfolio Tracking</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-1 rounded-full text-emerald-600"><CheckCircle2 size={14} /></div>
                  <span>Status Calculator</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-1 rounded-full text-emerald-600"><CheckCircle2 size={14} /></div>
                  <span>Travel AI</span>
               </div>
            </div>
            
            {/* Visual Social Proof */}
            <div className="pt-4 flex items-center gap-4">
                <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                             <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                        </div>
                    ))}
                </div>
                <div>
                    <div className="flex text-amber-400">
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                    </div>
                    <p className="text-xs text-slate-500 font-bold">Loved by 2,000+ Travelers</p>
                </div>
            </div>
         </div>

         {/* Right: Auth Card / Landing Visual */}
         <div className="relative">
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <div className="relative bg-white rounded-3xl shadow-2xl shadow-indigo-200/50 border border-slate-100 overflow-hidden transform hover:-translate-y-1 transition-transform duration-500">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">
                            {mode === 'login' ? 'Welcome Back' : 'Start your Journey'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">
                            {mode === 'login' ? 'Enter your details to access your portfolio.' : 'Join today for a 30-day free trial of PRO.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    placeholder="traveler@example.com"
                                />
                            </div>
                        </div>

                        {mode !== 'forgot' && (
                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                                    {mode === 'login' && (
                                        <button 
                                            type="button"
                                            onClick={() => { setMode('forgot'); setMessage(null); }}
                                            className="text-xs text-indigo-600 font-bold hover:underline"
                                        >
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        {mode === 'signup' && (
                            <div className="relative">
                                <Ticket size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium font-mono tracking-wider"
                                    placeholder="Promo Code (optional)"
                                />
                            </div>
                        )}

                        {message && (
                            <div className={`p-3 rounded-lg text-sm font-medium flex items-start gap-2 ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                <span className="shrink-0 mt-0.5">{message.type === 'error' ? <AlertTriangle size={16} /> : '✅'}</span>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (
                                <>
                                    {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Start Free Trial' : 'Reset Password'}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            {mode === 'login' ? "New here?" : mode === 'signup' ? "Already a member?" : "Remember password?"}
                            <button 
                                onClick={() => { 
                                    if (mode === 'login') setMode('signup');
                                    else setMode('login');
                                    setMessage(null); 
                                }}
                                className="ml-1 text-indigo-600 font-bold hover:underline"
                            >
                                {mode === 'login' ? 'Start Trial' : 'Log In'}
                            </button>
                        </p>
                    </div>
                </div>
                
                {mode === 'signup' && (
                    <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                            Includes 30-day <span className="font-bold text-indigo-600">PRO</span> trial. No credit card required.
                        </p>
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* Feature Section - Dark Mode Vibe */}
      <div className="bg-slate-900 text-white py-24 relative overflow-hidden">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl font-black mb-4 tracking-tight">Master Your Status Journey</h2>
                  <p className="text-slate-400 text-lg">Don't let your nights go to waste. Visualize your progress towards Diamond, Globalist, or Titanium status in one unified dashboard.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-indigo-500/50 transition-all hover:-translate-y-1 duration-300">
                      <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                          <Crown size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-3">Multi-Brand Tracking</h3>
                      <p className="text-slate-400 leading-relaxed">
                          Marriott, Hilton, Hyatt, and more. See all your nights in one place instead of checking 5 different apps.
                      </p>
                  </div>
                  <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-emerald-500/50 transition-all hover:-translate-y-1 duration-300">
                      <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                          <Globe size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-3">Visual Passport</h3>
                      <p className="text-slate-400 leading-relaxed">
                          A beautiful heatmap of your global footprint. See which countries and cities you dominate.
                      </p>
                  </div>
                  <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-amber-500/50 transition-all hover:-translate-y-1 duration-300">
                      <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                          <TrendingUp size={24} />
                      </div>
                      <h3 className="text-xl font-bold mb-3">Status Optimization</h3>
                      <p className="text-slate-400 leading-relaxed">
                          We calculate exactly how many nights you need to reach the next tier before the year ends.
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* How it Works Section */}
      <div className="py-20 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-slate-900 mb-4">How StayFolio Works</h2>
              <p className="text-slate-500">Three simple steps to elite travel management.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10"></div>

              <div className="text-center bg-slate-50 md:bg-transparent p-6 rounded-3xl md:p-0">
                  <div className="w-24 h-24 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Calendar size={32} className="text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">1. Log Your Stays</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                      Manually add your past trips or bulk import your history in seconds.
                  </p>
              </div>
              <div className="text-center bg-slate-50 md:bg-transparent p-6 rounded-3xl md:p-0">
                  <div className="w-24 h-24 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Zap size={32} className="text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">2. Analyze Status</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                      Instant calculation of your progress towards Elite tiers across all major brands.
                  </p>
              </div>
              <div className="text-center bg-slate-50 md:bg-transparent p-6 rounded-3xl md:p-0">
                  <div className="w-24 h-24 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Smartphone size={32} className="text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">3. Optimize Travel</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                      Use the Concierge to find properties that help you hit status faster.
                  </p>
              </div>
          </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 bg-slate-100">
          <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-slate-900 mb-4">Fair Pricing for Frequent Flyers</h2>
                  <p className="text-slate-500 mb-8">Start with our 30-day Pro trial. Cancel anytime.</p>
                  
                  {/* Billing Toggle */}
                  <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 relative">
                      <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                          Monthly
                      </button>
                      <button 
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                          Yearly
                      </button>
                      
                      {/* Discount Badge */}
                      <div className="absolute -top-4 -right-12 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-bounce">
                          Save 30%
                      </div>
                  </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                  {/* Free Tier */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900">Standard</h3>
                      <p className="text-4xl font-black text-slate-900 mt-4 mb-2">$0<span className="text-lg font-medium text-slate-400">/mo</span></p>
                      <p className="text-sm text-slate-500 mb-8">For the casual vacationer.</p>
                      
                      <ul className="space-y-4 mb-8">
                          <li className="flex items-center gap-3 text-slate-700 text-sm">
                              <CheckCircle2 size={18} className="text-slate-300" />
                              <span>Unlimited Stay Logging</span>
                          </li>
                          <li className="flex items-center gap-3 text-slate-700 text-sm">
                              <CheckCircle2 size={18} className="text-slate-300" />
                              <span>Basic Portfolio View</span>
                          </li>
                          <li className="flex items-center gap-3 text-slate-700 text-sm">
                              <CheckCircle2 size={18} className="text-slate-300" />
                              <span>Track <span className="font-bold">1 Hotel Status</span></span>
                          </li>
                      </ul>
                      
                      <button 
                        onClick={scrollToAuth}
                        className="w-full py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:border-slate-300 transition-colors"
                      >
                          Get Started Free
                      </button>
                  </div>

                  {/* Pro Tier */}
                  <div className="relative bg-slate-900 p-8 rounded-3xl text-white shadow-2xl shadow-indigo-200 scale-105 transform">
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-wider">
                          Best Value
                      </div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">Pro <Crown size={18} className="text-amber-400" /></h3>
                      
                      <div className="mt-4 mb-2 flex items-baseline gap-1">
                          <p className="text-4xl font-black text-white">
                              {billingCycle === 'yearly' ? '$4.99' : '$6.99'}
                          </p>
                          <span className="text-lg font-medium text-slate-500">/mo</span>
                      </div>
                      
                      <p className="text-sm text-slate-400 mb-8">
                          {billingCycle === 'yearly' ? 'Billed $59.88 yearly.' : 'Billed monthly.'}
                      </p>
                      
                      <ul className="space-y-4 mb-8">
                          <li className="flex items-center gap-3 text-white text-sm">
                              <CheckCircle2 size={18} className="text-emerald-400" />
                              <span><span className="font-bold">Unlimited</span> Status Tracking</span>
                          </li>
                          <li className="flex items-center gap-3 text-white text-sm">
                              <CheckCircle2 size={18} className="text-emerald-400" />
                              <span>Advanced Spending Analytics</span>
                          </li>
                          <li className="flex items-center gap-3 text-white text-sm">
                              <CheckCircle2 size={18} className="text-emerald-400" />
                              <span>Data Export (CSV/JSON)</span>
                          </li>
                          <li className="flex items-center gap-3 text-white text-sm">
                              <CheckCircle2 size={18} className="text-emerald-400" />
                              <span>AI Concierge & Captions</span>
                          </li>
                      </ul>
                      
                      <button 
                        onClick={scrollToAuth}
                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-colors shadow-lg shadow-indigo-900/50"
                      >
                          Start 30-Day Free Trial
                      </button>
                      <p className="text-[10px] text-slate-500 text-center mt-3">Cancel anytime.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck size={20} className="text-indigo-600" />
                  <span>StayFolio</span>
              </div>
              <p className="text-slate-400 text-sm">© {new Date().getFullYear()} StayFolio. All rights reserved.</p>
              <div className="flex gap-6 text-sm text-slate-500">
                  <a href="#" className="hover:text-indigo-600">Privacy</a>
                  <a href="#" className="hover:text-indigo-600">Terms</a>
                  <a href="#" className="hover:text-indigo-600">Contact</a>
              </div>
          </div>
      </footer>

    </div>
  );
};