import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, RefreshCw } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

const fmt = n => 'PKR ' + (n || 0).toLocaleString()

export default function Dashboard() {
  const { profile } = useAuth()
  const [summary, setSummary] = useState(null)
  const [balance, setBalance] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [recentEntries, setRecentEntries] = useState([])
  const [topParties, setTopParties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) fetchBusinesses() }, [profile])
  useEffect(() => {
    if (selectedBusiness) {
      setLoading(true)
      Promise.all([fetchSummary(), fetchBalance(), fetchRecent(), fetchTopParties()])
        .finally(() => setLoading(false))
    }
  }, [selectedBusiness])

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
    } catch {}
  }

  const fetchBalance = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/cash/${selectedBusiness}/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBalance(data)
    } catch {}
  }

  const fetchRecent = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/ledger/${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRecentEntries((data || []).slice(0, 5))
    } catch {}
  }

  const fetchTopParties = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/parties/${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTopParties((data || []).slice(0, 5))
    } catch {}
  }

  const net = (summary?.total_receivable || 0) - (summary?.total_payable || 0)
  const isPositive = net >= 0

  const pieData = [
    { name: 'Receivable', value: summary?.total_receivable || 0 },
    { name: 'Payable', value: summary?.total_payable || 0 },
    { name: 'Cash', value: balance?.balance || 0 },
  ]
  const PIE_COLORS = ['#4ade80', '#f87171', '#888888']

  const barData = [
    { name: 'Cash In', value: balance?.total_in || 0, fill: '#4ade80' },
    { name: 'Cash Out', value: balance?.total_out || 0, fill: '#f87171' },
    { name: 'Receivable', value: summary?.total_receivable || 0, fill: '#60a5fa' },
    { name: 'Payable', value: summary?.total_payable || 0, fill: '#a78bfa' },
  ]

  if (loading && !summary) {
    return (
      <div className="page">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="stat-card" style={{ height: '100px' }}>
              <div className="skeleton" style={{ height: '12px', width: '60px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '28px', width: '120px' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},&nbsp;
            {(profile?.full_name || 'Seller').split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">Here's your business snapshot for today</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {businesses.length > 1 && (
            <select
              value={selectedBusiness || ''}
              onChange={e => setSelectedBusiness(e.target.value)}
              className="input"
              style={{ width: 'auto', padding: '8px 12px' }}
            >
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <Link to="/ledger">
            <button className="btn btn-primary" id="dash-add-entry">
              <Plus size={14} /> Add Entry
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Receivable (Lena Hai)</div>
          <div className="stat-value" style={{ color: 'var(--green-light)' }}>
            {fmt(summary?.total_receivable)}
          </div>
          <div className="stat-sub">
            <span className="badge badge-green"><TrendingUp size={9} /> Incoming</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Payable (Dena Hai)</div>
          <div className="stat-value" style={{ color: 'var(--red-light)' }}>
            {fmt(summary?.total_payable)}
          </div>
          <div className="stat-sub">
            <span className="badge badge-red"><TrendingDown size={9} /> Outgoing</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Cash in Hand</div>
          <div className="stat-value">{fmt(balance?.balance)}</div>
          <div className="stat-sub">
            <span className="badge badge-gray"><Wallet size={9} /> Available</span>
          </div>
        </div>
      </div>

      {/* Net Position Banner */}
      <div style={{
        background: isPositive ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `1px solid ${isPositive ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'}`,
        borderRadius: 'var(--radius)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: isPositive ? 'var(--green-light)' : 'var(--red-light)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
            Net Position
          </p>
          <p style={{ fontSize: '28px', fontWeight: '800', color: isPositive ? 'var(--green-light)' : 'var(--red-light)', letterSpacing: '-1px' }}>
            {isPositive ? '+' : ''}{fmt(net)}
          </p>
        </div>
        <div style={{ fontSize: '32px' }}>{isPositive ? '📈' : '📉'}</div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Pie Chart */}
        <div className="card">
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px' }}>Balance Overview</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                dataKey="value"
                paddingAngle={3}
              >
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} strokeWidth={0} />)}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text)',
                }}
                formatter={v => ['PKR ' + v.toLocaleString()]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
            {pieData.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: PIE_COLORS[i], flexShrink: 0 }} />
                <span style={{ color: 'var(--text2)', fontSize: '11px' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card">
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px' }}>Cash Flow Summary</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={28}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text)',
                }}
                formatter={v => ['PKR ' + v.toLocaleString()]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Recent Entries */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Recent Entries</p>
            <Link to="/ledger" style={{ fontSize: '12px', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {recentEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p className="empty-state-text">No entries yet</p>
              <p className="empty-state-sub">Add your first ledger entry</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {recentEntries.map(e => (
                <div key={e.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg3)',
                }}>
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>
                      {e.parties?.name || 'General'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{e.entry_date}</p>
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: e.entry_type === 'receivable' ? 'var(--green-light)' : 'var(--red-light)'
                  }}>
                    {e.entry_type === 'receivable' ? '+' : '-'}PKR {parseFloat(e.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Parties */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Parties</p>
            <Link to="/parties" style={{ fontSize: '12px', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {topParties.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p className="empty-state-text">No parties yet</p>
              <p className="empty-state-sub">Add customers and suppliers</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {topParties.map(p => (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'var(--bg4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: 'var(--text2)',
                      flexShrink: 0,
                    }}>
                      {p.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{p.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{p.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <span className={`badge ${p.type === 'customer' ? 'badge-green' : 'badge-red'}`}>
                    {p.type === 'customer' ? 'Customer' : 'Supplier'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}