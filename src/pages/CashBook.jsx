import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, ArrowDownCircle, ArrowUpCircle, Download } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

export default function CashBook() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [balance, setBalance] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ direction: 'in', amount: '', note: '', entry_date: '' })

  useEffect(() => { if (profile) fetchBusinesses() }, [profile])
  useEffect(() => { if (selectedBusiness) { fetchEntries(); fetchBalance() } }, [selectedBusiness])

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
      const { data } = await axios.get(`${API}/api/cash/${selectedBusiness}`, { headers: { Authorization: `Bearer ${token}` } })
      setEntries(data || [])
    } catch {}
  }

  const fetchBalance = async () => {
    const token = await getToken()
    try {
      const { data } = await axios.get(`${API}/api/cash/${selectedBusiness}/balance`, { headers: { Authorization: `Bearer ${token}` } })
      setBalance(data)
    } catch {}
  }

  const addEntry = async () => {
    if (!form.amount) return toast.error('Amount is required')
    setLoading(true)
    try {
      const token = await getToken()
      await axios.post(`${API}/api/cash/${selectedBusiness}`, form, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Cash entry added!')
      setShowModal(false)
      setForm({ direction: 'in', amount: '', note: '', entry_date: '' })
      fetchEntries(); fetchBalance()
    } catch { toast.error('Failed to add entry') }
    setLoading(false)
  }

  const exportCSV = () => {
    const headers = ['Date', 'Direction', 'Amount', 'Note']
    const rows = entries.map(e => [e.entry_date, e.direction, e.amount, e.note || ''])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `kora-cashbook-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  return (
    <div className="page fade-in">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: '13px' }
      }} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Cash Book</h1>
          <p className="page-subtitle">Track every rupee in and out</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportCSV} className="btn btn-ghost btn-sm">
            <Download size={13} /> Export
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm" id="add-cash-entry">
            <Plus size={13} /> Add Entry
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Cash In', value: balance?.total_in || 0, color: 'var(--green-light)', icon: '↓' },
          { label: 'Cash Out', value: balance?.total_out || 0, color: 'var(--red-light)', icon: '↑' },
          { label: 'Balance', value: balance?.balance || 0, color: 'var(--text)', icon: '💰' },
        ].map(card => (
          <div key={card.label} className="stat-card">
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ fontSize: '24px', color: card.color }}>
              PKR {(card.value).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Direction</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{entry.entry_date || '—'}</td>
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '12px', fontWeight: '600',
                    color: entry.direction === 'in' ? 'var(--green-light)' : 'var(--red-light)'
                  }}>
                    {entry.direction === 'in' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                    {entry.direction === 'in' ? 'Cash In' : 'Cash Out'}
                  </span>
                </td>
                <td style={{
                  fontWeight: '700', fontFamily: 'monospace',
                  color: entry.direction === 'in' ? 'var(--green-light)' : 'var(--red-light)'
                }}>
                  {entry.direction === 'in' ? '+' : '-'}PKR {parseFloat(entry.amount).toLocaleString()}
                </td>
                <td>{entry.note || '—'}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={4}>
                <div className="empty-state">
                  <div className="empty-state-icon">💵</div>
                  <p className="empty-state-text">No cash entries yet</p>
                  <p className="empty-state-sub">Track your daily cash in and out</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '24px' }}>New Cash Entry</h3>

            <div className="form-group">
              <label className="label">Direction</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { val: 'in', label: '↓ Cash In (Aaya)', color: 'var(--green-light)', bg: 'var(--green-bg)' },
                  { val: 'out', label: '↑ Cash Out (Gaya)', color: 'var(--red-light)', bg: 'var(--red-bg)' },
                ].map(t => (
                  <button key={t.val} onClick={() => setForm({ ...form, direction: t.val })} style={{
                    padding: '10px', borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${form.direction === t.val ? t.color : 'var(--border2)'}`,
                    background: form.direction === t.val ? t.bg : 'transparent',
                    color: form.direction === t.val ? t.color : 'var(--text2)',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Amount (PKR) *</label>
              <input type="number" placeholder="5000" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} className="input" autoFocus />
            </div>

            <div className="form-group">
              <label className="label">Note</label>
              <input type="text" placeholder="e.g. Shop ka kiraya" value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })} className="input" />
            </div>

            <div className="form-group">
              <label className="label">Date</label>
              <input type="date" value={form.entry_date}
                onChange={e => setForm({ ...form, entry_date: e.target.value })} className="input" />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={addEntry} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}