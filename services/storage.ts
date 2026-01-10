import { Stay } from '../types';

// Key for localStorage
const STORAGE_KEY = 'stayfolio_data';
const STATUS_KEY = 'stayfolio_status_overrides';

// Helper to add days to a date string
const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Initial dummy data to populate the view if empty
const INITIAL_DATA: Stay[] = [
  { id: '1', hotelName: 'Grand Hyatt Tokyo', brand: 'World of Hyatt', country: 'Japan', checkInDate: '2023-11-15', checkOutDate: '2023-11-20', cost: 2500, rating: 5, createdAt: 1700000000000 },
  { id: '2', hotelName: 'Marriott Marquis NY', brand: 'Marriott Bonvoy', country: 'United States of America', checkInDate: '2023-12-01', checkOutDate: '2023-12-03', cost: 1200, rating: 4, createdAt: 1700000000000 },
  { id: '3', hotelName: 'Hyatt Regency London', brand: 'World of Hyatt', country: 'United Kingdom', checkInDate: '2024-01-20', checkOutDate: '2024-01-25', cost: 1800, rating: 5, createdAt: 1700000000000 },
  { id: '4', hotelName: 'Hilton Garden Inn', brand: 'Hilton Honors', country: 'United Kingdom', checkInDate: '2024-02-14', checkOutDate: '2024-02-15', cost: 150, rating: 2, createdAt: 1700000000000 },
  { id: '5', hotelName: 'Andaz 5th Avenue', brand: 'World of Hyatt', country: 'United States of America', checkInDate: '2024-03-10', checkOutDate: '2024-03-14', cost: 3200, rating: 5, createdAt: 1700000000000 },
  { id: '6', hotelName: 'W Barcelona', brand: 'Marriott Bonvoy', country: 'Spain', checkInDate: '2024-05-22', checkOutDate: '2024-05-26', cost: 2100, rating: 4, createdAt: 1700000000000 },
  { id: '7', hotelName: 'InterContinental Paris', brand: 'IHG One Rewards', country: 'France', checkInDate: '2024-06-15', checkOutDate: '2024-06-20', cost: 2800, rating: 5, createdAt: 1700000000000 },
];

export const getStays = (): Stay[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Initialize with dummy data for better first-time UX
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  try {
    const parsed = JSON.parse(data);
    // Migration for old data structures
    return parsed.map((s: any) => {
        // Handle migration from old 'date' field to checkIn/checkOut
        const checkIn = s.checkInDate || s.date;
        const checkOut = s.checkOutDate || (checkIn ? addDays(checkIn, 1) : '');
        
        // Handle migration of old ratings ('up'/'down') to stars
        let rating = s.rating;
        if (s.rating === 'up') rating = 5;
        if (s.rating === 'down') rating = 1;
        
        return {
            ...s,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            country: s.country || 'Unknown',
            cost: s.cost || 0, // Default cost if missing
            rating: typeof rating === 'number' ? rating : undefined
        };
    });
  } catch (e) {
    return [];
  }
};

export const addStay = (stay: Omit<Stay, 'id' | 'createdAt'>): Stay => {
  const currentStays = getStays();
  const newStay: Stay = {
    ...stay,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const updatedStays = [newStay, ...currentStays];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStays));
  return newStay;
};

export const updateStay = (id: string, updates: Partial<Stay>): Stay | null => {
  const currentStays = getStays();
  const index = currentStays.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  const updatedStay = { ...currentStays[index], ...updates };
  currentStays[index] = updatedStay;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentStays));
  return updatedStay;
};

export const deleteStay = (id: string): void => {
  const currentStays = getStays();
  const updatedStays = currentStays.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStays));
};

export const importStays = (newStays: Stay[]): void => {
  // Simple validation to ensure it looks like our data
  // Map old formats if importing from older export
  const processedStays = newStays.map((s: any) => ({
      ...s,
      checkInDate: s.checkInDate || s.date,
      checkOutDate: s.checkOutDate || (s.date ? addDays(s.date, 1) : ''),
      cost: s.cost || 0,
      rating: typeof s.rating === 'number' ? s.rating : undefined
  })).filter(s => s.hotelName && s.brand && s.checkInDate);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(processedStays));
};

// --- Status Overrides ---

export const getManualStatuses = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
  } catch {
    return {};
  }
};

export const saveManualStatus = (programId: string, statusName: string) => {
  const current = getManualStatuses();
  if (statusName === 'Member') {
      delete current[programId]; // Removing override if set back to Member/Default
  } else {
      current[programId] = statusName;
  }
  localStorage.setItem(STATUS_KEY, JSON.stringify(current));
  return current;
};