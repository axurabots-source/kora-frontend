import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, User, Phone, MessageCircle, Search, ExternalLink } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

export default function Parties() {
  const { profile } = useAuth()
  const [parties, setParties] = useState([])
  const [filtered, setFiltered] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedParty, setSelectedParty] = useState(null)
  const [partyLedger, setPartyLedger] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', type: 'customer' })

  useEffect(() => { if (profile) fetchBusinesses() }, [profile])
  useEffect(() => { if (selectedBusiness) fetchParties() }, [selectedBusiness])
  useEffect(() => { applyFilters() }, [parties, search, typeFilter])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', profile.id)
    setBusinesses(data || [])
    if (data?.length > 0) setSelectedBusiness(data[0].id)
  }

  const fetchParties = async () => {
    const token = await getToken()
    try {
      const { data } = await axios.get(`${API}/api/parties/${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setParties(data || [])
    } catch {}
  }

  const fetchPartyLedger = async (partyId) => {
    const token = await getToken()
    try {
      const { data } = await axios.get(`${API}/api/parties/ledger/${partyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPartyLedger(data || [])
    } catch {}
  }

  const applyFilters = () => {
    let f = [...parties]
    if (typeFilter !== 'all') f = f.filter(p => p.type === typeFilter)
    if (search) f = f.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
    )
    setFiltered(f)
  }

  const createParty = async () => {
    if (!form.name) return toast.error('Name is required')
    setLoading(true)
    try {
      const token = await getToken()
      await axios.post(`${API}/api/parties/${selectedBusiness}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Party added!')
      setShowModal(false)
      setForm({ name: '', phone: '', type: 'customer' })
      fetchParties()
    } catch (err) {
      if (err.response?.status === 409) toast.error('Party already exists!')
      else toast.error('Failed to add party')
    }
    setLoading(false)
  }

  const openPartyDetail = (party) => {
    setSelectedParty(party)
    fetchPartyLedger(party.id)
  }

  const sendWhatsAppReminder = (party) => {
    if (!party.phone) return toast.error('No phone number for this party')
    const phone = party.phone.replace(/\D/g, '')
    const msg = `Assalam o Alaikum ${party.name}, aapka pending amount KORA mein record hai. Meherbani farma kar settle karein. Shukriya!`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const partyBalance = (party) => {
    const ledger = partyLedger
    const rec = ledger.filter(e => e.entry_type === 'receivable').reduce((s, e) => s + parseFloat(e.amount), 0)
    const pay = ledger.filter(e => e.entry_type === 'payable').reduce((s, e) => s + parseFloat(e.amount), 0)
    return rec - pay
  }

  return (
    <div className="page fade-in">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: '13px' }
      }} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Parties</h1>
          <p className="page-subtitle">Customers and suppliers — {parties.length} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" id="add-party-btn">
          <Plus size={14} /> Add Party
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="tabs">
          {['all', 'customer', 'supplier'].map(t => (
            <button key={t} className={`tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All' : t === 'customer' ? '👤 Customers' : '🏭 Suppliers'}
            </button>
          ))}
        </div>
        <div className="search-bar">
          <Search size={13} color="var(--text3)" />
          <input
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Parties</div>
          <div className="stat-value" style={{ fontSize: '22px' }}>{parties.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Customers</div>
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--green-light)' }}>
            {parties.filter(p => p.type === 'customer').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Suppliers</div>
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--blue)' }}>
            {parties.filter(p => p.type === 'supplier').length}
          </div>
        </div>
      </div>

      {/* Party grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {filtered.map(party => (
          <div
            key={party.id}
            className="card"
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
            onClick={() => openPartyDetail(party)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: party.type === 'customer' ? 'var(--green-bg)' : 'var(--blue-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '800',
                color: party.type === 'customer' ? 'var(--green-light)' : 'var(--blue)',
                flexShrink: 0,
              }}>
                {party.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {party.name}
                </p>
                <p style={{ color: 'var(--text3)', fontSize: '12px' }}>{party.phone || 'No phone'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`badge ${party.type === 'customer' ? 'badge-green' : 'badge-blue'}`}>
                {party.type === 'customer' ? 'Customer' : 'Supplier'}
              </span>
              {party.phone && (
                <button
                  onClick={evt => { evt.stopPropagation(); sendWhatsAppReminder(party) }}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#25D366', borderColor: 'rgba(37,211,102,0.3)', padding: '4px 10px' }}
                  title="Send WhatsApp Reminder"
                >
                  <MessageCircle size={12} /> WA
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p className="empty-state-text">No parties found</p>
              <p className="empty-state-sub">Add your first customer or supplier</p>
            </div>
          </div>
        )}
      </div>

      {/* Party Detail Drawer */}
      {selectedParty && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedParty(null)}>
          <div className="modal" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: selectedParty.type === 'customer' ? 'var(--green-bg)' : 'var(--blue-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '800',
                  color: selectedParty.type === 'customer' ? 'var(--green-light)' : 'var(--blue)',
                }}>
                  {selectedParty.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text)' }}>{selectedParty.name}</p>
                  <p style={{ color: 'var(--text3)', fontSize: '12px' }}>{selectedParty.phone || 'No phone number'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedParty(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {/* Actions */}
            {selectedParty.phone && (
              <button
                onClick={() => sendWhatsAppReminder(selectedParty)}
                className="btn"
                style={{
                  width: '100%',
                  background: 'rgba(37,211,102,0.1)',
                  color: '#25D366',
                  border: '1px solid rgba(37,211,102,0.25)',
                  marginBottom: '20px',
                  fontWeight: '600',
                }}
              >
                <MessageCircle size={14} /> Send WhatsApp Reminder
              </button>
            )}

            {/* Transaction history */}
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Transaction History
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {partyLedger.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                  No transactions with this party yet
                </p>
              ) : partyLedger.map(e => (
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
                      {e.description || e.entry_type}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{e.entry_date || '—'}</p>
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: e.entry_type === 'receivable' ? 'var(--green-light)' : 'var(--red-light)',
                  }}>
                    {e.entry_type === 'receivable' ? '+' : '-'}PKR {parseFloat(e.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Party Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '24px', letterSpacing: '-0.3px' }}>
              New Party
            </h3>

            <div className="form-group">
              <label className="label">Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '0' }}>
                {['customer', 'supplier'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${form.type === t
                        ? (t === 'customer' ? 'var(--green-light)' : 'var(--blue)')
                        : 'var(--border2)'}`,
                      background: form.type === t
                        ? (t === 'customer' ? 'var(--green-bg)' : 'var(--blue-bg)')
                        : 'transparent',
                      color: form.type === t
                        ? (t === 'customer' ? 'var(--green-light)' : 'var(--blue)')
                        : 'var(--text2)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    {t === 'customer' ? '👤 Customer' : '🏭 Supplier'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Full Name *</label>
              <input type="text" placeholder="e.g. Ahmed Traders" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} className="input" autoFocus />
            </div>

            <div className="form-group">
              <label className="label">Phone (for WhatsApp reminders)</label>
              <input type="tel" placeholder="923001234567" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
              <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Include country code, e.g. 923001234567
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={createParty} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                {loading ? 'Saving...' : 'Save Party'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}