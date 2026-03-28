import React, { useState, useMemo, useEffect } from 'react';
import { RotateCcw, ExternalLink, Trophy, Star, Loader2 } from 'lucide-react';
import { getCampaignSelections, saveCampaignSelections } from '../services/storage';

interface Brand {
    id: string;
    name: string;
    cat: 'luxury' | 'premium' | 'select' | 'midscale' | 'longer';
    logoUrl?: string;
}

const BRANDS: Brand[] = [
    // Luxury
    { id: 'edition', name: 'EDITION', cat: 'luxury', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/eb/global-brand-exclusive/en_us/logo/assets/eb-mi-brand-page-eb-log90400-43574.jpg' },
    { id: 'ritz-carlton', name: 'Ritz-Carlton', cat: 'luxury', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/rz/global-brand-exclusive/en_us/logo/assets/rz-mi-brand-page-rz-log54882-28599.jpg' },
    { id: 'st-regis', name: 'St. Regis', cat: 'luxury', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/xr/global-brand-exclusive/en_us/logo/assets/xr-mi-brand-page-xr-log39993-06516.jpg' },
    { id: 'w-hotels', name: 'W Hotels', cat: 'luxury', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/wh/global-brand-exclusive/en_us/logo/assets/wh-mi-brand-page-wh-log36654-65482.jpg' },
    { id: 'jw-marriott', name: 'JW Marriott', cat: 'luxury', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/jw/global-brand-exclusive/en_us/logo/assets/jw-mi-brand-page-jw-log61299-55896.jpg' },
    { id: 'luxury-collection', name: 'Luxury Collection', cat: 'luxury', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/lc/global-property-shared/en_us/logo/assets/lc-tlc-explore-our-brands-35853.jpg' },
    // Premium
    { id: 'marriott', name: 'Marriott Hotels', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/mc/global-brand-exclusive/de_de/logo/assets/mc-mi-brand-page-mc-log17979-46832.jpg' },
    { id: 'sheraton', name: 'Sheraton', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/si/global-brand-exclusive/en_us/logo/assets/si-mi-brand-page-si-log44352-13910.jpg' },
    { id: 'vacation-club', name: 'Marriott Vacations', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/mv/global-brand-exclusive/en_us/logo/assets/mv-mi-brand-page-mv-log27112-95417.jpg' },
    { id: 'delta', name: 'Delta Hotels', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/de/global-brand-exclusive/en_us/logo/assets/de-mi-brand-page-de-log03566-36859.jpg' },
    { id: 'westin', name: 'Westin', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/wi/global-brand-exclusive/en_us/logo/assets/wi-mi-brand-page-wi-log71095-24388.jpg' },
    { id: 'renaissance', name: 'Renaissance', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/br/global-brand-exclusive/en_us/logo/assets/br-mi-brand-page-br-log18184-00079.jpg' },
    { id: 'le-meridien', name: 'Le Méridien', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/md/global-brand-exclusive/en_us/logo/assets/md-mi-brand-page-md-log63336-31059.jpg' },
    { id: 'autograph', name: 'Autograph Collection', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/ak/global-brand-exclusive/en_us/logo/assets/ak-mi-brand-page-ak-log93477-40117.jpg' },
    { id: 'tribute', name: 'Tribute Portfolio', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/tx/global-brand-exclusive/en_us/logo/assets/tx-mi-brand-page-tx-log50513-58455.jpg' },
    { id: 'design-hotels', name: 'Design Hotels', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/cm/global-property-shared/en_us/logo/assets/cm-cm-explore-our-brands-25164.jpg' },
    { id: 'gaylord', name: 'Gaylord Hotels', cat: 'premium', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/ge/global-brand-exclusive/en_us/logo/assets/ge-mi-brand-page-ge-log28177-32918.jpg' },
    // Select
    { id: 'courtyard', name: 'Courtyard', cat: 'select', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/cy/global-brand-exclusive/en_us/logo/assets/cy-mi-brand-page-cy-log42811-15443.jpg' },
    { id: 'four-points', name: 'Four Points', cat: 'select', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/fp/global-brand-exclusive/en_us/logo/assets/fp-mi-brand-page-fp-log29610-72555.jpg' },
    { id: 'springhill', name: 'SpringHill Suites', cat: 'select', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/sh/global-brand-exclusive/en_us/logo/assets/sh-mi-brand-page-sh-log25729-53908.jpg' },
    { id: 'fairfield', name: 'Fairfield', cat: 'select', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/fi/global-brand-exclusive/en_us/logo/assets/fi-mi-brand-page-fi-log88001-79745.jpg' },
    { id: 'ac-hotels', name: 'AC Hotels', cat: 'select', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/ar/global-brand-exclusive/en_us/logo/assets/ar-mi-brand-page-ar-log18527-51041.jpg' },
    { id: 'aloft', name: 'Aloft', cat: 'select', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/al/global-brand-exclusive/en_us/logo/assets/al-mi-brand-page-al-log27768-68321.jpg' },
    { id: 'moxy', name: 'Moxy', cat: 'select', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/ox/global-brand-exclusive/en_us/logo/assets/ox-mi-brand-page-ox-log64332-07884.jpg' },
    { id: 'protea', name: 'Protea Hotels', cat: 'select', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/pr/global-brand-exclusive/en_us/logo/assets/pr-mi-brand-page-pr-log59556-91899.jpg' },
    // Midscale
    { id: 'city-express', name: 'City Express', cat: 'midscale', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/xe/global-property-shared/en_us/logo/assets/xe-city-express-23436-19990.png' },
    { id: 'four-points-flex', name: 'Four Points Flex', cat: 'midscale', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/xf/global-property-shared/en_us/logo/assets/xf-our-brands-fx-30839.jpg' },
    // Longer Stays
    { id: 'residence-inn', name: 'Residence Inn', cat: 'longer', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/ri/global-brand-exclusive/en_us/logo/assets/ri-mi-brand-page-ri-log06839-45003.jpg' },
    { id: 'towneplace', name: 'TownePlace Suites', cat: 'longer', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/ts/global-brand-exclusive/en_us/logo/assets/ts-mi-brand-page-ts-log49443-32262.jpg' },
    { id: 'element', name: 'Element', cat: 'longer', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/el/global-brand-exclusive/en_us/logo/assets/el-mi-brand-page-el-log88561-34161.jpg' },
    { id: 'homes-villas', name: 'Homes & Villas', cat: 'longer', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/hvmb/us-canada/en_us/faqs/logo/unlimited/assets/pdt-MI-Brand-Page-HVMB-Logo-506286125994579.jpg' },
    { id: 'apartments', name: 'Apartments', cat: 'longer', logoUrl: 'https://cache.marriott.com/content/dam/marriott-digital/ba/global-brand-exclusive/en_us/logo/assets/ba-mi-brand-page-ba-log82781-08641.jpg' },
];

const CATEGORIES: { key: Brand['cat']; label: string; sub: string }[] = [
    { key: 'luxury', label: 'Luxury', sub: 'Bespoke & Unparalleled' },
    { key: 'premium', label: 'Premium', sub: 'Elevated & Thoughtful' },
    { key: 'select', label: 'Select', sub: 'Modern & Consistent' },
    { key: 'midscale', label: 'Midscale', sub: 'Functional Lodging' },
    { key: 'longer', label: 'Longer Stays', sub: 'Studios & Apartments' },
];

const STORAGE_KEY = 'stayfolio_marriott_campaign';
const CAMPAIGN_ID = 'marriott_places_to_shine_2026';

export const CampaignTracker: React.FC = () => {
    const [selected, setSelected] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch { return []; }
    });
    const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Load selections from Supabase on mount
    useEffect(() => {
        const loadSelections = async () => {
            setIsLoading(true);
            const selections = await getCampaignSelections(CAMPAIGN_ID);
            setSelected(selections);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
            } catch { /* ignore localStorage errors */ }
            setIsLoading(false);
        };
        loadSelections();
    }, []);

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
            // Save to localStorage for instant feedback
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch { /* ignore */ }
            // Save to Supabase (fire and forget, don't wait)
            saveCampaignSelections(CAMPAIGN_ID, next).catch(err => console.error('Failed to save selections:', err));
            return next;
        });
    };

    const reset = () => {
        if (confirm('Reset all progress?')) {
            setSelected([]);
            try {
                localStorage.setItem(STORAGE_KEY, '[]');
            } catch { /* ignore */ }
            saveCampaignSelections(CAMPAIGN_ID, []).catch(err => console.error('Failed to reset selections:', err));
        }
    };

    const stats = useMemo(() => ({
        points: selected.length * 2500,
        nights: selected.length,
        brands: selected.length,
    }), [selected]);

    return (
        <div className="space-y-5 pb-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 mb-3">
                    <Trophy size={12} />
                    Marriott Bonvoy Campaign
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Places to Shine</h2>
                <p className="text-sm text-red-500 font-bold mt-1">Feb 25 – May 10, 2026</p>
                {isLoading && (
                    <div className="inline-flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <Loader2 size={12} className="animate-spin" /> Loading your selections...
                    </div>
                )}
                <a
                    href="https://www.marriott.com/loyalty/promotion.mi?promotion=SH26"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium mt-2 hover:underline"
                >
                    View on Marriott.com <ExternalLink size={10} />
                </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900 rounded-xl p-3 text-center">
                    <span className="text-xl font-black text-amber-400">{stats.points.toLocaleString()}</span>
                    <span className="block text-[9px] uppercase text-slate-400 tracking-wide mt-0.5">Points</span>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 text-center">
                    <span className="text-xl font-black text-amber-400">{stats.nights}</span>
                    <span className="block text-[9px] uppercase text-slate-400 tracking-wide mt-0.5">Elite Nights</span>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 text-center">
                    <span className="text-xl font-black text-amber-400">{stats.brands}</span>
                    <span className="block text-[9px] uppercase text-slate-400 tracking-wide mt-0.5">Brands</span>
                </div>
            </div>

            {/* Brand Categories */}
            {CATEGORIES.map(cat => {
                const catBrands = BRANDS.filter(b => b.cat === cat.key);
                return (
                    <div key={cat.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 text-sm">{cat.label}</h3>
                            <p className="text-[11px] text-slate-400">{cat.sub}</p>
                        </div>
                        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {catBrands.map(brand => {
                                const isActive = selected.includes(brand.id);
                                const logoFailed = failedLogos.has(brand.id);
                                return (
                                    <button
                                        key={brand.id}
                                        onClick={() => toggle(brand.id)}
                                        className={`relative h-32 rounded-xl border-2 flex flex-col items-center justify-center px-2 py-3 transition-all active:scale-95 ${
                                            isActive
                                                ? 'border-amber-400 bg-amber-50 shadow-md'
                                                : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/20'
                                        }`}
                                    >
                                        {brand.logoUrl && !logoFailed ? (
                                            <>
                                                <img
                                                    src={brand.logoUrl}
                                                    alt={brand.name}
                                                    className={`max-w-[85%] max-h-[48px] object-contain transition-all ${
                                                        isActive ? 'opacity-100' : 'opacity-75'
                                                    }`}
                                                    onError={() => {
                                                        setFailedLogos(prev => new Set(prev).add(brand.id));
                                                    }}
                                                />
                                                <span className={`text-[9px] font-bold text-center leading-tight mt-2 ${
                                                    isActive ? 'text-amber-800' : 'text-slate-600'
                                                }`}>
                                                    {brand.name}
                                                </span>
                                            </>
                                        ) : (
                                            <span
                                                className={`text-[9px] font-bold text-center leading-tight ${
                                                    isActive ? 'text-amber-800' : 'text-slate-600'
                                                }`}
                                            >
                                                {brand.name}
                                            </span>
                                        )}
                                        {isActive && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                                                <Star size={12} className="text-white fill-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Footer */}
            <div className="text-center space-y-3 pt-2">
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 text-xs text-slate-400 border border-slate-200 px-4 py-2 rounded-full hover:text-slate-600 hover:border-slate-300 transition-colors"
                >
                    <RotateCcw size={12} /> Reset Tracker
                </button>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    Excluded: BVLGARI, RC Yacht, Marriott Executive Apartments.<br />
                    1 Elite Night Credit per unique brand. 2,500 points per paid stay.
                </p>
            </div>
        </div>
    );
};
