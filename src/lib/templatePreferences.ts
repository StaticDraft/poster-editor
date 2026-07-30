import { PRESET_TEMPLATES, type PresetTemplate } from './presetTemplates'

export interface TemplatePreferences {
  deletedIds: string[]
  names: Record<string, string>
  overrides: Record<string, {
    canvasConfig: PresetTemplate['canvasConfig']
    elements: any[]
  }>
}

const STORAGE_KEY = 'poster_template_preferences'
export const TEMPLATE_PREFERENCES_UPDATED_EVENT = 'poster-template-preferences-updated'

const EMPTY_PREFERENCES: TemplatePreferences = {
  deletedIds: [],
  names: {},
  overrides: {},
}

export function loadTemplatePreferences(): TemplatePreferences {
  if (typeof window === 'undefined') return EMPTY_PREFERENCES

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<TemplatePreferences>
    return {
      deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
      names: parsed.names && typeof parsed.names === 'object' ? parsed.names : {},
      overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
    }
  } catch {
    return EMPTY_PREFERENCES
  }
}

export function saveTemplatePreferences(preferences: TemplatePreferences) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  window.dispatchEvent(new Event(TEMPLATE_PREFERENCES_UPDATED_EVENT))
}

export function getTemplateName(template: PresetTemplate, preferences: TemplatePreferences) {
  return preferences.names[template.id] || template.name
}

export function getVisibleTemplates(preferences: TemplatePreferences) {
  const deleted = new Set(preferences.deletedIds)
  return PRESET_TEMPLATES
    .filter((template) => !deleted.has(template.id))
    .map((template) => ({
      ...template,
      ...(preferences.overrides[template.id] || {}),
      name: getTemplateName(template, preferences),
    }))
}

export function saveTemplateOverride(
  templateId: string,
  override: TemplatePreferences['overrides'][string],
) {
  const preferences = loadTemplatePreferences()
  saveTemplatePreferences({
    ...preferences,
    overrides: {
      ...preferences.overrides,
      [templateId]: JSON.parse(JSON.stringify(override)) as TemplatePreferences['overrides'][string],
    },
  })
}
