import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { RefreshCw, Search, Eye, Package, X, Edit2 } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

const STATUS_META = {
  pending:    { label: 'Pending',    badge: 'badge-yellow', emoji: '🕐' },
  processing: { label: 'Processing', badge: 'badge-blue',   emoji: '⚙️' },
  shipped:    { label: 'Shipped',    badge: 'badge-purple',  emoji: '🚚' },
  delivered:  { label: 'Delivered',  badge: 'badge-green',  emoji: '✅' },
  returned:   { label: 'Returned',   badge: 'badge-red',    emoji: '↩️' },
  cancelled:  { label: 'Cancelled',  badge: 'badge-gray',   emoji: '❌' },
}

export default function Orders() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [filtered, setFiltered] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingAddress, setEditingAddress] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (profile) fetchBusinesses() }, [profile])
  useEffect(() => { if (selectedBusiness) fetchOrders() }, [selectedBusiness])
  useEffect(() => { applyFilters() }, [orders, statusFilter, search])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', profile.id)
    setBusinesses(data || [])
    if (data?.length > 0) setSelectedBusiness(data[0].id)
  }

  const fetchOrders = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/woocommerce/orders/${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(data || [])
    } catch {
      setOrders([])
    }
  }

  const applyFilters = () => {
    let f = [...orders]
    if (statusFilter !== 'all') f = f.filter(o => o.status === statusFilter)
    if (search) f = f.filter(o =>
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.external_order_id).includes(search) ||
      o.phone?.includes(search)
    )
    setFiltered(f)
  }

  const syncNow = async () => {
    setSyncing(true)
    try {
      const token = await getToken()
      await axios.post(`${API}/api/woocommerce/sync/${selectedBusiness}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Orders synced!')
      fetchOrders()
    } catch {
      toast.error('Sync failed — check store connection')
    }
    setSyncing(false)
  }

  const cancelOrder = async (order) => {
    if (!confirm('Cancel this order in WooCommerce?')) return
    const token = await getToken()
    try {
      await axios.post(`${API}/api/woocommerce/cancel/${order.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Order cancelled')
      fetchOrders()
      setSelectedOrder(null)
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  const pushToShipment = async (order) => {
    const token = await getToken()
    try {
      await axios.post(`${API}/api/woocommerce/push-shipment/${order.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Pushed to shipment queue!')
      setSelectedOrder(null)
    } catch {
      toast.error('Failed to push to shipment')
    }
  }

  const counts = Object.keys(STATUS_META).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div className="page fade-in">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: '13px' }
      }} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orders.length} orders from WooCommerce</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={syncNow} disabled={syncing} className="btn btn-ghost btn-sm">
            <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius)',
              background: statusFilter === key ? 'var(--bg3)' : 'var(--bg2)',
              border: `1px solid ${statusFilter === key ? 'var(--border2)' : 'var(--border)'}`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{meta.emoji}</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.5px' }}>
              {counts[key] || 0}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {meta.label}
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="tabs">
          <button className={`tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
            All ({orders.length})
          </button>
          {['pending', 'processing', 'shipped'].map(s => (
            <button key={s} className={`tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {STATUS_META[s].label} ({counts[s] || 0})
            </button>
          ))}
        </div>
        <div className="search-bar">
          <Search size={13} color="var(--text3)" />
          <input
            placeholder="Search by name, order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Platform</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => {
              const meta = STATUS_META[order.status] || STATUS_META.pending
              return (
                <tr key={order.id}>
                  <td style={{ fontWeight: '700', color: 'var(--text)', fontFamily: 'monospace' }}>
                    #{order.external_order_id || order.id?.slice(0, 8)}
                  </td>
                  <td style={{ color: 'var(--text)', fontWeight: '500' }}>
                    {order.customer_name}
                    {order.phone && <span style={{ display: 'block', fontSize: '11px', color: 'var(--text3)' }}>{order.phone}</span>}
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--text)', fontFamily: 'monospace' }}>
                    PKR {parseFloat(order.total || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${meta.badge}`}>{meta.emoji} {meta.label}</span>
                  </td>
                  <td>
                    <span className={`badge ${order.platform === 'whatsapp' ? 'badge-green' : 'badge-blue'}`}>
                      {order.platform === 'whatsapp' ? '💬 WhatsApp' : '🌐 Web'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text3)' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button onClick={() => setSelectedOrder(order)} className="btn btn-ghost btn-sm">
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">🛒</div>
                  <p className="empty-state-text">No orders yet</p>
                  <p className="empty-state-sub">Connect your WooCommerce store and sync orders</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div className="modal" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <p style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text)', letterSpacing: '-0.5px' }}>
                  Order #{selectedOrder.external_order_id}
                </p>
                <span className={`badge ${STATUS_META[selectedOrder.status]?.badge || 'badge-gray'}`}>
                  {STATUS_META[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {/* Customer info */}
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Customer</p>
              <p style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>{selectedOrder.customer_name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '2px' }}>{selectedOrder.phone}</p>
              {editingAddress ? (
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    className="input"
                    rows={2}
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button onClick={() => setEditingAddress(false)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>Save Address</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text2)', flex: 1 }}>{selectedOrder.address || 'No address'}</p>
                  <button onClick={() => { setEditingAddress(true); setNewAddress(selectedOrder.address || '') }}
                    className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', marginLeft: '8px' }}>
                    <Edit2 size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Items</p>
              {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text)' }}>{item.name} × {item.quantity}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', fontFamily: 'monospace' }}>
                    PKR {parseFloat(item.price * item.quantity || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text)' }}>Total</span>
                <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text)', fontFamily: 'monospace' }}>
                  PKR {parseFloat(selectedOrder.total || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => pushToShipment(selectedOrder)} className="btn btn-primary" style={{ flex: 1 }}>
                <Package size={13} /> Push to Shipment
              </button>
              <button onClick={() => cancelOrder(selectedOrder)} className="btn btn-danger">
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
