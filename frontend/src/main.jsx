import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { LocacaoProvider, setupLocacaoInterceptor } from './contexts/LocacaoContext'
import './styles/index.css'
import App from './App.jsx'

// Setup interceptor para adicionar locacaoId automaticamente
setupLocacaoInterceptor();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LocacaoProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LocacaoProvider>
    </ThemeProvider>
  </StrictMode>,
)

// Service Worker desabilitado - PWA removido por solicitação do cliente
