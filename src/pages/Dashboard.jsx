import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, RefreshCw, Users, ShoppingBag } from 'lucide-react'

const API = import.meta.env.VITE_API_URL
const fmt = n => 'PKR ' + (n || 0).toLocaleString()

// Reuseable Skeleton Component
const Skeleton = ({ width, height, style }) => (
  <div className="skeleton" style={{ width, height, borderRadius: '8px', ...style }} />
)

export default function Dashboard() {
  const { profile } = useAuth()
  const [summary, setSummary] = useState(null)
  const [balance, setBalance] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [recentEntries, setRecentEntries] = useState([])
  const [topParties, setTopParties] = useState([])
  
  // Individual loading states for better UX
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [loadingParties, setLoadingParties] = useState(true)

  useEffect(() => { if (profile) fetchBusinesses() }, [profile])

  useEffect(() => {
    if (selectedBusiness) {
      refreshAll()
    }
  }, [selectedBusiness])

  const refreshAll = () => {
    setLoadingStats(true)
    setLoadingEntries(true)
    setLoadingParties(true)
    
    // Fetch everything independently so fast APIs don't wait for slow ones
    fetchSummary()
    fetchBalance()
    fetchRecent()
    fetchTopParties()
  }

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', profile.id)
    setBusinesses(data || [])
    if (data?.length > 0) setSelectedBusiness(data[0].id)
  }

  const fetchSummary = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/ledger/${selectedBusiness}/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSummary(data)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchBalance = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/cash/${selectedBusiness}/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBalance(data)
    } finally {
      // Shared with summary for the main stat cards
    }
  }

  const fetchRecent = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/ledger/${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRecentEntries((data || []).slice(0, 5))
    } finally {
      setLoadingEntries(false)
    }
  }

  const fetchTopParties = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/parties/${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTopParties((data || []).slice(0, 5))
    } finally {
      setLoadingParties(false)
    }
  }

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
    <div className="page fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '28px', letterSpacing: '-0.8px' }}>
            {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},&nbsp;
            {(profile?.full_name || 'Seller').split(' ')[0]}
          </h1>
          <p className="page-subtitle" style={{ fontSize: '14px', color: 'var(--text3)' }}>Business performance overview</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={refreshAll} className="btn-icon" title="Refresh Dashboard">
            <RefreshCw size={16} className={loadingStats ? 'spin' : ''} />
          </button>
          {businesses.length > 1 && (
            <select
              value={selectedBusiness || ''}
              onChange={e => setSelectedBusiness(e.target.value)}
              className="input"
              style={{ width: 'auto', padding: '10px 16px', background: 'var(--bg2)', border: '1px solid var(--border)' }}
            >
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <Link to="/ledger">
            <button className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <Plus size={16} /> <span className="desktop-only">Add Entry</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Receivable (Lena Hai)', val: summary?.total_receivable, color: 'var(--green-light)', icon: <TrendingUp size={12}/>, badge: 'badge-green', tag: 'INCOMING' },
          { label: 'Payable (Dena Hai)', val: summary?.total_payable, color: 'var(--red-light)', icon: <TrendingDown size={12}/>, badge: 'badge-red', tag: 'OUTGOING' },
          { label: 'Cash in Hand', val: balance?.balance, color: 'var(--text)', icon: <Wallet size={12}/>, badge: 'badge-gray', tag: 'LIQUID' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="stat-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            {loadingStats ? (
              <Skeleton height="32px" width="70%" style={{ marginTop: '8px', marginBottom: '8px' }} />
            ) : (
              <div className="stat-value" style={{ color: s.color, fontSize: '28px', fontWeight: '800' }}>{fmt(s.val)}</div>
            )}
            <div className="stat-sub">
              {loadingStats ? <Skeleton height="16px" width="40%" /> : (
                <span className={`badge ${s.badge}`} style={{ fontSize: '10px', fontWeight: '700' }}>{s.icon} {s.tag}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Net Position Summary */}
      <div style={{
         background: isPositive ? 'rgba(74,222,128,0.02)' : 'rgba(248,113,113,0.02)',
         border: `1px solid ${isPositive ? 'var(--green-bg)' : 'var(--red-bg)'}`,
         borderRadius: '20px', padding: '32px', marginBottom: '32px',
         display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
           <p style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>ESTIMATED NET SURPLUS / DEBT</p>
           {loadingStats ? <Skeleton height="40px" width="240px" /> : (
             <h2 style={{ fontSize: '36px', fontWeight: '900', color: isPositive ? 'var(--green-light)' : 'var(--red-light)', letterSpacing: '-1.5px' }}>
               {isPositive ? '+' : ''}{fmt(net)}
             </h2>
           )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '14px', background: 'var(--bg2)', borderRadius: '14px', border: '1px solid var(--border)', color: isPositive ? 'var(--green-light)' : 'var(--red-light)' }}>
            {isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div style={{ padding: '12px 20px', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px' }}>
            {isPositive ? 'FINANCIAL HEALTH: OPTIMAL' : 'LIQUIDITY WARNING'}
          </div>
        </div>
      </div>

      {/* Main Charts - Only show when first data hits */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px' }}>
           <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '24px' }}>Business Composition</p>
           {loadingStats ? <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw className="spin" color="var(--border)" /></div> : (
             <ResponsiveContainer width="100%" height={200}>
               <PieChart>
                 <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={4}>
                   {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} strokeWidth={0} />)}
                 </Pie>
                 <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)' }} formatter={v => [fmt(v)]} />
               </PieChart>
             </ResponsiveContainer>
           )}
           <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
             {pieData.map((item, i) => (
               <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i] }} />
                 <span style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: '600' }}>{item.name}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
           <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '24px' }}>Cash Flow Comparison</p>
           {loadingStats ? <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw className="spin" color="var(--border)" /></div> : (
             <ResponsiveContainer width="100%" height={220}>
               <BarChart data={barData} barSize={32}>
                 <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                 <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '12px' }} formatter={v => [fmt(v)]} />
                 <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                   {barData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.9} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           )}
        </div>
      </div>

      {/* Detailed Lists */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ padding: '8px', background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', borderRadius: '8px' }}><ShoppingBag size={14}/></div>
               <p style={{ fontSize: '14px', fontWeight: '700' }}>Recent Activity</p>
            </div>
            <Link to="/ledger" className="btn-text">View all <ArrowRight size={14} /></Link>
          </div>
          
          {loadingEntries ? (
            [1,2,3].map(i => <Skeleton key={i} height="52px" style={{ marginBottom: '8px' }} />)
          ) : recentEntries.length === 0 ? (
            <div className="empty-state">No entries yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentEntries.map(e => (
                <div key={e.id} className="list-item" style={{ background: 'var(--bg3)', border: '1px solid var(--border2)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600' }}>{e.parties?.name || 'Cash Entry'}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{new Date(e.entry_date).toLocaleDateString()}</p>
                  </div>
                  <span style={{ fontWeight: '800', color: e.entry_type === 'receivable' ? 'var(--green-light)' : 'var(--red-light)' }}>
                    {e.entry_type === 'receivable' ? '+' : '-'}{parseFloat(e.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ padding: '8px', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', borderRadius: '8px' }}><Users size={14}/></div>
               <p style={{ fontSize: '14px', fontWeight: '700' }}>Key Contacts</p>
            </div>
            <Link to="/parties" className="btn-text">Manage <ArrowRight size={14} /></Link>
          </div>

          {loadingParties ? (
             [1,2,3].map(i => <Skeleton key={i} height="52px" style={{ marginBottom: '8px' }} />)
          ) : topParties.length === 0 ? (
            <div className="empty-state">No parties yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topParties.map(p => (
                <div key={p.id} className="list-item" style={{ background: 'var(--bg3)', border: '1px solid var(--border2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900' }}>
                      {p.name?.[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600' }}>{p.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{p.type.toUpperCase()}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--border)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}