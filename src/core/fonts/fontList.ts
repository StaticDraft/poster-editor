export interface FontEntry {
  family: string
  displayName: string
  category: 'sans' | 'serif' | 'handwriting' | 'display' | 'chinese'
  source: 'google' | 'system'
  sampleText?: string
}

export const FONT_CATEGORIES = [
  { key: 'sans', labelKey: 'font.category.sans', fallback: '无衬线' },
  { key: 'serif', labelKey: 'font.category.serif', fallback: '衬线体' },
  { key: 'handwriting', labelKey: 'font.category.handwriting', fallback: '手写体' },
  { key: 'display', labelKey: 'font.category.display', fallback: '装饰体' },
  { key: 'chinese', labelKey: 'font.category.chinese', fallback: '中文艺术字' },
] as const

export const FONT_LIST: FontEntry[] = [
  // ── Sans-serif ──
  { family: 'Inter', displayName: 'Inter', category: 'sans', source: 'google' },
  { family: 'Roboto', displayName: 'Roboto', category: 'sans', source: 'google' },
  { family: 'Montserrat', displayName: 'Montserrat', category: 'sans', source: 'google' },
  { family: 'Outfit', displayName: 'Outfit', category: 'sans', source: 'google' },
  { family: 'Poppins', displayName: 'Poppins', category: 'sans', source: 'google' },
  { family: 'Nunito', displayName: 'Nunito', category: 'sans', source: 'google' },
  { family: 'Open Sans', displayName: 'Open Sans', category: 'sans', source: 'google' },
  { family: 'Raleway', displayName: 'Raleway', category: 'sans', source: 'google' },

  // ── Serif ──
  { family: 'Playfair Display', displayName: 'Playfair Display', category: 'serif', source: 'google' },
  { family: 'Lora', displayName: 'Lora', category: 'serif', source: 'google' },
  { family: 'Merriweather', displayName: 'Merriweather', category: 'serif', source: 'google' },
  { family: 'PT Serif', displayName: 'PT Serif', category: 'serif', source: 'google' },
  { family: 'Libre Baskerville', displayName: 'Libre Baskerville', category: 'serif', source: 'google' },

  // ── Handwriting ──
  { family: 'Pacifico', displayName: 'Pacifico', category: 'handwriting', source: 'google' },
  { family: 'Dancing Script', displayName: 'Dancing Script', category: 'handwriting', source: 'google' },
  { family: 'Caveat', displayName: 'Caveat', category: 'handwriting', source: 'google' },
  { family: 'Satisfy', displayName: 'Satisfy', category: 'handwriting', source: 'google' },
  { family: 'Great Vibes', displayName: 'Great Vibes', category: 'handwriting', source: 'google' },

  // ── Display / Decorative ──
  { family: 'Righteous', displayName: 'Righteous', category: 'display', source: 'google' },
  { family: 'Bungee', displayName: 'Bungee', category: 'display', source: 'google' },
  { family: 'Anton', displayName: 'Anton', category: 'display', source: 'google' },
  { family: 'Fredoka', displayName: 'Fredoka', category: 'display', source: 'google' },
  { family: 'Lobster', displayName: 'Lobster', category: 'display', source: 'google' },
  { family: 'Bebas Neue', displayName: 'Bebas Neue', category: 'display', source: 'google' },

  // ── Chinese ──
  { family: 'ZCOOL XiaoWei', displayName: '站酷小薇体', category: 'chinese', source: 'google', sampleText: '海报设计' },
  { family: 'Ma Shan Zheng', displayName: '马善政毛笔体', category: 'chinese', source: 'google', sampleText: '国风书法' },
  { family: 'ZCOOL QingKe HuangYou', displayName: '站酷庆科黄油体', category: 'chinese', source: 'google', sampleText: '活力标题' },
  { family: 'Noto Sans SC', displayName: '思源黑体', category: 'chinese', source: 'google', sampleText: '简洁排版' },
  { family: 'Noto Serif SC', displayName: '思源宋体', category: 'chinese', source: 'google', sampleText: '典雅正文' },
  { family: 'LXGW WenKai', displayName: '霞鹜文楷', category: 'chinese', source: 'google', sampleText: '文艺气息' },
  { family: 'Long Cang', displayName: '龙藏体', category: 'chinese', source: 'google', sampleText: '草书风格' },
  { family: 'Zhi Mang Xing', displayName: '志莽行书', category: 'chinese', source: 'google', sampleText: '行书潇洒' },
]

/** Get a font entry by family name */
export function getFontEntry(family: string): FontEntry | undefined {
  return FONT_LIST.find(f => f.family === family)
}

/** Get fonts by category */
export function getFontsByCategory(category: FontEntry['category']): FontEntry[] {
  return FONT_LIST.filter(f => f.category === category)
}

/** Google Fonts preconnect URLs - add to document head for faster loading */
export const GOOGLE_FONTS_PRECONNECT = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
]
