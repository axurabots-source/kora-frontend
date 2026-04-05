import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, RefreshCw, Users, ShoppingBag } from 'lucide-react'

// Professional Services & Utils
import { ledgerService, cashService, partyService, businessService } from '../services/api.service'
import { fmtCurrency, fmtDate, getTimeGreeting } from '../utils/formatters'

// Reusable Components
const Skeleton = ({ className }) => (
  <div className={`bg-bg3 animate-pulse rounded-lg ${className}`} />
)

export default function Dashboard() {
  const { profile, user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [balance, setBalance] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [recentEntries, setRecentEntries] = useState([])
  const [topParties, setTopParties] = useState([])

  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [loadingParties, setLoadingParties] = useState(true)

  useEffect(() => {
    if (profile) {
      businessService.list(profile.id).then(data => {
        setBusinesses(data)
        if (data.length > 0) setSelectedBusiness(data[0].id)
      })
    }
  }, [profile])

  useEffect(() => {
    if (selectedBusiness) refreshAll()
  }, [selectedBusiness])

  const refreshAll = () => {
    setLoadingStats(true)
    setLoadingEntries(true)
    setLoadingParties(true)

    // Core summary & balance
    Promise.all([
      ledgerService.getSummary(selectedBusiness),
      cashService.getBalance(selectedBusiness)
    ]).then(([s, b]) => {
      setSummary(s)
      setBalance(b)
      setLoadingStats(false)
    })

    // Lists
    ledgerService.getRecent(selectedBusiness).then(data => {
      setRecentEntries(data)
      setLoadingEntries(false)
    })

    partyService.getTop(selectedBusiness).then(data => {
      setTopParties(data)
      setLoadingParties(false)
    })
  }

  const greeting = useMemo(() => {
    const msgs = [
      "Ready to build your empire", 
      "All systems are optimal", 
      "Let's crush today's goals", 
      "Intelligence loaded", 
      "Welcome back to command",
      "Ready for another productive day"
    ]
    return msgs[Math.floor(Math.random() * msgs.length)]
  }, [])

  const net = (summary?.total_receivable || 0) - (summary?.total_payable || 0)
  const isPositive = net >= 0

  const pieData = [
    { name: 'Receivable', value: summary?.total_receivable || 0 },
    { name: 'Payable', value: summary?.total_payable || 0 },
    { name: 'Cash', value: balance?.balance || 0 },
  ]
  const PIE_COLORS = ['#4ade80', '#f87171', '#60a5fa']

  const barData = [
    { name: 'In', value: balance?.total_in || 0, fill: '#4ade80' },
    { name: 'Out', value: balance?.total_out || 0, fill: '#f87171' },
    { name: 'Lena', value: summary?.total_receivable || 0, fill: '#60a5fa' },
    { name: 'Dena', value: summary?.total_payable || 0, fill: '#a78bfa' },
  ]

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-0.5">
            {greeting}, {(profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Seller')}
          </h1>
          <p className="text-sm text-text2">Professional business performance overview</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshAll}
            className="p-2.5 rounded-xl hover:bg-bg2 transition-colors border border-transparent hover:border-border text-text2 hover:text-white"
            title="Refresh Dashboard"
          >
            <RefreshCw size={18} className={loadingStats ? 'animate-spin' : ''} />
          </button>

          {businesses.length > 1 && (
            <select
              value={selectedBusiness || ''}
              onChange={e => setSelectedBusiness(e.target.value)}
              className="bg-bg2 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 ring-white/5"
            >
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}

          <Link to="/ledger">
            <button className="bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Plus size={18} />
              <span className="hidden md:inline">Add Entry</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Receivable (Lena Hai)', val: summary?.total_receivable, color: 'text-green-light', icon: <TrendingUp size={12} />, badge: 'text-green-light bg-green-light/10', tag: 'INCOMING' },
          { label: 'Payable (Dena Hai)', val: summary?.total_payable, color: 'text-red-light', icon: <TrendingDown size={12} />, badge: 'text-red-light bg-red-light/10', tag: 'OUTGOING' },
          { label: 'Cash in Hand', val: balance?.balance, color: 'text-white', icon: <Wallet size={12} />, badge: 'text-text2 bg-bg3', tag: 'LIQUID' },
        ].map((s, i) => (
          <div key={i} className="bg-bg2 border border-border p-6 rounded-2xl flex flex-col gap-2 group hover:border-text3/30 transition-colors">
            <div className="text-[10px] uppercase tracking-widest font-black text-text2 opacity-80">{s.label}</div>
            {loadingStats ? (
              <Skeleton className="h-9 w-3/4 my-1" />
            ) : (
              <div className={`text-3xl font-extrabold tracking-tighter ${s.color}`}>{fmtCurrency(s.val)}</div>
            )}
            <div className="mt-1">
              {loadingStats ? <Skeleton className="h-5 w-1/3" /> : (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${s.badge}`}>
                  {s.icon} {s.tag}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* High-Level Net Position */}
      <div className={`p-8 border rounded-3xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors ${isPositive ? 'bg-green-light/[0.02] border-green-light/20' : 'bg-red-light/[0.02] border-red-light/20'
        }`}>
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase text-text3 mb-2">Estimated Net Surplus / Debt</p>
          {loadingStats ? <Skeleton className="h-10 w-60" /> : (
            <h2 className={`text-4xl font-black tracking-tighter ${isPositive ? 'text-green-light' : 'text-red-light'}`}>
              {isPositive ? '+' : ''}{fmtCurrency(net)}
            </h2>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className={`p-4 bg-bg2 rounded-2xl border border-border ${isPositive ? 'text-green-light' : 'text-red-light'}`}>
            {isPositive ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
          </div>
          <div className="px-5 py-3 bg-bg2 rounded-xl border border-border text-[11px] font-black tracking-wider shadow-sm">
            {isPositive ? 'FINANCIAL HEALTH: OPTIMAL' : 'LIQUIDITY WARNING'}
          </div>
        </div>
      </div>

      {/* Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-bg2 border border-border p-8 rounded-3xl">
          <div className="text-sm font-extrabold mb-8 flex items-center gap-2">
            <div className="w-1 h-3 bg-blue rounded-full" />
            Business Composition
          </div>
          {loadingStats ? (
            <div className="h-[200px] flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-bg3" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={4}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} strokeWidth={0} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={v => [fmtCurrency(v)]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-text2 text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg2 border border-border p-8 rounded-3xl">
          <div className="text-sm font-extrabold mb-8 flex items-center gap-2">
            <div className="w-1 h-3 bg-purple-500 rounded-full" />
            Cash Flow Comparison
          </div>
          {loadingStats ? (
            <div className="h-[220px] flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-bg3" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={32}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#444', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
                  formatter={v => [fmtCurrency(v)]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.9} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Activity Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-bg2 border border-border p-8 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-bg text-blue rounded-lg"><ShoppingBag size={14} /></div>
              <p className="text-sm font-extrabold">Recent Activity</p>
            </div>
            <Link to="/ledger" className="text-[11px] font-bold text-text2 hover:text-white flex items-center gap-1 transition-colors">
              VIEW ALL <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {loadingEntries ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)
            ) : recentEntries.length === 0 ? (
              <div className="p-10 border border-dashed border-border rounded-2xl text-center text-[11px] font-bold text-text3/50 uppercase tracking-widest">No entries yet</div>
            ) : recentEntries.map(e => (
              <div key={e.id} className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-transparent hover:border-border transition-all hover:translate-x-1 group">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${e.entry_type === 'receivable' ? 'bg-green-bg text-green-light' : 'bg-red-bg text-red-light'
                    }`}>
                    {e.entry_type === 'receivable' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold tracking-tight text-white mb-0.5">{e.parties?.name || 'Manual Entry'}</p>
                    <p className="text-[10px] text-text2 font-bold uppercase tracking-wider">{fmtDate(e.entry_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black tracking-tight ${e.entry_type === 'receivable' ? 'text-green-light' : 'text-red-light'
                    }`}>
                    {e.entry_type === 'receivable' ? '+' : '-'}{parseFloat(e.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg2 border border-border p-8 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Users size={14} /></div>
              <p className="text-sm font-extrabold">Key Contacts</p>
            </div>
            <Link to="/parties" className="text-[11px] font-bold text-text2 hover:text-white flex items-center gap-1 transition-colors">
              MANAGE <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {loadingParties ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)
            ) : topParties.length === 0 ? (
              <div className="p-10 border border-dashed border-border rounded-2xl text-center text-[11px] font-bold text-text3/50 uppercase tracking-widest">No parties yet</div>
            ) : topParties.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-bg3 border border-border2 rounded-2xl group hover:border-text3/30 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-bg4 flex items-center justify-center text-[11px] font-black text-white ring-1 ring-white/5">
                    {p.name?.[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white mb-0.5">{p.name}</p>
                    <p className="text-[10px] text-text3 font-extrabold uppercase tracking-widest">{p.type}</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-border group-hover:text-text3 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}