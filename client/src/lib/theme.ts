export type Category = 'rice' | 'beans' | 'swallow' | 'yam' | 'plantain' | 'pasta' | 'porridge' | 'other';

// Each category owns a colour so a card is recognisable before the photo loads.
export const categoryMeta: Record<Category, { label: string; color: string; ink: string }> = {
  rice: { label: 'Rice', color: '#F28C1B', ink: '#231A14' },
  beans: { label: 'Beans', color: '#A0522D', ink: '#FFF6E5' },
  swallow: { label: 'Swallow', color: '#2E8B57', ink: '#FFF6E5' },
  yam: { label: 'Yam & Potato', color: '#FFC933', ink: '#231A14' },
  plantain: { label: 'Plantain', color: '#D9381E', ink: '#FFF6E5' },
  pasta: { label: 'Pasta', color: '#2B2A6F', ink: '#FFF6E5' },
  porridge: { label: 'Pap & Light', color: '#E9A6A6', ink: '#231A14' },
  other: { label: 'Special', color: '#231A14', ink: '#FFC933' },
};

// Stable colour per person so avatars don't change between screens.
const tokenColors = ['#D9381E', '#F28C1B', '#2E8B57', '#2B2A6F', '#A0522D', '#C2185B'];
export const colorFor = (name: string) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tokenColors[h % tokenColors.length];
};
