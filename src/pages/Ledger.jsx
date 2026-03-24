import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

export default function Ledger() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    entry_type: 'receivable', amount: '', description: '', party_id: '', entry_date: ''
  })
  const [parties, setParties] = useState([])

  useEffect(() => {
    if (profile) fetchBusinesses()
  }, [profile])

  useEffect(() => {
    if (selectedBusiness) {
      fetchEntries()
      fetchParties()
    }
  }, [selectedBusiness])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchBusinesses = async () => {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', profile.id)
    setBusinesses(data || [])
    if (data?.length > 0) setSelectedBusiness(data[0].id)
  }

  const fetchEntries = async () => {
    const token = await getToken()
    const { data } = await axios.get(`${API}/api/ledger/${selectedBusiness}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setEntries(data)
  }

  const fetchParties = async () => {
    const token = await getToken()
    const { data } = await axios.get(`${API}/api/parties/${selectedBusiness}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setParties(data)
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
    } catch (err) {
      toast.error('Failed to add entry')
    }
    setLoading(false)
  }

  const deleteEntry = async (id) => {
    const token = await getToken()
    await axios.delete(`${API}/api/ledger/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    toast.success('Entry deleted')
    fetchEntries()
  }

  return (
    <div style={{ padding: '24px', color: '#fff', fontFamily: 'sans-serif' }}>
      <Toaster />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px' }}>Ledger</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', background: '#7F77DD', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
          }}
        >
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {businesses.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#555', marginTop: '60px' }}>
          <p>No business found. Create one first.</p>
        </div>
      ) : (
        <>
          <select
            value={selectedBusiness || ''}
            onChange={e => setSelectedBusiness(e.target.value)}
            style={{
              padding: '10px', background: '#1a1a1a', border: '1px solid #333',
              borderRadius: '8px', color: '#fff', marginBottom: '20px', fontSize: '14px'
            }}
          >
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                  {['Date', 'Type', 'Party', 'Description', 'Amount', 'Source', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontSize: '13px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <td style={{ padding: '12px 16px', color: '#888', fontSize: '13px' }}>{entry.entry_date}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                        background: entry.entry_type === 'receivable' ? '#0f2e1e' : '#2e1a0f',
                        color: entry.entry_type === 'receivable' ? '#1D9E75' : '#D85A30'
                      }}>
                        {entry.entry_type === 'receivable' ? 'Lena' : 'Dena'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#ccc', fontSize: '13px' }}>{entry.parties?.name || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#888', fontSize: '13px' }}>{entry.description || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '14px',
                      color: entry.entry_type === 'receivable' ? '#1D9E75' : '#D85A30'
                    }}>
                      PKR {parseFloat(entry.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555', fontSize: '12px' }}>{entry.source}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>
                      No entries yet — add your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            background: '#1a1a1a', padding: '32px', borderRadius: '16px',
            width: '100%', maxWidth: '440px', border: '1px solid #2a2a2a'
          }}>
            <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>New Entry</h3>

            <label style={{ color: '#aaa', fontSize: '13px' }}>Type</label>
            <select
              value={form.entry_type}
              onChange={e => setForm({ ...form, entry_type: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 16px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            >
              <option value="receivable">Receivable (Lena hai)</option>
              <option value="payable">Payable (Dena hai)</option>
            </select>

            <label style={{ color: '#aaa', fontSize: '13px' }}>Party</label>
            <select
              value={form.party_id}
              onChange={e => setForm({ ...form, party_id: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 16px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            >
              <option value="">No party</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label style={{ color: '#aaa', fontSize: '13px' }}>Amount (PKR)</label>
            <input
              type="number"
              placeholder="5000"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 16px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            />

            <label style={{ color: '#aaa', fontSize: '13px' }}>Description</label>
            <input
              type="text"
              placeholder="e.g. Maal ki payment"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 16px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            />

            <label style={{ color: '#aaa', fontSize: '13px' }}>Date</label>
            <input
              type="date"
              value={form.entry_date}
              onChange={e => setForm({ ...form, entry_date: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 24px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#888', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={createEntry}
                disabled={loading}
                style={{ flex: 1, padding: '12px', background: '#7F77DD', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}