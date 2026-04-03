import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, BookOpen, Users, Wallet, LogOut, 
  ShoppingCart, MessageSquare, BarChart2, User, Settings,
  Shield, Truck, Link2, Zap, ChevronRight, Menu
} from 'lucide-react'

// Desktop Professional Nav Item
const NavItem = ({ to, icon, label, end }) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `
        group flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden
        ${isActive 
          ? 'bg-bg3 text-white shadow-xl shadow-black/20 border border-white/5 font-black' 
          : 'text-text3 hover:text-white hover:bg-white/[0.03] font-bold'}
      `}
    >
      {({ isActive }) => (
        <>
          <span className={`transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? 'text-blue' : 'opacity-60 group-hover:opacity-100'}`}>
            {icon}
          </span>
          <span className="text-[11px] uppercase tracking-[0.1em]">{label}</span>
          {isActive && (
            <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-blue rounded-r-full animate-in slide-in-from-left-full duration-500" />
          )}
          <ChevronRight size={14} className={`ml-auto opacity-0 group-hover:opacity-40 transition-all ${isActive ? 'translate-x-0' : 'translate-x-[-10px]'}`} />
        </>
      )}
    </NavLink>
  )
}

// Mobile Tab Item (Bottom Bar)
const TabItem = ({ to, icon, label, end }) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `
        flex flex-col items-center justify-center gap-1.5 flex-1 py-1 transition-all
        ${isActive ? 'text-white' : 'text-text3'}
      `}
    >
      {({ isActive }) => (
        <>
          <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-bg3 shadow-lg shadow-black/40 border border-white/10' : ''}`}>
             <span className={isActive ? 'text-blue' : 'opacity-60'}>{icon}</span>
          </div>
          <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

const SectionLabel = ({ label }) => (
  <p className="text-[9px] font-black text-text3 uppercase tracking-[0.25em] px-5 mb-3 mt-8 opacity-40 select-none">
    {label}
  </p>
)

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  // Ensure any lingering light theme is aggressively wiped
  document.documentElement.removeAttribute('data-theme')

  const khataLinks = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Intelligence Hub', end: true },
    { to: '/ledger', icon: <BookOpen size={18} />, label: 'Master Ledger' },
    { to: '/cash', icon: <Wallet size={18} />, label: 'Liquidity Flow' },
    { to: '/parties', icon: <Users size={18} />, label: 'Relationship Mgr' },
  ]

  const ecomLinks = [
    { to: '/whatsapp', icon: <MessageSquare size={18} />, label: 'AI WA Parser' },
    { to: '/orders', icon: <ShoppingCart size={18} />, label: 'Order Cloud' },
    { to: '/shipment-queue', icon: <Truck size={18} />, label: 'Logistics Queue' },
    { to: '/ecom-summary', icon: <BarChart2 size={18} />, label: 'Ecom Analytics' },
    { to: '/store-connect', icon: <Link2 size={18} />, label: 'Sync Bridges' },
  ]

  const systemLinks = [
     { to: '/admin', icon: <Shield size={18} />, label: 'Root Control' },
  ]

  return (
    <>
      {/* Desktop Elite Sidebar */}
      <div className="hidden lg:flex w-72 h-screen fixed left-0 top-0 bg-bg border-r border-border flex-col z-[100] group/sidebar">
        {/* Brand Header */}
        <div className="p-8 pb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover/sidebar:opacity-[0.05] transition-opacity">
            <Zap size={120} strokeWidth={1} />
          </div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-xl bg-blue/10 flex items-center justify-center text-blue shadow-lg shadow-blue/5 border border-blue/20">
                <Zap size={16} fill="currentColor" />
             </div>
             <p className="text-2xl font-black text-white tracking-tighter">KORA<span className="text-blue">.</span></p>
          </div>
          <p className="text-[9px] font-black text-text3 uppercase tracking-[0.4em] ml-1 opacity-60">Operations OS</p>
        </div>

        {/* Navigation Scroll Area */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar space-y-1">
          <SectionLabel label="Financial Core" />
          {khataLinks.map(l => <NavItem key={l.to} {...l} />)}

          <SectionLabel label="Logistics & Automation" />
          {ecomLinks.map(l => <NavItem key={l.to} {...l} />)}

          {profile?.role === 'admin' && (
            <>
              <SectionLabel label="Infrastructure" />
              {systemLinks.map(l => <NavItem key={l.to} {...l} />)}
            </>
          )}
        </nav>

        {/* User / Logout Section */}
        <div className="p-6 bg-bg2/40 border-t border-border mt-auto backdrop-blur-sm group/user">
          <div className="flex items-center gap-4 bg-bg3/50 p-4 rounded-[1.5rem] border border-white/5 shadow-inner transition-all hover:bg-bg3 hover:border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover/user:scale-110 transition-transform">
                <User size={40} />
             </div>
             <div className="w-10 h-10 rounded-2xl bg-bg border border-border flex items-center justify-center text-sm font-black text-white shadow-xl relative z-10 overflow-hidden">
                {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'K'}
                <div className="absolute inset-0 bg-blue/10 animate-pulse" />
             </div>
             <div className="flex-1 min-w-0 relative z-10">
                <p className="text-xs font-black text-white tracking-tight truncate leading-none mb-1">{profile?.full_name || 'Authorized Seller'}</p>
                <button 
                  onClick={signOut} 
                  className="text-[9px] font-black uppercase tracking-widest text-red-light opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1.5"
                >
                  <LogOut size={10} strokeWidth={3} /> Terminate Session
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Elite Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-bg2/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-[1000] pb-safe shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <TabItem to="/" icon={<LayoutDashboard size={18} />} label="Intelligence" end />
        <TabItem to="/ledger" icon={<BookOpen size={18} />} label="Ledger" />
        <TabItem to="/orders" icon={<ShoppingCart size={18} />} label="Orders" />
        <TabItem to="/whatsapp" icon={<BarChart1 size={18} />} label="Automation" />
        <TabItem to="/admin" icon={<User size={18} />} label="Config" />
      </div>
    </>
  )
}

function BarChart1({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}