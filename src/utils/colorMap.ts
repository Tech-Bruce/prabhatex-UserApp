// Utility to map color names to hex codes for sarees and garments

export const COLOR_MAP: Record<string, string> = {
  // Golds & Metallics
  gold: '#D4AF37',
  'metallic gold': '#D4AF37',
  'antique gold': '#CFB53B',
  'rose gold': '#B76E79',
  copper: '#B87333',
  bronze: '#CD7F32',
  rust: '#B7410E',
  silver: '#C0C0C0',
  metallic: '#A8A9AD',

  // Reds & Maroons
  red: '#DC2626',
  'dark red': '#991B1B',
  crimson: '#DC143C',
  maroon: '#800000',
  wine: '#722F37',
  burgundy: '#800020',
  cherry: '#DE3163',
  'brick red': '#CB4154',
  'tomato red': '#FF6347',
  'chilli red': '#C21807',
  scarlet: '#FF2400',

  // Pinks & Corals
  pink: '#EC4899',
  'baby pink': '#FBCFE8',
  'rose pink': '#F472B6',
  'dusty pink': '#DCAE96',
  'dusty rose': '#DCAE96',
  'onion pink': '#D98282',
  rani: '#BE185D',
  'rani pink': '#BE185D',
  magenta: '#D946EF',
  'hot pink': '#FF69B4',
  peach: '#FDBA74',
  coral: '#FB7185',
  salmon: '#FA8072',
  blush: '#FECDD3',

  // Yellows & Oranges
  yellow: '#EAB308',
  'lemon yellow': '#FEF08A',
  lemon: '#FDE047',
  mustard: '#CA8A04',
  'mustard yellow': '#CA8A04',
  haldi: '#EAB308',
  turmeric: '#EAB308',
  mango: '#FBBF24',
  orange: '#F97316',
  saffron: '#FF9933',
  amber: '#F59E0B',
  kesari: '#FF9933',
  carrot: '#EA580C',

  // Greens
  green: '#16A34A',
  'dark green': '#14532D',
  'bottle green': '#0F3E26',
  'emerald green': '#059669',
  emerald: '#059669',
  'mint green': '#6EE7B7',
  mint: '#A7F3D0',
  olive: '#65A30D',
  'olive green': '#556B2F',
  pista: '#93C572',
  'parrot green': '#22C55E',
  'rama green': '#0D9488',
  'sea green': '#2E8B57',
  'sage green': '#9CAF88',
  sage: '#9CAF88',
  mehendi: '#4D5D28',
  'mehendi green': '#4D5D28',
  teal: '#0D9488',
  'teal green': '#0F766E',

  // Blues
  blue: '#2563EB',
  'royal blue': '#1D4ED8',
  'navy blue': '#1E3A8A',
  navy: '#1E3A8A',
  'sky blue': '#38BDF8',
  'light blue': '#7DD3FC',
  'ice blue': '#BAE6FD',
  'peacock blue': '#005F73',
  'ink blue': '#0A2540',
  indigo: '#4338CA',
  turquoise: '#06B6D4',
  cyan: '#06B6D4',
  'midnight blue': '#191970',
  'powder blue': '#B0E0E6',

  // Purples & Violets
  purple: '#9333EA',
  violet: '#7C3AED',
  lavender: '#C084FC',
  lilac: '#C8A2C8',
  plum: '#8E4585',
  mauve: '#E0B0FF',
  grape: '#6F2DA8',
  jamun: '#4B0082',

  // Neutrals / Browns / Whites / Blacks
  black: '#171717',
  'jet black': '#0A0A0A',
  charcoal: '#334155',
  white: '#FFFFFF',
  'off white': '#FAF9F6',
  'off-white': '#FAF9F6',
  cream: '#FEF9C3',
  ivory: '#FFFFF0',
  beige: '#E7D8C9',
  fawn: '#E5AA70',
  sandalwood: '#C2B280',
  chandan: '#C2B280',
  khaki: '#C3B091',
  brown: '#78350F',
  'dark brown': '#451A03',
  coffee: '#4A2C2A',
  chocolate: '#3D1C06',
  tan: '#D2B48C',
  grey: '#6B7280',
  gray: '#6B7280',
  'light grey': '#E5E7EB',
  'light gray': '#E5E7EB',
  ash: '#9CA3AF',
  slate: '#64748B',
};

export function getColorHex(name?: string, fallbackHex?: string): string {
  if (fallbackHex && /^#([0-9A-F]{3}){1,2}$/i.test(fallbackHex.trim())) {
    return fallbackHex.trim();
  }
  if (!name || typeof name !== 'string') return '#D4AF37';
  const clean = name.trim().toLowerCase();
  if (/^#([0-9A-F]{3}){1,2}$/i.test(clean)) {
    return clean;
  }
  if (COLOR_MAP[clean]) {
    return COLOR_MAP[clean];
  }
  // Check substring match (longest matching key first)
  const sortedKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (clean.includes(key)) {
      return COLOR_MAP[key];
    }
  }
  // Generate a consistent aesthetic hue from string hash if no keyword matched
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}
