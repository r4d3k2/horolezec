import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadTheme } from './lib/storage'

// Téma nastavit ještě před prvním vykreslením, aby nic neproblikávalo.
document.documentElement.dataset.theme = loadTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
