import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Monitor, Layers, Image as ImageIcon, Search, X, Component, LayoutTemplate } from 'lucide-react'
import { MaterialPanel } from './MaterialPanel'
import { TemplatePanel } from './TemplatePanel'
import { LayerTree } from './LayerTree'
import { SceneList } from './SceneList'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/store/useEditorStore'

const ICON_NAV_KEYS = [
  { icon: LayoutTemplate, labelKey: 'sidebar.nav.templates', fallbackLabel: '模板', tab: 'templates' },
  { icon: Component, labelKey: 'sidebar.nav.components', fallbackLabel: '组件', tab: 'components' },
  { icon: ImageIcon, labelKey: 'sidebar.nav.assets', fallbackLabel: '素材', tab: 'system' },
  { icon: Layers, labelKey: 'sidebar.nav.layers', fallbackLabel: '图层', tab: 'structure' },
  { icon: Monitor, labelKey: 'sidebar.nav.scenes', fallbackLabel: '页面', tab: 'myScenes' },
]

export function LeftSidebar() {
  const { t } = useTranslation()
  const sidebarTab = useEditorStore((s) => s.sidebarTab)
  const setSidebarTab = useEditorStore((s) => s.setSidebarTab)
  const [search, setSearch] = useState('')

  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const isSearchVisible = sidebarTab === 'templates' || sidebarTab === 'components' || sidebarTab === 'system'

  return (
    <div className="flex h-full shrink-0 border-r border-editor-darker bg-editor text-editor-text">
      {/* Icon navigation */}
      <div className="w-14 border-r border-editor-darker bg-editor-deep flex flex-col items-center py-4 gap-6 text-[11px] font-bold">
        {ICON_NAV_KEYS.map(({ icon: Icon, labelKey, fallbackLabel, tab }) => (
          <div
            key={tab}
            onClick={() => setSidebarTab(tab)}
            className={`flex flex-col items-center cursor-pointer transition-all px-1 py-1 rounded ${
              sidebarTab === tab ? 'text-blue-400 bg-blue-500/10' : 'hover:text-editor-text'
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            {tr(labelKey, fallbackLabel)}
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="w-64 flex flex-col bg-editor">
        {/* Search */}
        {isSearchVisible && (
          <div className="p-3 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-editor-text-dim" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('sidebar.search')}
                className="h-8 text-xs bg-editor-deep border-border text-editor-text pl-8 pr-7 focus-visible:ring-blue-500 rounded"
              />
              {search && (
                <X
                  className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-editor-text-dim cursor-pointer hover:text-editor-text"
                  onClick={() => setSearch('')}
                />
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {sidebarTab === 'templates' && <TemplatePanel searchFilter={search} />}
          {sidebarTab === 'components' && <MaterialPanel searchFilter={search} mode="components" />}
          {sidebarTab === 'system' && <MaterialPanel searchFilter={search} mode="assets" />}
          {sidebarTab === 'myScenes' && <SceneList />}
          {sidebarTab === 'structure' && <LayerTree />}
        </div>
      </div>
    </div>
  )
}
