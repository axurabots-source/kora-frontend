import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'

export default function CreateBusiness() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'shop', currency: 'PKR' })

  const createBusiness = async () => {
    if (!form.name) return toast.error('Business name is required')
    setLoading(true)
    const { error } = await supabase.from('businesses').insert({ owner_id: profile.id, ...form })
    if (error) toast.error(error.message)
    else { toast.success('Business created!'); navigate('/') }
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '12px', margin: '8px 0 16px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '15px', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Toaster />
      <div style={{ background: 'var(--bg2)', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '440px', border: '1px solid var(--border)' }}>
        <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>Create your business</h2>
        <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '32px' }}>Set up your first business to start tracking</p>

        <label style={{ color: 'var(--text2)', fontSize: '13px' }}>Business name</label>
        <input type="text" placeholder="e.g. Ahmed Traders" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />

        <label style={{ color: 'var(--text2)', fontSize: '13px' }}>Business type</label>
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
          <option value="shop">Shop / Dukan</option>
          <option value="wholesale">Wholesale</option>
          <option value="agency">Agency</option>
          <option value="other">Other</option>
        </select>

        <label style={{ color: 'var(--text2)', fontSize: '13px' }}>Currency</label>
        <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={inputStyle}>
          <option value="PKR">PKR — Pakistani Rupee</option>
          <option value="USD">USD — US Dollar</option>
          <option value="AED">AED — UAE Dirham</option>
        </select>

        <button onClick={createBusiness} disabled={loading} style={{ width: '100%', padding: '13px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500', marginTop: '8px' }}>
          {loading ? 'Creating...' : 'Create business'}
        </button>
      </div>
    </div>
  )
}