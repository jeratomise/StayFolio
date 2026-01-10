import { ProgramInfo } from './types';

const LOGO_TOKEN = 'pk_X8xoEOVYSSKmBlF770Jjmg';

// Using Logo.dev API for reliable logo fetching
export const BRAND_LOGOS: Record<string, string> = {
  'Marriott Bonvoy': `https://img.logo.dev/marriott.com?token=${LOGO_TOKEN}`,
  'World of Hyatt': `https://img.logo.dev/hyatt.com?token=${LOGO_TOKEN}`,
  'Hilton Honors': `https://img.logo.dev/hilton.com?token=${LOGO_TOKEN}`,
  'IHG One Rewards': `https://img.logo.dev/ihg.com?token=${LOGO_TOKEN}`,
  'Accor Live Limitless': `https://img.logo.dev/all.accor.com?token=${LOGO_TOKEN}`,
  'GHA Discovery': `https://img.logo.dev/ghadiscovery.com?token=${LOGO_TOKEN}`,
  'Best Western Rewards': `https://img.logo.dev/bestwestern.com?token=${LOGO_TOKEN}`,
  'Wyndham Rewards': `https://img.logo.dev/wyndhamhotels.com?token=${LOGO_TOKEN}`,
  'Radisson Rewards': `https://img.logo.dev/radissonhotels.com?token=${LOGO_TOKEN}`,
};

// Sort brands alphabetically
export const POPULAR_BRANDS = Object.keys(BRAND_LOGOS).sort();

// Comprehensive list of countries for dropdown
export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

export const ELITE_PROGRAMS: ProgramInfo[] = [
  {
    id: 'marriott',
    name: 'Marriott Bonvoy',
    color: 'bg-orange-500',
    tiers: [
      {
        name: 'Ambassador Elite',
        rank: 1,
        requirements: { nights: 100, spendUSD: 23000, description: '100 Nights + $23k Spend' }
      },
      {
        name: 'Titanium Elite',
        rank: 2,
        requirements: { nights: 75 }
      }
    ]
  },
  {
    id: 'hyatt',
    name: 'World of Hyatt',
    color: 'bg-blue-600',
    tiers: [
      {
        name: 'Globalist',
        rank: 1,
        requirements: { nights: 60, points: 100000, description: '60 Nights or 100k Base Points' }
      }
    ]
  },
  {
    id: 'hilton',
    name: 'Hilton Honors',
    color: 'bg-blue-900',
    tiers: [
      {
        name: 'Diamond',
        rank: 1,
        requirements: { nights: 50, stays: 25, spendUSD: 11500, description: '50 Nights, 25 Stays, or $11.5k Spend' }
      }
    ]
  },
  {
    id: 'ihg',
    name: 'IHG One Rewards',
    color: 'bg-orange-600',
    tiers: [
      {
        name: 'Diamond Elite',
        rank: 1,
        requirements: { nights: 70, points: 120000, description: '70 Nights or 120k Points' }
      },
      {
        name: 'Platinum Elite',
        rank: 2,
        requirements: { nights: 40, points: 60000, description: '40 Nights or 60k Points' }
      }
    ]
  },
  {
    id: 'accor',
    name: 'Accor Live Limitless',
    color: 'bg-yellow-600',
    tiers: [
      {
        name: 'Platinum',
        rank: 1,
        requirements: { nights: 60, description: '60 Nights (Diamond requires pure spend)' }
      }
    ]
  },
  {
    id: 'wyndham',
    name: 'Wyndham Rewards',
    color: 'bg-blue-500',
    tiers: [
      {
        name: 'Diamond',
        rank: 1,
        requirements: { nights: 40 }
      }
    ]
  },
  {
    id: 'radisson',
    name: 'Radisson Rewards',
    color: 'bg-teal-600',
    tiers: [
      {
        name: 'VIP',
        rank: 1,
        requirements: { nights: 30, stays: 20, description: '30 Nights or 20 Stays' }
      }
    ]
  },
  {
    id: 'bestwestern',
    name: 'Best Western Rewards',
    color: 'bg-red-700',
    tiers: [
      {
        name: 'Diamond Select',
        rank: 1,
        requirements: { nights: 25 }
      }
    ]
  }
];