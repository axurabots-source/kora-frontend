import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

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

  useEffect(() => {
    if (profile) fetchBusinesses()
  }, [profile])

  useEffect(() => {
    if (selectedBusiness) {
      fetchEntries()
      fetchBalance()
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
    const { data } = await axios.get(`${API}/api/cash/${selectedBusiness}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setEntries(data)
  }

  const fetchBalance = async () => {
    const token = await getToken()
    const { data } = await axios.get(`${API}/api/cash/${selectedBusiness}/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setBalance(data)
  }

  const addEntry = async () => {
    if (!form.amount) return toast.error('Amount is required')
    setLoading(true)
    try {
      const token = await getToken()
      await axios.post(`${API}/api/cash/${selectedBusiness}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Cash entry added!')
      setShowModal(false)
      setForm({ direction: 'in', amount: '', note: '', entry_date: '' })
      fetchEntries()
      fetchBalance()
    } catch (err) {
      toast.error('Failed to add entry')
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '24px', color: '#fff', fontFamily: 'sans-serif' }}>
      <Toaster />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px' }}>Cash Book</h2>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Cash In</p>
          <p style={{ color: '#1D9E75', fontSize: '22px', fontWeight: '600' }}>
            PKR {(balance?.total_in || 0).toLocaleString()}
          </p>
        </div>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Cash Out</p>
          <p style={{ color: '#D85A30', fontSize: '22px', fontWeight: '600' }}>
            PKR {(balance?.total_out || 0).toLocaleString()}
          </p>
        </div>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Balance</p>
          <p style={{ color: '#7F77DD', fontSize: '22px', fontWeight: '600' }}>
            PKR {(balance?.balance || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
              {['Date', 'Direction', 'Amount', 'Note'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontSize: '13px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                <td style={{ padding: '12px 16px', color: '#888', fontSize: '13px' }}>{entry.entry_date}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
                    color: entry.direction === 'in' ? '#1D9E75' : '#D85A30'
                  }}>
                    {entry.direction === 'in'
                      ? <ArrowDownCircle size={14} />
                      : <ArrowUpCircle size={14} />}
                    {entry.direction === 'in' ? 'Cash In' : 'Cash Out'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '14px',
                  color: entry.direction === 'in' ? '#1D9E75' : '#D85A30'
                }}>
                  PKR {parseFloat(entry.amount).toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', color: '#888', fontSize: '13px' }}>{entry.note || '—'}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>
                  No cash entries yet!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            background: '#1a1a1a', padding: '32px', borderRadius: '16px',
            width: '100%', maxWidth: '400px', border: '1px solid #2a2a2a'
          }}>
            <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>New Cash Entry</h3>

            <label style={{ color: '#aaa', fontSize: '13px' }}>Direction</label>
            <select
              value={form.direction}
              onChange={e => setForm({ ...form, direction: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 16px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            >
              <option value="in">Cash In (Aaya)</option>
              <option value="out">Cash Out (Gaya)</option>
            </select>

            <label style={{ color: '#aaa', fontSize: '13px' }}>Amount (PKR)</label>
            <input
              type="number"
              placeholder="5000"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 16px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            />

            <label style={{ color: '#aaa', fontSize: '13px' }}>Note</label>
            <input
              type="text"
              placeholder="e.g. Shop ka kiraya"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
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
                onClick={addEntry}
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