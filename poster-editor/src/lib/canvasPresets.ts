// Preset Canvas Dimensions for Social Media & Printing

export interface CanvasPreset {
  id: string
  name: string
  ratio: string
  width: number
  height: number
  description: string
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  {
    id: 'poster-standard',
    name: '标准纵向海报',
    ratio: '2:3',
    width: 800,
    height: 1200,
    description: '通用纵向经典海报尺寸',
  },
  {
    id: 'xiaohongshu',
    name: '小红书封面卡片',
    ratio: '3:4',
    width: 1240,
    height: 1650,
    description: '小红书笔记高赞封面黄金高清尺寸',
  },
  {
    id: 'phone-poster',
    name: '手机全屏海报',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    description: '微信朋友圈/抖音全屏手机流海报',
  },
  {
    id: 'wechat-header',
    name: '公众号首图横幅',
    ratio: '2.35:1',
    width: 900,
    height: 383,
    description: '微信公众号文章顶部大图封面',
  },
  {
    id: 'square-post',
    name: '正方形商品主图',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    description: '淘宝/京东商品主图及社交正方形贴纸',
  },
  {
    id: 'banner-landscape',
    name: '电脑横屏 Banner',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    description: '网站首页轮播图/投影演示横屏',
  },
  {
    id: 'a4-flyer',
    name: 'A4 印刷宣传统单页',
    ratio: '1:1.414',
    width: 1240,
    height: 1754,
    description: '线下展会与实体门店宣传高清单页',
  },
]
