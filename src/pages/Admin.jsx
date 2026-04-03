import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Shield, Users, BookOpen, Ban, CheckCircle, Lock, Unlock, UserCheck, Activity, Search, Calendar } from 'lucide-react'

// Professional Services & Utils
import { adminService } from '../services/api.service'

export default function Admin() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { 
    if (profile?.role === 'admin') {
      fetchData() 
    }
  }, [profile])

  useEffect(() => {
    if (users.length > 0) {
      const s = search.toLowerCase()
      setFilteredUsers(users.filter(u => 
        u.full_name?.toLowerCase().includes(s) || 
        u.phone?.includes(s) ||
        u.email?.toLowerCase().includes(s)
      ))
    }
  }, [search, users])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [u, s] = await Promise.all([
        adminService.listUsers(),
        adminService.getStats()
      ])
      setUsers(u)
      setStats(s)
    } catch { 
      toast.error('Failed to load administrative data') 
    } finally {
      setLoading(false)
    }
  }

  const toggleBlockStatus = async (user) => {
    try {
      if (user.is_blocked) {
        await adminService.unblockUser(user.id)
        toast.success(`User access restored: ${user.full_name || 'Anonymous'}`)
      } else {
        await adminService.blockUser(user.id)
        toast.error(`User access revoked: ${user.full_name || 'Anonymous'}`)
      }
      fetchData()
    } catch {
      toast.error('Operation failed')
    }
  }

  if (profile?.role !== 'admin') return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-bg2 border border-border rounded-[2.5rem] flex items-center justify-center text-red-light mb-6 shadow-2xl">
        <Lock size={32} strokeWidth={2.5} />
      </div>
      <h2 className="text-2xl font-black text-white tracking-tight mb-2">Restricted Matrix</h2>
      <p className="text-sm text-text3 font-extrabold uppercase tracking-widest opacity-60">Administrative clearance required for entry</p>
    </div>
  )

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Root Administration</h1>
          <p className="text-sm text-text2 uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
            <Shield size={14} className="text-blue animate-pulse" /> Platform oversight & user authorization
          </p>
        </div>
      </div>

      {/* Global Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { icon: <Users size={18} />, label: 'Aggregate Users', value: stats?.total_users || 0, color: 'text-white', bg: 'bg-bg2' },
          { icon: <BookOpen size={18} />, label: 'Ledger Velocity', value: stats?.total_ledger_entries || 0, color: 'text-blue', bg: 'bg-bg2' },
          { icon: <Activity size={18} />, label: 'Cash Liquidity Flow', value: stats?.total_cash_entries || 0, color: 'text-green-light', bg: 'bg-bg2' },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} border border-border p-8 rounded-[2.5rem] relative overflow-hidden shadow-sm group`}>
             <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-text3 uppercase tracking-[0.2em]">{card.label}</span>
                <div className={`w-10 h-10 rounded-2xl bg-bg flex items-center justify-center border border-border transition-all group-hover:scale-110 ${card.color}`}>
                   {card.icon}
                </div>
             </div>
             <div className={`text-3xl font-black tracking-tighter ${card.color}`}>
                {loading ? <div className="h-10 w-24 bg-white/5 animate-pulse rounded-xl" /> : card.value.toLocaleString()}
             </div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 group-hover:bg-blue/20 transition-all" />
          </div>
        ))}
      </div>

      {/* User Management Hub */}
      <div className="bg-bg2 border border-border rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="p-8 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-bg3 flex items-center justify-center text-white border border-border/50">
                 <UserCheck size={20} />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">User Authorization Registry</h3>
           </div>
           
           <div className="relative group flex-1 max-w-sm">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 group-focus-within:text-white transition-colors" size={16} />
             <input
               className="w-full h-11 bg-bg3 border border-border rounded-2xl pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 ring-white/5 transition-all text-white placeholder:text-text3/50"
               placeholder="Filter by name, phone or email..."
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/40 border-b border-border">
                {['MEMBER', 'CONTACT', 'AUTHORITY', 'AUTH STATUS', 'REGISTRY DATE', 'ACTION'].map(h => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black tracking-widest text-text3 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group/row">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-bg flex items-center justify-center text-sm font-black text-text2 border border-border group-hover/row:border-blue/30 transition-all">
                          {user.full_name?.[0]?.toUpperCase() || 'U'}
                       </div>
                       <p className="text-sm font-black text-white tracking-tight">{user.full_name || 'Anonymous User'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-text2 tabular-nums">{user.phone || '—'}</p>
                    <p className="text-[10px] text-text3 font-extrabold uppercase tracking-widest mt-0.5 opacity-60">Primary Terminal</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      user.role === 'admin' ? 'bg-blue-bg border-blue/20 text-blue' : 'bg-bg3 border-border text-text2'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      user.is_blocked ? 'bg-red-bg border-red-light/20 text-red-light' : 'bg-green-bg border-green-light/20 text-green-light'
                    }`}>
                      {user.is_blocked ? 'Access Revoked' : 'Clearance Active'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text3 uppercase tracking-wider">
                       <Calendar size={12} className="opacity-40" />
                       {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => toggleBlockStatus(user)} 
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm ${
                        user.is_blocked 
                          ? 'bg-white text-black hover:bg-green-light hover:border-green-light' 
                          : 'bg-bg border-border text-text3 hover:text-red-light hover:border-red-light/30'
                      }`}
                    >
                      {user.is_blocked ? <Unlock size={12} /> : <Ban size={12} />}
                      {user.is_blocked ? 'Authorize' : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
              
              {loading && Array(3).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-8 py-6">
                    <div className="h-10 bg-white/5 rounded-[1.5rem]" />
                  </td>
                </tr>
              ))}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="inline-flex w-16 h-16 bg-bg3 rounded-[2rem] items-center justify-center text-4xl mb-6 shadow-inner opacity-40 grayscale">🚫</div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 tracking-tighter">No Access Matches Found</h3>
                    <p className="text-xs text-text3 font-bold opacity-60 italic">Modify your authorization filters or check user credentials.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Statistics Disclaimer */}
        <div className="p-6 bg-blue/5 border-t border-border flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Info size={14} className="text-blue" />
              <p className="text-[10px] font-extrabold text-text3 uppercase tracking-[0.1em] opacity-80">
                Administrative metrics are updated in real-time across all global node clusters.
              </p>
           </div>
           <p className="text-[10px] font-black text-blue/40 uppercase tabular-nums">SECURED BY SUPABASE RBAC</p>
        </div>
      </div>
    </div>
  )
}

function Info({ size, className }) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}