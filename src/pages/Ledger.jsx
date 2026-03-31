import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, Trash2, Download, Mic, MicOff, Filter } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

export default function Ledger() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [filtered, setFiltered] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [parties, setParties] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    entry_type: 'receivable', amount: '', description: '', party_id: '', entry_date: ''
  })
  // Voice entry
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')

  useEffect(() => { if (profile) fetchBusinesses() }, [profile])
  useEffect(() => { if (selectedBusiness) { fetchEntries(); fetchParties() } }, [selectedBusiness])
  useEffect(() => { applyFilters() }, [entries, typeFilter, search])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', profile.id)
    setBusinesses(data || [])
    if (data?.length > 0) setSelectedBusiness(data[0].id)
  }

  const fetchEntries = async () => {
    const token = await getToken()
    try {
      const { data } = await axios.get(`${API}/api/ledger/${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEntries(data || [])
    } catch {}
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

  const applyFilters = () => {
    let f = [...entries]
    if (typeFilter !== 'all') f = f.filter(e => e.entry_type === typeFilter)
    if (search) f = f.filter(e =>
      e.parties?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      String(e.amount).includes(search)
    )
    setFiltered(f)
  }

  const createEntry = async () => {
    if (!form.amount) return toast.error('Amount is required')
    setLoading(true)
    try {
      const token = await getToken()
      await axios.post(`${API}/api/ledger/${selectedBusiness}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Entry added!')
      setShowModal(false)
      setForm({ entry_type: 'receivable', amount: '', description: '', party_id: '', entry_date: '' })
      fetchEntries()
    } catch { toast.error('Failed to add entry') }
    setLoading(false)
  }

  const deleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return
    const token = await getToken()
    await axios.delete(`${API}/api/ledger/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    toast.success('Deleted')
    fetchEntries()
  }

  // CSV Export
  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Party', 'Description', 'Amount', 'Source']
    const rows = filtered.map(e => [
      e.entry_date, e.entry_type, e.parties?.name || '', e.description || '', e.amount, e.source || ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kora-ledger-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  // Voice Entry
  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return toast.error('Voice not supported in this browser. Use Chrome.')
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); toast.error('Voice error — try again') }
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setVoiceText(text)
      // Parse: "Ahmed ne 5000 diye" or "5000 received from Ahmed"
      const amountMatch = text.match(/\d+/)
      const nameMatch = text.match(/from\s+(\w+\s*\w*)/i) || text.match(/^(\w+\s?\w*)\s+(ne|ko)/i)
      if (amountMatch) setForm(f => ({ ...f, amount: amountMatch[0] }))
      if (nameMatch) {
        const name = nameMatch[1]
        const found = parties.find(p => p.name.toLowerCase().includes(name.toLowerCase()))
        if (found) setForm(f => ({ ...f, party_id: found.id }))
      }
      const isReceivable = /diye|received|mila|aaya|in/i.test(text)
      const isPayable = /diya|paid|out|gaya|dena/i.test(text)
      if (isReceivable) setForm(f => ({ ...f, entry_type: 'receivable' }))
      if (isPayable) setForm(f => ({ ...f, entry_type: 'payable' }))
      setShowModal(true)
      toast.success(`Voice: "${text}"`)
    }
    rec.start()
  }

  const totals = filtered.reduce((acc, e) => {
    if (e.entry_type === 'receivable') acc.rec += parseFloat(e.amount) || 0
    else acc.pay += parseFloat(e.amount) || 0
    return acc
  }, { rec: 0, pay: 0 })

  return (
    <div className="page fade-in">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: '13px' }
      }} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ledger</h1>
          <p className="page-subtitle">All receivables and payables</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} className="btn btn-ghost btn-sm" id="export-csv">
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={startVoice}
            className={`btn btn-sm ${listening ? 'btn-danger' : 'btn-ghost'}`}
            id="voice-entry-btn"
          >
            {listening ? <><MicOff size={13} /> Listening...</> : <><Mic size={13} /> Voice</>}
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm" id="add-ledger-entry">
            <Plus size={13} /> Add Entry
          </button>
        </div>
      </div>

      {/* Voice feedback */}
      {voiceText && (
        <div style={{
          background: 'var(--blue-bg)',
          border: '1px solid rgba(96,165,250,0.2)',
          borderRadius: 'var(--radius)',
          padding: '10px 16px',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--blue)',
        }}>
          🎤 Heard: <strong>"{voiceText}"</strong> — form pre-filled below
        </div>
      )}

      {/* Summary bar */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Showing Receivable</div>
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--green-light)' }}>
            PKR {totals.rec.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Showing Payable</div>
          <div className="stat-value" style={{ fontSize: '22px', color: 'var(--red-light)' }}>
            PKR {totals.pay.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net (Filtered)</div>
          <div className="stat-value" style={{ fontSize: '22px', color: totals.rec - totals.pay >= 0 ? 'var(--green-light)' : 'var(--red-light)' }}>
            PKR {(totals.rec - totals.pay).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="tabs">
          {['all', 'receivable', 'payable'].map(t => (
            <button key={t} className={`tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All' : t === 'receivable' ? '↓ Receivable' : '↑ Payable'}
            </button>
          ))}
        </div>
        <div className="search-bar">
          <Filter size={13} color="var(--text3)" />
          <input
            placeholder="Search party or amount..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {businesses.length > 1 && (
          <select value={selectedBusiness || ''} onChange={e => setSelectedBusiness(e.target.value)}
            className="input" style={{ width: 'auto', padding: '6px 12px' }}>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {['Date', 'Type', 'Party', 'Description', 'Amount', 'Source', ''].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id}>
                <td style={{ color: 'var(--text3)', fontFamily: 'monospace', fontSize: '12px' }}>
                  {entry.entry_date || '—'}
                </td>
                <td>
                  <span className={`badge ${entry.entry_type === 'receivable' ? 'badge-green' : 'badge-red'}`}>
                    {entry.entry_type === 'receivable' ? '↓ Lena' : '↑ Dena'}
                  </span>
                </td>
                <td style={{ color: 'var(--text)', fontWeight: '500' }}>{entry.parties?.name || '—'}</td>
                <td>{entry.description || '—'}</td>
                <td style={{
                  fontWeight: '700',
                  color: entry.entry_type === 'receivable' ? 'var(--green-light)' : 'var(--red-light)',
                  fontFamily: 'monospace',
                }}>
                  PKR {parseFloat(entry.amount).toLocaleString()}
                </td>
                <td>
                  <span className="badge badge-gray">{entry.source || 'manual'}</span>
                </td>
                <td>
                  <button onClick={() => deleteEntry(entry.id)} className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px', color: 'var(--text3)' }}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p className="empty-state-text">No entries found</p>
                    <p className="empty-state-sub">Add your first entry or change the filter</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Entry Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '24px', letterSpacing: '-0.3px' }}>
              New Entry
            </h3>

            <div className="form-group">
              <label className="label">Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['receivable', 'payable'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, entry_type: t })}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${form.entry_type === t
                        ? (t === 'receivable' ? 'var(--green-light)' : 'var(--red-light)')
                        : 'var(--border2)'}`,
                      background: form.entry_type === t
                        ? (t === 'receivable' ? 'var(--green-bg)' : 'var(--red-bg)')
                        : 'transparent',
                      color: form.entry_type === t
                        ? (t === 'receivable' ? 'var(--green-light)' : 'var(--red-light)')
                        : 'var(--text2)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    {t === 'receivable' ? '↓ Receivable (Lena)' : '↑ Payable (Dena)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Party (optional)</label>
              <select value={form.party_id} onChange={e => setForm({ ...form, party_id: e.target.value })} className="input">
                <option value="">No party</option>
                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Amount (PKR) *</label>
              <input
                type="number"
                placeholder="5000"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <input
                type="text"
                placeholder="e.g. Maal ki payment"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Date</label>
              <input
                type="date"
                value={form.entry_date}
                onChange={e => setForm({ ...form, entry_date: e.target.value })}
                className="input"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={createEntry} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}