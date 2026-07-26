import { createContext, useContext, useEffect, useRef, useState } from 'react'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'banana:theme'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function initialTheme(): Theme {
  const applied = document.documentElement.dataset.theme
  return applied === 'dark' || applied === 'light' ? applied : systemTheme()
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const transitionTimer = useRef<number | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function followSystem(event: MediaQueryListEvent) {
      if (localStorage.getItem(THEME_STORAGE_KEY)) return
      setTheme(event.matches ? 'dark' : 'light')
    }

    media.addEventListener('change', followSystem)
    return () => media.removeEventListener('change', followSystem)
  }, [])

  useEffect(
    () => () => {
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current)
    },
    [],
  )

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!reduceMotion) {
      document.documentElement.classList.add('theme-transition')
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current)
      transitionTimer.current = window.setTimeout(() => {
        document.documentElement.classList.remove('theme-transition')
      }, 420)
    }

    localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    setTheme(nextTheme)
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return context
}
