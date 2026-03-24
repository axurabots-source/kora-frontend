import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, BookOpen, Users, Wallet, Shield, LogOut
} from 'lucide-react'

export default function Sidebar() {
  const { profile, signOut } = useAuth()

  const links = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/ledger', icon: <BookOpen size={18} />, label: 'Ledger' },
    { to: '/parties', icon: <Users size={18} />, label: 'Parties' },
    { to: '/cash', icon: <Wallet size={18} />, label: 'Cash Book' },
  ]

  if (profile?.role === 'admin') {
    links.push({ to: '/admin', icon: <Shield size={18} />, label: 'Admin' })
  }

  return (
    <div style={{
      width: '220px', minHeight: '100vh', background: '#111',
      borderRight: '1px solid #222', display: 'flex',
      flexDirection: 'column', padding: '24px 16px', fontFamily: 'sans-serif'
    }}>
      <h2 style={{ color: '#7F77DD', fontSize: '22px', marginBottom: '32px', paddingLeft: '8px' }}>
        KORA
      </h2>

      <nav style={{ flex: 1 }}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px', marginBottom: '4px',
              color: isActive ? '#fff' : '#666',
              background: isActive ? '#1e1e2e' : 'transparent',
              textDecoration: 'none', fontSize: '14px',
              transition: 'all 0.2s'
            })}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid #222', paddingTop: '16px' }}>
        <p style={{ color: '#555', fontSize: '12px', marginBottom: '4px', paddingLeft: '8px' }}>
          {profile?.role === 'admin' ? 'Admin' : 'User'}
        </p>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', paddingLeft: '8px' }}>
          {profile?.full_name || 'KORA User'}
        </p>
        <button
          onClick={signOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', borderRadius: '8px', width: '100%',
            background: 'transparent', border: '1px solid #333',
            color: '#666', cursor: 'pointer', fontSize: '14px'
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}