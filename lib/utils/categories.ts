export const CATEGORIES = {
  trabalho:   { label: 'Trabalho',   emoji: '💼', color: '#2A6B8A', bg: '#D0E8F5', tc: '#1A5070' },
  transporte: { label: 'Transporte', emoji: '🚌', color: '#8A6B2A', bg: '#F5EDD0', tc: '#704A10' },
  casa:       { label: 'Casa',       emoji: '🏠', color: '#E07B39', bg: '#FDE8D8', tc: '#A04010' },
  saude:      { label: 'Saúde',      emoji: '💪', color: '#3A9E6F', bg: '#D4F0E4', tc: '#2A7050' },
  fe:         { label: 'Fé',         emoji: '🙏', color: '#9B6DB5', bg: '#EAE0F5', tc: '#6030A0' },
  social:     { label: 'Social',     emoji: '👥', color: '#E0A030', bg: '#FDF0D0', tc: '#906010' },
  pessoal:    { label: 'Pessoal',    emoji: '✨', color: '#4A90C4', bg: '#D8EAF8', tc: '#2050A0' },
  cuidados:   { label: 'Cuidados',   emoji: '💆', color: '#B05080', bg: '#F8D8EC', tc: '#803060' },
  pets:       { label: 'Pets',       emoji: '🐾', color: '#C46B7A', bg: '#F5DADE', tc: '#803040' },
  sono:       { label: 'Sono',       emoji: '😴', color: '#4A4870', bg: '#E0E0F8', tc: '#303080' },
} as const

export type CategoryKey = keyof typeof CATEGORIES

export function getCategoryConfig(cat: string | null) {
  if (!cat || !(cat in CATEGORIES)) {
    return { label: cat ?? 'Outro', emoji: '📌', color: '#7A7469', bg: '#EDE9E0', tc: '#5A5450' }
  }
  return CATEGORIES[cat as CategoryKey]
}
