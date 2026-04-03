import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

export const MainLayout = ({ children }) => (
  <div className="flex min-h-screen bg-bg">
    <Sidebar />
    {/* 
      lg:pl-72 pushes content right so the 288px fixed sidebar doesn't overlap.
      pb-24 ensures content isn't hidden behind the mobile bottom nav.
    */}
    <div className="flex-1 min-w-0 bg-bg relative lg:pl-72 pb-24 lg:pb-0">
      <div className="p-4 md:p-8 lg:p-10 max-w-[1200px] mx-auto w-full">
        {children}
      </div>
    </div>
  </div>
)

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  return <MainLayout>{children}</MainLayout>
}
