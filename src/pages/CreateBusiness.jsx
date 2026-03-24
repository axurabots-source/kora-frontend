import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'

export default function CreateBusiness() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'shop', currency: 'PKR'
  })

  const createBusiness = async () => {
    if (!form.name) return toast.error('Business name is required')
    setLoading(true)
    const { error } = await supabase
      .from('businesses')
      .insert({
        owner_id: profile.id,
        name: form.name,
        type: form.type,
        currency: form.currency
      })
    if (error) toast.error(error.message)
    else {
      toast.success('Business created!')
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif'
    }}>
      <Toaster />
      <div style={{
        background: '#1a1a1a', padding: '40px', borderRadius: '16px',
        width: '100%', maxWidth: '440px', border: '1px solid #2a2a2a'
      }}>
        <h2 style={{ color: '#fff', fontSize: '22px', marginBottom: '8px' }}>Create your business</h2>
        <p style={{ color: '#888', marginBottom: '32px' }}>Set up your first business to start tracking</p>

        <label style={{ color: '#aaa', fontSize: '13px' }}>Business Name</label>
        <input
          type="text"
          placeholder="e.g. Ahmed Traders"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={{
            width: '100%', padding: '12px', margin: '8px 0 16px',
            background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px',
            color: '#fff', fontSize: '16px', boxSizing: 'border-box'
          }}
        />

        <label style={{ color: '#aaa', fontSize: '13px' }}>Business Type</label>
        <select
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
          style={{
            width: '100%', padding: '12px', margin: '8px 0 16px',
            background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px',
            color: '#fff', fontSize: '16px', boxSizing: 'border-box'
          }}
        >
          <option value="shop">Shop / Dukan</option>
          <option value="wholesale">Wholesale</option>
          <option value="agency">Agency</option>
          <option value="other">Other</option>
        </select>

        <label style={{ color: '#aaa', fontSize: '13px' }}>Currency</label>
        <select
          value={form.currency}
          onChange={e => setForm({ ...form, currency: e.target.value })}
          style={{
            width: '100%', padding: '12px', margin: '8px 0 32px',
            background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px',
            color: '#fff', fontSize: '16px', boxSizing: 'border-box'
          }}
        >
          <option value="PKR">PKR — Pakistani Rupee</option>
          <option value="USD">USD — US Dollar</option>
          <option value="AED">AED — UAE Dirham</option>
        </select>

        <button
          onClick={createBusiness}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', background: '#7F77DD',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '16px', cursor: 'pointer', fontWeight: '600'
          }}
        >
          {loading ? 'Creating...' : 'Create Business'}
        </button>
      </div>
    </div>
  )
}
