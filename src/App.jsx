import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'

// Khata pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ledger from './pages/Ledger'
import Parties from './pages/Parties'
import CashBook from './pages/CashBook'
import Admin from './pages/Admin'
import CreateBusiness from './pages/CreateBusiness'

// Ecom pages
import StoreConnect from './pages/StoreConnect'
import Orders from './pages/Orders'
import ShipmentQueue from './pages/ShipmentQueue'
import WhatsAppParser from './pages/WhatsAppParser'
import EcomSummary from './pages/EcomSummary'

const Layout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
    <Sidebar />
    <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
      {children}
    </div>
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  return <Layout>{children}</Layout>
}

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
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

      {/* Ecom */}
      <Route path="/store" element={<ProtectedRoute><StoreConnect /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/shipments" element={<ProtectedRoute><ShipmentQueue /></ProtectedRoute>} />
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