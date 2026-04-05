import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute } from './layouts/MainLayout'

// Styles
import './styles/index.css'

// Khata pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ledger from './pages/Ledger'
import Parties from './pages/Parties'
import CashBook from './pages/CashBook'
import Admin from './pages/Admin'
import CreateBusiness from './pages/CreateBusiness'
import Settings from './pages/Settings'

// Ecom pages
import StoreConnect from './pages/StoreConnect'
import Orders from './pages/Orders'
import ShipmentQueue from './pages/ShipmentQueue'
import WhatsAppParser from './pages/WhatsAppParser'
import EcomSummary from './pages/EcomSummary'

const AppRoutes = () => {
  const { user } = useAuth()
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

      {/* Khata */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
      <Route path="/parties" element={<ProtectedRoute><Parties /></ProtectedRoute>} />
      <Route path="/cash" element={<ProtectedRoute><CashBook /></ProtectedRoute>} />
      <Route path="/create-business" element={<ProtectedRoute><CreateBusiness /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

      {/* Ecom */}
      <Route path="/store-connect" element={<ProtectedRoute><StoreConnect /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/shipment-queue" element={<ProtectedRoute><ShipmentQueue /></ProtectedRoute>} />
      <Route path="/whatsapp" element={<ProtectedRoute><WhatsAppParser /></ProtectedRoute>} />
      <Route path="/ecom-summary" element={<ProtectedRoute><EcomSummary /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              className: 'dark:bg-bg2 dark:text-text dark:border-border2',
              style: {
                background: 'var(--bg2)',
                color: 'var(--text)',
                border: '1px solid var(--border2)',
                fontSize: '13px',
                borderRadius: '10px',
              }
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}