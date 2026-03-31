import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, BookOpen, Users, Wallet, LogOut, 
  ShoppingCart, MessageSquare, BarChart2, User, Settings
} from 'lucide-react'

// Desktop Nav Item
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
        padding: '10px 12px',
        borderRadius: '10px',
        color: isActive ? 'var(--text)' : 'var(--text3)',
        background: isActive ? 'var(--bg3)' : 'transparent',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: isActive ? '700' : '500',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      {label}
    </NavLink>
  )
}

// Mobile Tab Item
const TabItem = ({ to, icon, label, end }) => {
  const location = useLocation()
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      end={end}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        color: isActive ? 'var(--text)' : 'var(--text3)',
        textDecoration: 'none',
        flex: 1,
        padding: '8px 0',
      }}
    >
      {icon}
      <span style={{ fontSize: '10px', fontWeight: isActive ? '700' : '500' }}>{label}</span>
    </NavLink>
  )
}

const SectionLabel = ({ label }) => (
  <p style={{
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    padding: '0 12px',
    marginBottom: '8px',
    marginTop: '24px',
    opacity: 0.8
  }}>
    {label}
  </p>
)

export default function Sidebar() {
  const { profile, signOut } = useAuth()

  const khataLinks = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { to: '/ledger', icon: <BookOpen size={18} />, label: 'Ledger' },
    { to: '/cash', icon: <Wallet size={18} />, label: 'CashBook' },
    { to: '/parties', icon: <Users size={18} />, label: 'Parties' },
  ]

  const ecomLinks = [
    { to: '/whatsapp', icon: <MessageSquare size={18} />, label: 'WA Parser' },
    { to: '/ecom-summary', icon: <BarChart2 size={18} />, label: 'Analytics' },
    { to: '/orders', icon: <ShoppingCart size={18} />, label: 'Orders' },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar desktop-only">
        <div style={{ padding: '24px 20px', marginBottom: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text)', letterSpacing: '-1.5px' }}>KORA</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '700', textTransform: 'uppercase' }}>Financial Core</div>
        </div>

        <nav style={{ flex: 1, padding: '0 10px', overflowY: 'auto' }}>
          <SectionLabel label="Business" />
          {khataLinks.map(l => <NavItem key={l.to} {...l} />)}

          <SectionLabel label="Automation" />
          {ecomLinks.map(l => <NavItem key={l.to} {...l} />)}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg3)', borderRadius: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px' }}>
              {profile?.full_name?.[0] || 'K'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{profile?.full_name || 'Seller'}</p>
              <button onClick={signOut} style={{ background: 'none', border: 'none', color: 'var(--red-light)', fontSize: '11px', fontWeight: '600', padding: 0, cursor: 'pointer' }}>Sign out</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav mobile-only">
        <TabItem to="/" icon={<LayoutDashboard size={20} />} label="Home" end />
        <TabItem to="/ledger" icon={<BookOpen size={20} />} label="Ledger" />
        <TabItem to="/cash" icon={<Wallet size={20} />} label="Cash" />
        <TabItem to="/whatsapp" icon={<BarChart2 size={20} />} label="Ecom" />
        <TabItem to="/profile" icon={<User size={20} />} label="You" />
      </div>
    </>
  )
}