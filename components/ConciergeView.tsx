import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Lock } from 'lucide-react';
import { Stay, ChatMessage } from '../types';
import { getConciergeAdvice } from '../services/ai';

interface ConciergeViewProps {
  stays: Stay[];
  isPro: boolean;
  onUpgrade: () => void;
}

export const ConciergeView: React.FC<ConciergeViewProps> = ({ stays, isPro, onUpgrade }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: 'welcome',
        role: 'model',
        text: "Welcome to your Elite Concierge. I've analyzed your stay history. How can I help maximize your travels today?",
        timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await getConciergeAdvice(messages, stays, userMsg.text);

    const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  if (!isPro) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                  <Bot size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">AI Travel Concierge</h2>
              <p className="text-slate-500 max-w-md">
                  Unlock your personal travel assistant. The Concierge analyzes your history to provide personalized hotel recommendations, status optimization strategies, and itinerary advice.
              </p>
              
              <div className="bg-slate-900 text-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold uppercase tracking-wider text-xs">
                      <Sparkles size={12} /> Pro Feature
                  </div>
                  <div className="space-y-3 mb-6 text-left text-sm text-slate-300">
                      <p>✓ "Where should I stay in Paris to hit Titanium?"</p>
                      <p>✓ "Find me a hotel like the Park Hyatt but in London."</p>
                      <p>✓ "Calculate my average spend per night this year."</p>
                  </div>
                  <button 
                    onClick={onUpgrade}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                      Unlock with PRO
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-20">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center gap-3 shrink-0">
          <div className="p-2 bg-indigo-500 rounded-lg">
              <Bot size={20} />
          </div>
          <div>
              <h2 className="font-bold">Elite Concierge</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Sparkles size={10} /> Powered by Gemini
              </p>
          </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
          {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white'}`}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                      ? 'bg-white text-slate-800 rounded-tr-none' 
                      : 'bg-indigo-600 text-white rounded-tl-none'
                  }`}>
                      {msg.text}
                  </div>
              </div>
          ))}
          {loading && (
              <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Bot size={14} />
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-600 rounded-tl-none flex items-center gap-2">
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-150"></div>
                  </div>
              </div>
          )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 shrink-0">
          <div className="relative">
              <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for recommendations or status advice..."
                  className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  disabled={loading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
          </div>
      </form>
    </div>
  );
};