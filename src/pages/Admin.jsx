import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Shield, Users, BookOpen, Ban, CheckCircle } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

export default function Admin() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => { fetchData() }, [])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchData = async () => {
    try {
      const token = await getToken()
      const [u, s] = await Promise.all([
        axios.get(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      setUsers(u.data); setStats(s.data)
    } catch { toast.error('Failed to load admin data') }
  }

  const blockUser = async (id) => {
    const token = await getToken()
    await axios.patch(`${API}/api/admin/users/${id}/block`, {}, { headers: { Authorization: `Bearer ${token}` } })
    toast.success('User blocked'); fetchData()
  }

  const unblockUser = async (id) => {
    const token = await getToken()
    await axios.patch(`${API}/api/admin/users/${id}/unblock`, {}, { headers: { Authorization: `Bearer ${token}` } })
    toast.success('User unblocked'); fetchData()
  }

  if (profile?.role !== 'admin') return (
    <div style={{ padding: '28px', textAlign: 'center', marginTop: '60px', color: 'var(--text3)' }}>
      <Shield size={40} /><p style={{ marginTop: '12px', fontSize: '14px' }}>Admin access only</p>
    </div>
  )

  return (
    <div style={{ padding: '28px', color: 'var(--text)' }}>
      <Toaster />
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Admin panel</h2>
        <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '2px' }}>Platform overview and user management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { icon: <Users size={16} />, label: 'Total users', value: stats?.total_users || 0 },
          { icon: <BookOpen size={16} />, label: 'Ledger entries', value: stats?.total_ledger_entries || 0 },
          { icon: <Shield size={16} />, label: 'Cash entries', value: stats?.total_cash_entries || 0 },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--text3)' }}>
              {card.icon}
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</p>
            </div>
            <p style={{ fontSize: '26px', fontWeight: '600', color: 'var(--text)' }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>All users</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Phone', 'Role', 'Status', 'Joined', 'Action'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', color: 'var(--text)', fontSize: '13px' }}>{user.full_name || '—'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: '13px' }}>{user.phone || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: 'var(--bg3)', color: 'var(--text2)' }}>{user.role}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: user.is_blocked ? 'var(--red-bg)' : 'var(--green-bg)', color: user.is_blocked ? 'var(--red-light)' : 'var(--green-light)' }}>
                    {user.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: '12px' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  {user.is_blocked ? (
                    <button onClick={() => unblockUser(user.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'var(--green-bg)', border: 'none', borderRadius: '6px', color: 'var(--green-light)', cursor: 'pointer', fontSize: '12px' }}>
                      <CheckCircle size={11} /> Unblock
                    </button>
                  ) : (
                    <button onClick={() => blockUser(user.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'var(--red-bg)', border: 'none', borderRadius: '6px', color: 'var(--red-light)', cursor: 'pointer', fontSize: '12px' }}>
                      <Ban size={11} /> Block
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>No users yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}