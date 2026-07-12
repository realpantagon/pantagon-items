import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './shared/theme/ThemeProvider'

const storedTheme = window.localStorage.getItem('pantagon-theme');
const preferredTheme = storedTheme === 'light' || storedTheme === 'dark'
  ? storedTheme
  : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

document.documentElement.dataset.theme = preferredTheme;
document.documentElement.style.colorScheme = preferredTheme;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
