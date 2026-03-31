import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Store, CheckCircle, AlertCircle, RefreshCw, Link2 } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

export default function StoreConnect() {
  const { profile } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [store, setStore] = useState(null)
  const [form, setForm] = useState({ store_url: '', api_key: '', api_secret: '' })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { if (profile) fetchBusinesses() }, [profile])
  useEffect(() => { if (selectedBusiness) fetchStore() }, [selectedBusiness])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', profile.id)
    setBusinesses(data || [])
    if (data?.length > 0) setSelectedBusiness(data[0].id)
  }

  const fetchStore = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/api/woocommerce/store/${selectedBusiness}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStore(data)
    } catch {
      setStore(null)
    }
  }

  const testConnection = async () => {
    if (!form.store_url || !form.api_key || !form.api_secret) {
      return toast.error('Fill all fields before testing')
    }
    setTesting(true)
    try {
      const token = await getToken()
      await axios.post(`${API}/api/woocommerce/test`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('✅ Connection successful!')
    } catch {
      toast.error('❌ Connection failed — check URL and API keys')
    }
    setTesting(false)
  }

  const connectStore = async () => {
    if (!form.store_url || !form.api_key || !form.api_secret) {
      return toast.error('Fill all fields')
    }
    setLoading(true)
    try {
      const token = await getToken()
      await axios.post(`${API}/api/woocommerce/connect/${selectedBusiness}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Store connected!')
      fetchStore()
      setForm({ store_url: '', api_key: '', api_secret: '' })
    } catch {
      toast.error('Failed to connect store')
    }
    setLoading(false)
  }

  const syncNow = async () => {
    setSyncing(true)
    try {
      const token = await getToken()
      await axios.post(`${API}/api/woocommerce/sync/${selectedBusiness}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Orders synced!')
      fetchStore()
    } catch {
      toast.error('Sync failed')
    }
    setSyncing(false)
  }

  const disconnectStore = async () => {
    if (!confirm('Disconnect this store? Orders history will be kept.')) return
    const token = await getToken()
    await axios.delete(`${API}/api/woocommerce/store/${selectedBusiness}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    toast.success('Store disconnected')
    setStore(null)
  }

  return (
    <div className="page fade-in">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: '13px' }
      }} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Store Connect</h1>
          <p className="page-subtitle">Link your WooCommerce store to start syncing orders</p>
        </div>
      </div>

      <div className="grid-2" style={{ maxWidth: '900px' }}>
        {/* Connection form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={18} color="var(--blue)" />
            </div>
            <div>
              <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>WooCommerce</p>
              <p style={{ fontSize: '11px', color: 'var(--text3)' }}>REST API v3</p>
            </div>
          </div>

          {store ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'var(--green-bg)',
                border: '1px solid rgba(74,222,128,0.15)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
              }}>
                <CheckCircle size={16} color="var(--green-light)" />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--green-light)' }}>Connected</p>
                  <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{store.store_url}</p>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '16px' }}>
                Last sync: {store.last_sync ? new Date(store.last_sync).toLocaleString() : 'Never'}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={syncNow} disabled={syncing} className="btn btn-primary" style={{ flex: 1 }}>
                  <RefreshCw size={13} className={syncing ? 'spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button onClick={disconnectStore} className="btn btn-danger">
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="label">WordPress / WooCommerce URL</label>
                <input
                  type="url"
                  placeholder="https://yourstore.com"
                  value={form.store_url}
                  onChange={e => setForm({ ...form, store_url: e.target.value })}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="label">Consumer Key</label>
                <input
                  type="text"
                  placeholder="ck_xxxxxxxxxxxxxxxxxxxx"
                  value={form.api_key}
                  onChange={e => setForm({ ...form, api_key: e.target.value })}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="label">Consumer Secret</label>
                <input
                  type="password"
                  placeholder="cs_xxxxxxxxxxxxxxxxxxxx"
                  value={form.api_secret}
                  onChange={e => setForm({ ...form, api_secret: e.target.value })}
                  className="input"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={testConnection} disabled={testing} className="btn btn-ghost" style={{ flex: 1 }}>
                  {testing ? 'Testing...' : '🔌 Test Connection'}
                </button>
                <button onClick={connectStore} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                  {loading ? 'Connecting...' : 'Connect Store'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card">
            <p style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text)', marginBottom: '12px' }}>
              How to get API Keys
            </p>
            {[
              'Go to your WordPress admin panel',
              'Navigate to WooCommerce → Settings → Advanced → REST API',
              'Click "Add Key" → give it a name like "KORA"',
              'Set Permissions to "Read/Write"',
              'Copy the Consumer Key and Consumer Secret',
              'Paste them above and connect!',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--bg3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'var(--text2)',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.5' }}>{step}</p>
              </div>
            ))}
          </div>

          <div style={{
            padding: '14px 16px',
            background: 'var(--yellow-bg)',
            border: '1px solid rgba(252,211,77,0.15)',
            borderRadius: 'var(--radius)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--yellow-light)', marginBottom: '4px' }}>
              ⚠️ Hosting issue?
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: '1.5' }}>
              If connection fails, go to WordPress → Settings → Permalinks → Save Changes.
              This re-registers the REST API routes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
