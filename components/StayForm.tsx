import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Save, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Moon, DollarSign, Star, MapPin } from 'lucide-react';
import { Stay } from '../types';
import { POPULAR_BRANDS, COUNTRIES } from '../constants';

// Load Google Maps script once
let googleMapsLoaded = false;
let googleMapsLoading = false;
const loadGoogleMaps = (): Promise<void> => {
  if (googleMapsLoaded) return Promise.resolve();
  if (googleMapsLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (googleMapsLoaded) { clearInterval(check); resolve(); }
      }, 100);
    });
  }
  googleMapsLoading = true;
  return new Promise((resolve, reject) => {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) { googleMapsLoading = false; reject(new Error('No Google Maps API key')); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = () => { googleMapsLoaded = true; googleMapsLoading = false; resolve(); };
    script.onerror = () => { googleMapsLoading = false; reject(new Error('Failed to load Google Maps')); };
    document.head.appendChild(script);
  });
};

interface StayFormProps {
  initialData?: Stay;
  onSave: (stay: Omit<Stay, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

// Helper to format date for local display and storage (YYYY-MM-DD)
// This avoids timezone issues where toISOString() might return the previous day
const toLocalISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DateRangePicker: React.FC<{
  checkIn: string;
  checkOut: string;
  onChange: (start: string, end: string) => void;
}> = ({ checkIn, checkOut, onChange }) => {
  // Initialize currentMonth based on checkIn, or default to today (in local time)
  const [currentMonth, setCurrentMonth] = useState(() => {
      if (checkIn) {
          const [y, m, d] = checkIn.split('-').map(Number);
          return new Date(y, m - 1, d);
      }
      return new Date();
  });
  
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const { days, firstDay, year, month } = getDaysInMonth(currentMonth);
  
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    const clickedStr = toLocalISOString(clickedDate);
    
    // Logic:
    // 1. If nothing selected, set checkIn.
    // 2. If checkIn selected but no checkOut, set checkOut (if after checkIn), else reset to checkIn.
    // 3. If both selected, reset to checkIn.
    
    if (!checkIn || (checkIn && checkOut)) {
      onChange(clickedStr, '');
    } else if (checkIn && !checkOut) {
      // Compare timestamps
      const checkInDate = new Date(checkIn.replace(/-/g, '/')); // Replace - with / to ensure browser parses as local date mostly
      // Or better, manually parse checkIn
      const [cy, cm, cd] = checkIn.split('-').map(Number);
      const start = new Date(cy, cm - 1, cd);

      if (clickedDate > start) {
        onChange(checkIn, clickedStr);
        setIsOpen(false); // Close on selection complete
      } else {
        onChange(clickedStr, ''); // Reset start date if clicked before
      }
    }
  };

  const isSelected = (day: number) => {
    const d = new Date(year, month, day).getTime();
    
    // Parse strings to local time timestamps for comparison
    let start = 0;
    if (checkIn) {
        const [y, m, d] = checkIn.split('-').map(Number);
        start = new Date(y, m - 1, d).getTime();
    }
    
    let end = 0;
    if (checkOut) {
        const [y, m, d] = checkOut.split('-').map(Number);
        end = new Date(y, m - 1, d).getTime();
    }
    
    return d === start || d === end;
  };

  const isInRange = (day: number) => {
    const d = new Date(year, month, day).getTime();
    
    let start = 0;
    if (checkIn) {
        const [y, m, d] = checkIn.split('-').map(Number);
        start = new Date(y, m - 1, d).getTime();
    }
    
    let end = 0;
    if (checkOut) {
        const [y, m, d] = checkOut.split('-').map(Number);
        end = new Date(y, m - 1, d).getTime();
    }
    
    const hover = hoverDate ? hoverDate.getTime() : 0;

    // Fixed range
    if (start && end) return d > start && d < end;
    
    // Hover range (visual blue path)
    if (start && !end && hover) {
      return d > start && d <= hover;
    }
    return false;
  };

  const isStart = (day: number) => {
    if (!checkIn) return false;
    const d = new Date(year, month, day).getTime();
    const [y, m, dNum] = checkIn.split('-').map(Number);
    const start = new Date(y, m - 1, dNum).getTime();
    return d === start;
  };

  const isEnd = (day: number) => {
     const d = new Date(year, month, day).getTime();
     if (checkOut) {
        const [y, m, dNum] = checkOut.split('-').map(Number);
        const end = new Date(y, m - 1, dNum).getTime();
        if (d === end) return true;
     }
     
     // Show end style on hover if valid
     if (checkIn && !checkOut && hoverDate) {
         const [y, m, dNum] = checkIn.split('-').map(Number);
         const start = new Date(y, m - 1, dNum).getTime();
         return d === hoverDate.getTime() && d > start;
     }
     return false;
  };

  const calculateNights = () => {
      if (!checkIn || !checkOut) return 0;
      const [y1, m1, d1] = checkIn.split('-').map(Number);
      const [y2, m2, d2] = checkOut.split('-').map(Number);
      const start = new Date(y1, m1 - 1, d1);
      const end = new Date(y2, m2 - 1, d2);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-slate-700 mb-2">Duration of Stay</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-slate-300 rounded-lg flex items-center justify-between cursor-pointer hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 transition-all bg-white"
      >
        <div className="flex items-center gap-2 text-slate-700">
           <CalendarIcon size={18} className="text-indigo-600" />
           {checkIn ? (
             <span className="font-medium">
               {/* Display formatted date manually to avoid timezone shift */}
               {(() => {
                   const [y, m, d] = checkIn.split('-').map(Number);
                   const date = new Date(y, m-1, d);
                   return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
               })()}
               {checkOut ? ` - ${(() => {
                   const [y, m, d] = checkOut.split('-').map(Number);
                   const date = new Date(y, m-1, d);
                   return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
               })()}` : ' - Check-out?'}
             </span>
           ) : (
             <span className="text-slate-400">Select Dates</span>
           )}
        </div>
        {nights > 0 && (
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Moon size={10} /> {nights} Nights
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 w-full animate-fade-in-up">
           <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
              <span className="font-bold text-slate-700">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
           </div>
           
           <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-xs font-bold text-slate-400">{d}</span>)}
           </div>
           
           <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: days }).map((_, i) => {
                 const day = i + 1;
                 const selected = isSelected(day);
                 const range = isInRange(day);
                 const start = isStart(day);
                 const end = isEnd(day);
                 
                 let baseClass = "h-9 w-9 flex items-center justify-center text-sm rounded-full transition-all cursor-pointer relative z-10 ";
                 if (start || end) baseClass += "bg-indigo-600 text-white font-bold shadow-md transform scale-105 ";
                 else if (range) baseClass += "bg-indigo-100 text-indigo-700 font-medium ";
                 else baseClass += "text-slate-700 hover:bg-slate-100 ";

                 return (
                   <div 
                      key={day} 
                      className="relative p-0.5"
                      onMouseEnter={() => setHoverDate(new Date(year, month, day))}
                   >
                      {/* Connector line for range visualization */}
                      {range && !start && !end && (
                        <div className="absolute inset-y-2 left-0 right-0 bg-indigo-100 z-0"></div>
                      )}
                      {range && start && (
                        <div className="absolute inset-y-2 left-1/2 right-0 bg-indigo-100 z-0 rounded-l-none"></div>
                      )}
                      {range && end && (
                        <div className="absolute inset-y-2 left-0 right-1/2 bg-indigo-100 z-0 rounded-r-none"></div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDateClick(day)}
                        className={baseClass}
                      >
                        {day}
                      </button>
                   </div>
                 );
              })}
           </div>
           <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
              <span>Check-in: {checkIn || '-'}</span>
              <span>Check-out: {checkOut || '-'}</span>
           </div>
        </div>
      )}
    </div>
  );
};

export const StayForm: React.FC<StayFormProps> = ({ initialData, onSave, onClose }) => {
  const [hotelName, setHotelName] = useState('');
  const [brand, setBrand] = useState('');
  const [country, setCountry] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [cost, setCost] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [customBrand, setCustomBrand] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const hotelInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsReady(true))
      .catch(() => {}); // Graceful fallback — input remains a normal text field
  }, []);

  useEffect(() => {
    if (!mapsReady || !hotelInputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(hotelInputRef.current, {
      types: ['lodging'],
      fields: ['name', 'address_components', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.name) {
        setHotelName(place.name);
      }
      // Auto-fill country from address components
      const countryComponent = place.address_components?.find(
        (c) => c.types.includes('country')
      );
      if (countryComponent) {
        const countryName = countryComponent.long_name;
        // Match against our COUNTRIES list
        const match = COUNTRIES.find(
          (c) => c.toLowerCase() === countryName.toLowerCase()
        );
        if (match) setCountry(match);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [mapsReady]);

  useEffect(() => {
    if (initialData) {
      setHotelName(initialData.hotelName);
      setBrand(initialData.brand);
      setCountry(initialData.country);
      setCheckIn(initialData.checkInDate);
      setCheckOut(initialData.checkOutDate);
      setCost(initialData.cost ? initialData.cost.toString() : '');
      setRating(initialData.rating || 0);
      if (!POPULAR_BRANDS.includes(initialData.brand)) {
        setCustomBrand(true);
      }
    } else {
        // Default to today using local ISO
        setCheckIn(toLocalISOString(new Date()));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hotelName && brand && checkIn && checkOut && country) {
      onSave({ 
        hotelName, 
        brand, 
        country, 
        checkInDate: checkIn,
        checkOutDate: checkOut,
        cost: cost ? parseFloat(cost) : 0,
        rating: rating > 0 ? rating : undefined
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold">{initialData ? 'Edit Stay' : 'Add New Stay'}</h2>
          <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Hotel Name</label>
            <div className="relative">
              {mapsReady && <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />}
              <input
                ref={hotelInputRef}
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder={mapsReady ? "Search hotels..." : "e.g. Grand Hyatt Tokyo"}
                className={`w-full ${mapsReady ? 'pl-9' : 'px-4'} pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Country</label>
            <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                required
            >
                <option value="" disabled>Select Country</option>
                {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Brand Portfolio</label>
            {!customBrand ? (
              <div className="grid grid-cols-2 gap-2">
                 <select 
                    value={brand} 
                    onChange={(e) => {
                        if (e.target.value === 'Other') {
                            setCustomBrand(true);
                            setBrand('');
                        } else {
                            setBrand(e.target.value);
                        }
                    }}
                    className="col-span-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                 >
                    <option value="" disabled>Select a Loyalty Program</option>
                    {POPULAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="Other">Other (Type custom)</option>
                 </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Enter Brand Name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                  required
                />
                <button 
                    type="button" 
                    onClick={() => setCustomBrand(false)}
                    className="text-xs text-slate-500 underline whitespace-nowrap"
                >
                    Back to list
                </button>
              </div>
            )}
          </div>

          {/* Custom Date Range Picker */}
          <DateRangePicker 
            checkIn={checkIn} 
            checkOut={checkOut} 
            onChange={(start, end) => {
                setCheckIn(start);
                setCheckOut(end);
            }} 
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Total Cost (USD)</label>
                <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Rating</label>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none hover:scale-110 transition-transform"
                        >
                            <Star 
                                size={22} 
                                className={`${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                            />
                        </button>
                    ))}
                    <span className="text-xs text-slate-400 ml-auto font-medium">
                        {rating > 0 ? `${rating}/5` : '-'}
                    </span>
                </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {initialData ? <Save size={20} /> : <Plus size={20} />}
              {initialData ? 'Save Changes' : 'Add to Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};