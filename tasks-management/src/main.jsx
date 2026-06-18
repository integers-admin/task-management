import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { router } from './router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AppProvider>
  </StrictMode>,
)
