import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Package, Printer, Edit2, Search, Truck, ChevronRight } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

const PIPELINE = ['Pending Booking', 'Booked', 'In Transit', 'Delivered', 'Returned']

const STATUS_META = {
  pending_booking: { label: 'Pending Booking', badge: 'badge-yellow', step: 0 },
  booked:          { label: 'Booked',           badge: 'badge-blue',   step: 1 },
  in_transit:      { label: 'In Transit',       badge: 'badge-purple', step: 2 },
  delivered:       { label: 'Delivered',        badge: 'badge-green',  step: 3 },
  returned:        { label: 'Returned',         badge: 'badge-red',    step: 4 },
}

export default function ShipmentQueue() {
  const { profile } = useAuth()
  const [shipments, setShipments] = useState([])
  const [filtered, setFiltered] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [bookingForm, setBookingForm] = useState({ weight: '', courier: 'postex', notes: '' })
  const [booking, setBooking] = useState(false)

  useEffect(() => { if (profile) fetchBusinesses() }, [profile])
  useEffect(() => { if (selectedBusiness) fetchShipments() }, [selectedBusiness])
  useEffect(() => { applyFilters() }, [shipments, statusFilter, search])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', profile.id)
    setBusinesses(data || [])
    if (data?.length > 0) setSelectedBusiness(data[0].id)
  }

  const fetchShipments = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/shipments/${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShipments(data || [])
    } catch { setShipments([]) }
  }

  const applyFilters = () => {
    let f = [...shipments]
    if (statusFilter !== 'all') f = f.filter(s => s.status === statusFilter)
    if (search) f = f.filter(s =>
      s.orders?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.tracking_number?.includes(search)
    )
    setFiltered(f)
  }

  const bookCourier = async () => {
    if (!bookingForm.weight) return toast.error('Enter package weight')
    setBooking(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(`${API}/api/postex/book`, {
        shipment_id: selectedShipment.id,
        ...bookingForm,
      }, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(`✅ Booked! Tracking: ${data.tracking_number}`)
      fetchShipments()
      setSelectedShipment(null)
    } catch {
      toast.error('Booking failed — check PostEx credentials in settings')
    }
    setBooking(false)
  }

  const downloadLabel = async (shipment) => {
    if (!shipment.label_url) return toast.error('Label not available yet')
    window.open(shipment.label_url, '_blank')
  }

  const counts = Object.keys(STATUS_META).reduce((acc, s) => {
    acc[s] = shipments.filter(sh => sh.status === s).length
    return acc
  }, {})

  return (
    <div className="page fade-in">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: '13px' }
      }} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Shipment Queue</h1>
          <p className="page-subtitle">{shipments.length} shipments — WooCommerce + WhatsApp</p>
        </div>
      </div>

      {/* Status pipeline counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            style={{
              padding: '14px 12px',
              borderRadius: 'var(--radius)',
              background: statusFilter === key ? 'var(--bg3)' : 'var(--bg2)',
              border: `1px solid ${statusFilter === key ? 'var(--border2)' : 'var(--border)'}`,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.5px' }}>
              {counts[key] || 0}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
              {meta.label}
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="tabs">
          <button className={`tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
            All ({shipments.length})
          </button>
          <button className={`tab ${statusFilter === 'pending_booking' ? 'active' : ''}`} onClick={() => setStatusFilter('pending_booking')}>
            📋 To Book ({counts.pending_booking || 0})
          </button>
        </div>
        <div className="search-bar">
          <Search size={13} color="var(--text3)" />
          <input
            placeholder="Search customer or tracking..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Shipments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(shipment => {
          const meta = STATUS_META[shipment.status] || STATUS_META.pending_booking
          const order = shipment.orders || {}
          return (
            <div
              key={shipment.id}
              className="card"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}
              onClick={() => setSelectedShipment(shipment)}
            >
              {/* Icon */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Package size={18} color="var(--text2)" />
              </div>

              {/* Customer info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>
                  {order.customer_name || 'Unknown Customer'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {order.address || 'No address'} · {order.phone || ''}
                </p>
              </div>

              {/* Tracking */}
              {shipment.tracking_number && (
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <p style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '2px' }}>Tracking</p>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--blue)', fontFamily: 'monospace' }}>
                    {shipment.tracking_number}
                  </p>
                </div>
              )}

              {/* Amount */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)', fontFamily: 'monospace' }}>
                  PKR {parseFloat(order.total || 0).toLocaleString()}
                </p>
                <span className={`badge ${meta.badge}`}>{meta.label}</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                {shipment.label_url && (
                  <button onClick={() => downloadLabel(shipment)} className="btn btn-ghost btn-sm" title="Print Label">
                    <Printer size={13} />
                  </button>
                )}
                <ChevronRight size={16} color="var(--text3)" />
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div className="empty-state-icon">📦</div>
            <p className="empty-state-text">No shipments here</p>
            <p className="empty-state-sub">Orders will appear here after you push them from the Orders page</p>
          </div>
        )}
      </div>

      {/* Book Courier Modal */}
      {selectedShipment && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedShipment(null)}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ fontWeight: '800', fontSize: '17px', color: 'var(--text)' }}>Book Courier</p>
              <button onClick={() => setSelectedShipment(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {/* Order summary */}
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '20px' }}>
              <p style={{ fontWeight: '600', color: 'var(--text)' }}>{selectedShipment.orders?.customer_name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{selectedShipment.orders?.address}</p>
              <p style={{ fontSize: '12px', color: 'var(--text2)' }}>{selectedShipment.orders?.phone}</p>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginTop: '8px', fontFamily: 'monospace' }}>
                PKR {parseFloat(selectedShipment.orders?.total || 0).toLocaleString()}
              </p>
            </div>

            {/* Pipeline status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '20px', overflowX: 'auto' }}>
              {PIPELINE.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '10px',
                    fontWeight: '600',
                    background: i <= (STATUS_META[selectedShipment.status]?.step || 0) ? 'var(--bg3)' : 'transparent',
                    color: i <= (STATUS_META[selectedShipment.status]?.step || 0) ? 'var(--text)' : 'var(--text3)',
                    border: `1px solid ${i <= (STATUS_META[selectedShipment.status]?.step || 0) ? 'var(--border2)' : 'var(--border)'}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {step}
                  </div>
                  {i < PIPELINE.length - 1 && <div style={{ width: '16px', height: '1px', background: 'var(--border2)', flexShrink: 0 }} />}
                </div>
              ))}
            </div>

            {selectedShipment.status === 'pending_booking' ? (
              <>
                <div className="form-group">
                  <label className="label">Courier</label>
                  <select value={bookingForm.courier} onChange={e => setBookingForm({ ...bookingForm, courier: e.target.value })} className="input">
                    <option value="postex">PostEx</option>
                    <option value="leopards">Leopards Courier</option>
                    <option value="bluex">BlueEx</option>
                    <option value="tcs">TCS</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Package Weight (kg)</label>
                  <input type="number" placeholder="0.5" step="0.1" value={bookingForm.weight}
                    onChange={e => setBookingForm({ ...bookingForm, weight: e.target.value })} className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Notes (optional)</label>
                  <input type="text" placeholder="Handle with care, etc." value={bookingForm.notes}
                    onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })} className="input" />
                </div>
                <button onClick={bookCourier} disabled={booking} className="btn btn-primary" style={{ width: '100%' }}>
                  <Truck size={14} /> {booking ? 'Booking...' : 'Book Parcel on PostEx'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                {selectedShipment.tracking_number && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Tracking Number</p>
                    <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--blue)', fontFamily: 'monospace' }}>
                      {selectedShipment.tracking_number}
                    </p>
                  </div>
                )}
                {selectedShipment.label_url && (
                  <button onClick={() => downloadLabel(selectedShipment)} className="btn btn-primary" style={{ width: '100%' }}>
                    <Printer size={14} /> Download & Print Label
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
