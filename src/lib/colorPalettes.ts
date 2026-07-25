// Smart Color Palette Switcher for One-Click Aesthetic Theme Transformations

export interface ColorPalette {
  id: string
  name: string
  bg: string
  primary: string
  secondary: string
  accent: string
  swatches: string[]
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'cyber-neon',
    name: '赛博霓虹',
    bg: 'linear-gradient(135deg, #0f172a 0%, #0284c7 100%)',
    primary: '#38bdf8',
    secondary: '#f43f5e',
    accent: '#facc15',
    swatches: ['#0f172a', '#0284c7', '#38bdf8', '#f43f5e'],
  },
  {
    id: 'guochao-crimson',
    name: '国潮朱红',
    bg: 'linear-gradient(135deg, #991b1b 0%, #450a0a 100%)',
    primary: '#fde047',
    secondary: '#ffffff',
    accent: '#fef08a',
    swatches: ['#991b1b', '#450a0a', '#fde047', '#ffffff'],
  },
  {
    id: 'black-gold',
    name: '黑金尊享',
    bg: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
    primary: '#fbbf24',
    secondary: '#fef08a',
    accent: '#f59e0b',
    swatches: ['#18181b', '#09090b', '#fbbf24', '#fef08a'],
  },
  {
    id: 'morandi-slate',
    name: '莫兰迪沉稳',
    bg: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    accent: '#cbd5e1',
    swatches: ['#334155', '#0f172a', '#f1f5f9', '#94a3b8'],
  },
  {
    id: 'summer-mint',
    name: '夏日冰爽',
    bg: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
    primary: '#a7f3d0',
    secondary: '#ffffff',
    accent: '#fef08a',
    swatches: ['#047857', '#064e3b', '#a7f3d0', '#ffffff'],
  },
  {
    id: 'macaron-purple',
    name: '梦幻粉紫',
    bg: 'linear-gradient(135deg, #581c87 0%, #3b0764 100%)',
    primary: '#f472b6',
    secondary: '#e9d5ff',
    accent: '#38bdf8',
    swatches: ['#581c87', '#3b0764', '#f472b6', '#e9d5ff'],
  },
]
