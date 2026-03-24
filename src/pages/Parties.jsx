import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, User } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

export default function Parties() {
  const { profile } = useAuth()
  const [parties, setParties] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', type: 'customer' })

  useEffect(() => {
    if (profile) fetchBusinesses()
  }, [profile])

  useEffect(() => {
    if (selectedBusiness) fetchParties()
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

  const fetchParties = async () => {
    const token = await getToken()
    const { data } = await axios.get(`${API}/api/parties/${selectedBusiness}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setParties(data)
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
      if (err.response?.status === 409) {
        toast.error('This party already exists!')
      } else {
        toast.error('Failed to add party')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '24px', color: '#fff', fontFamily: 'sans-serif' }}>
      <Toaster />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px' }}>Parties</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', background: '#7F77DD', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
          }}
        >
          <Plus size={16} /> Add Party
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {parties.map(party => (
          <div key={party.id} style={{
            background: '#1a1a1a', padding: '20px', borderRadius: '12px',
            border: '1px solid #2a2a2a', cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: '#2a2a3e', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={18} color="#7F77DD" />
              </div>
              <div>
                <p style={{ fontWeight: '600', fontSize: '15px' }}>{party.name}</p>
                <p style={{ color: '#555', fontSize: '12px' }}>{party.phone || 'No phone'}</p>
              </div>
            </div>
            <span style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
              background: party.type === 'customer' ? '#0f2e1e' : '#2e1a0f',
              color: party.type === 'customer' ? '#1D9E75' : '#D85A30'
            }}>
              {party.type === 'customer' ? 'Customer' : 'Supplier'}
            </span>
          </div>
        ))}
        {parties.length === 0 && (
          <p style={{ color: '#444', gridColumn: '1/-1', textAlign: 'center', marginTop: '40px' }}>
            No parties yet — add your first one!
          </p>
        )}
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
            <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>New Party</h3>

            <label style={{ color: '#aaa', fontSize: '13px' }}>Name</label>
            <input
              type="text"
              placeholder="e.g. Ahmed Traders"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 16px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            />

            <label style={{ color: '#aaa', fontSize: '13px' }}>Phone</label>
            <input
              type="tel"
              placeholder="+92 300 1234567"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 16px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            />

            <label style={{ color: '#aaa', fontSize: '13px' }}>Type</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              style={{ width: '100%', padding: '10px', margin: '8px 0 24px', background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
            >
              <option value="customer">Customer (Lena hai)</option>
              <option value="supplier">Supplier (Dena hai)</option>
            </select>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#888', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={createParty}
                disabled={loading}
                style={{ flex: 1, padding: '12px', background: '#7F77DD', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                {loading ? 'Saving...' : 'Save Party'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}