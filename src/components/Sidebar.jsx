import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard, BookOpen, Users, Wallet, Shield, LogOut,
  ShoppingCart, Package, MessageSquare, Store, BarChart2, Sun, Moon
} from 'lucide-react'

const NavItem = ({ to, icon, label, end }) => {
  const location = useLocation()
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      end={end}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '8px 10px',
        borderRadius: '8px',
        color: isActive ? 'var(--text)' : 'var(--text3)',
        background: isActive ? 'var(--bg3)' : 'transparent',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: isActive ? '600' : '400',
        letterSpacing: isActive ? '-0.1px' : '0',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: isActive ? 'var(--text)' : 'var(--text3)' }}>
        {icon}
      </span>
      {label}
      {isActive && (
        <span style={{
          marginLeft: 'auto',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: 'var(--text)',
          flexShrink: 0
        }} />
      )}
    </NavLink>
  )
}

const SectionLabel = ({ label }) => (
  <p style={{
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    padding: '0 10px',
    marginBottom: '4px',
    marginTop: '20px',
  }}>
    {label}
  </p>
)

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const khataLinks = [
    { to: '/', icon: <LayoutDashboard size={15} />, label: 'Dashboard', end: true },
    { to: '/ledger', icon: <BookOpen size={15} />, label: 'Ledger' },
    { to: '/parties', icon: <Users size={15} />, label: 'Parties' },
    { to: '/cash', icon: <Wallet size={15} />, label: 'Cash Book' },
  ]

  const ecomLinks = [
    { to: '/store', icon: <Store size={15} />, label: 'Store Connect' },
    { to: '/orders', icon: <ShoppingCart size={15} />, label: 'Orders' },
    { to: '/shipments', icon: <Package size={15} />, label: 'Shipments' },
    { to: '/whatsapp', icon: <MessageSquare size={15} />, label: 'WA Parser' },
    { to: '/ecom-summary', icon: <BarChart2 size={15} />, label: 'Ecom Finance' },
  ]

  return (
    <div style={{
      width: '200px',
      minHeight: '100vh',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 10px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '8px 10px', marginBottom: '8px' }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '900',
          color: 'var(--text)',
          letterSpacing: '-1px',
          lineHeight: 1,
        }}>
          KORA
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '3px', letterSpacing: '0.5px' }}>
          Ecom Finance
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', marginBottom: '4px' }} />

      {/* Khata Section */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <SectionLabel label="Khata" />
        {khataLinks.map(l => <NavItem key={l.to} {...l} />)}

        <SectionLabel label="Ecom" />
        {ecomLinks.map(l => <NavItem key={l.to} {...l} />)}

        {profile?.role === 'admin' && (
          <>
            <SectionLabel label="Admin" />
            <NavItem to="/admin" icon={<Shield size={15} />} label="Admin Panel" />
          </>
        )}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 10px',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '7px', fontWeight: '500' }}>
            {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
          <div style={{
            width: '36px',
            height: '20px',
            borderRadius: '99px',
            background: theme === 'dark' ? 'var(--bg4)' : 'var(--text)',
            position: 'relative',
            transition: 'background-color 0.15s ease',
            flexShrink: 0,
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: theme === 'dark' ? 'var(--text2)' : 'var(--bg)',
              position: 'absolute',
              top: '3px',
              left: theme === 'dark' ? '3px' : '19px',
              transition: 'left 0.15s ease',
            }} />
          </div>
        </button>

        {/* User info */}
        <div style={{ padding: '6px 10px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>
            {profile?.role === 'admin' ? '⚡ Admin' : 'User'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.full_name || profile?.email || 'KORA User'}
          </p>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '8px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--text3)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  )
}