export const PRICING_CONFIG = {
  PRO_PLAN: {
    USD: 6.99,
    INR: 499,
    DAILY_CREDITS: 1000,
    IS_PRO_LIVE: false,
  },
  CREDIT_PACKAGES: [
    {
      id: 'tier_1',
      credits: 500,
      priceUSD: 4.99,
      priceINR: 349,
      label: 'Starter Pack',
      color: 'blue',
      icon: 'Zap'
    },
    {
      id: 'tier_2',
      credits: 1500,
      priceUSD: 9.99,
      priceINR: 699,
      label: 'Creator Choice',
      color: 'purple',
      popular: true,
      icon: 'Sparkles'
    },
    {
      id: 'tier_3',
      credits: 5000,
      priceUSD: 24.99,
      priceINR: 1799,
      label: 'Studio Power',
      color: 'gold',
      icon: 'Crown'
    }
  ]
};

export function getIsIndia() {
  if (typeof window === 'undefined') return false;
  
  // Detection by timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz === 'Asia/Calcutta' || tz === 'Asia/Kolkata') return true;
  
  // Detection by locale
  if (navigator.language === 'en-IN' || navigator.languages?.includes('en-IN')) return true;
  
  return false;
}

export function formatPrice(amount: number, currency: 'USD' | 'INR') {
  if (currency === 'INR') {
    return `₹${amount}`;
  }
  return `$${amount}`;
}
