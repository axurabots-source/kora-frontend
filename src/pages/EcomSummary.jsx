import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, Package, RefreshCw } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

const fmt = n => 'PKR ' + (n || 0).toLocaleString()

export default function EcomSummary() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => { if (profile) fetchBusinesses() }, [profile])
  useEffect(() => { if (selectedBusiness) fetchStats() }, [selectedBusiness, period])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', profile.id)
    setBusinesses(data || [])
    if (data?.length > 0) setSelectedBusiness(data[0].id)
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/ecom/summary/${selectedBusiness}?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(data)
    } catch {
      // Use placeholder while backend is built
      setStats({
        total_sales: 0, total_profit: 0, total_orders: 0,
        cod_pending: 0, return_rate: 0, avg_order_value: 0,
        web_sales: 0, whatsapp_sales: 0,
        weekly: [],
      })
    }
    setLoading(false)
  }

  const platformData = [
    { name: 'WooCommerce', value: stats?.web_sales || 0 },
    { name: 'WhatsApp', value: stats?.whatsapp_sales || 0 },
  ]
  const COLORS = ['#60a5fa', '#4ade80']

  const topStats = [
    { label: 'Total Sales', value: fmt(stats?.total_sales), color: 'var(--text)', icon: '💰', sub: `${stats?.total_orders || 0} orders` },
    { label: 'Net Profit', value: fmt(stats?.total_profit), color: 'var(--green-light)', icon: '📈', sub: 'Revenue - Cost - Courier' },
    { label: 'COD Pending', value: fmt(stats?.cod_pending), color: 'var(--yellow-light)', icon: '🕐', sub: 'Not yet collected' },
    { label: 'Return Rate', value: `${stats?.return_rate || 0}%`, color: 'var(--red-light)', icon: '↩️', sub: 'Orders returned' },
    { label: 'Avg Order Value', value: fmt(stats?.avg_order_value), color: 'var(--blue)', icon: '🛒', sub: 'Per order average' },
    { label: 'WhatsApp Sales', value: fmt(stats?.whatsapp_sales), color: 'var(--green-light)', icon: '💬', sub: 'From WA orders' },
  ]

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ecom Finance</h1>
          <p className="page-subtitle">Sales, profit, and platform breakdown</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="tabs">
            {['week', 'month', '3month'].map(p => (
              <button key={p} className={`tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : '3 Months'}
              </button>
            ))}
          </div>
          <button onClick={fetchStats} className="btn btn-ghost btn-sm">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {topStats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div className="stat-label">{s.label}</div>
              <span style={{ fontSize: '18px' }}>{s.icon}</span>
            </div>
            <div className="stat-value" style={{ fontSize: '22px', color: s.color }}>
              {loading ? <div className="skeleton" style={{ height: '24px', width: '120px' }} /> : s.value}
            </div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Platform breakdown */}
        <div className="card">
          <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>
            Sales by Platform
          </p>
          {(stats?.web_sales || stats?.whatsapp_sales) ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                    {platformData.map((_, i) => <Cell key={i} fill={COLORS[i]} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text)' }}
                    formatter={v => ['PKR ' + v.toLocaleString()]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '8px' }}>
                {platformData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }} />
                    <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="empty-state-text">No sales data yet</p>
              <p className="empty-state-sub">Connect your store and sync orders first</p>
            </div>
          )}
        </div>

        {/* Weekly trend */}
        <div className="card">
          <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>
            Revenue Trend
          </p>
          {stats?.weekly?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.weekly} barSize={20}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text)' }}
                  formatter={v => ['PKR ' + v.toLocaleString()]}
                />
                <Bar dataKey="total" fill="#60a5fa" radius={[6, 6, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="empty-state-text">No trend data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Finance summary cards */}
      <div className="card">
        <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)', marginBottom: '20px' }}>Finance Bridge — Ecom → Khata</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)' }}>
          {[
            { label: 'Total Sales', value: fmt(stats?.total_sales), note: 'Revenue collected', color: 'var(--green-light)' },
            { label: 'Courier Fees', value: fmt(stats?.total_courier_fees || 0), note: 'Shipping costs paid', color: 'var(--red-light)' },
            { label: 'Product Cost', value: fmt(stats?.total_product_cost || 0), note: 'Cost of goods sold', color: 'var(--yellow-light)' },
            { label: 'Net Profit', value: fmt(stats?.total_profit), note: 'Sales - Cost - Courier', color: 'var(--blue)' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--bg2)', padding: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                {item.label}
              </p>
              <p style={{ fontSize: '20px', fontWeight: '800', color: item.color, letterSpacing: '-0.5px', marginBottom: '4px' }}>
                {loading ? <span className="skeleton" style={{ display: 'block', height: '24px', width: '100px' }} /> : item.value}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{item.note}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 0 4px', fontSize: '12px', color: 'var(--text3)' }}>
          💡 When orders are delivered, they auto-create income entries in your Khata. Courier bookings auto-create expense entries.
        </div>
      </div>
    </div>
  )
}
