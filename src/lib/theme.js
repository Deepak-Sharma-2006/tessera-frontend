import { createContext, useContext } from 'react'

export const ThemeContext = createContext({
  theme: 'cyber',
  setTheme: () => {},
  toggleTheme: () => {}
})

export const useTheme = () => useContext(ThemeContext)

export const THEME_ORDER = ['cyber']

export const THEME_DISPLAY_NAMES = {
  cyber: '🔮 Cyber Neon'
}

export const THEME_DESCRIPTIONS = {
  cyber: 'Futuristic experience'
}

export const VALID_THEMES = ['cyber']
export const THEME_STORAGE_KEY = 'studcollab-theme'