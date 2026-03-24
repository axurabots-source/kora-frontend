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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const fetchData = async () => {
    try {
      const token = await getToken()
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
    } catch (err) {
      toast.error('Failed to load admin data')
    }
    setLoading(false)
  }

  const blockUser = async (userId) => {
    const token = await getToken()
    await axios.patch(`${API}/api/admin/users/${userId}/block`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    toast.success('User blocked')
    fetchData()
  }

  const unblockUser = async (userId) => {
    const token = await getToken()
    await axios.patch(`${API}/api/admin/users/${userId}/unblock`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    toast.success('User unblocked')
    fetchData()
  }

  if (profile?.role !== 'admin') {
    return (
      <div style={{ padding: '24px', color: '#fff', textAlign: 'center', marginTop: '60px' }}>
        <Shield size={48} color="#333" />
        <p style={{ color: '#555', marginTop: '16px' }}>Admin access only</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', color: '#fff', fontFamily: 'sans-serif' }}>
      <Toaster />
      <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Admin Panel</h2>
      <p style={{ color: '#555', marginBottom: '32px' }}>Platform overview and user management</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Users size={18} color="#7F77DD" />
            <p style={{ color: '#888', fontSize: '13px' }}>Total Users</p>
          </div>
          <p style={{ color: '#fff', fontSize: '28px', fontWeight: '600' }}>{stats?.total_users || 0}</p>
        </div>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <BookOpen size={18} color="#1D9E75" />
            <p style={{ color: '#888', fontSize: '13px' }}>Ledger Entries</p>
          </div>
          <p style={{ color: '#fff', fontSize: '28px', fontWeight: '600' }}>{stats?.total_ledger_entries || 0}</p>
        </div>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Shield size={18} color="#D85A30" />
            <p style={{ color: '#888', fontSize: '13px' }}>Cash Entries</p>
          </div>
          <p style={{ color: '#fff', fontSize: '28px', fontWeight: '600' }}>{stats?.total_cash_entries || 0}</p>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2a' }}>
          <h3 style={{ fontSize: '16px', color: '#ccc' }}>All Users</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
              {['Name', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontSize: '13px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                <td style={{ padding: '12px 16px', color: '#ccc', fontSize: '14px' }}>{user.full_name || '—'}</td>
                <td style={{ padding: '12px 16px', color: '#888', fontSize: '13px' }}>{user.phone || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                    background: user.role === 'admin' ? '#2a1a3e' : '#1f1f1f',
                    color: user.role === 'admin' ? '#7F77DD' : '#888'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                    background: user.is_blocked ? '#2e1a0f' : '#0f2e1e',
                    color: user.is_blocked ? '#D85A30' : '#1D9E75'
                  }}>
                    {user.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#555', fontSize: '12px' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {user.is_blocked ? (
                    <button
                      onClick={() => unblockUser(user.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#0f2e1e', border: 'none', borderRadius: '6px', color: '#1D9E75', cursor: 'pointer', fontSize: '12px' }}
                    >
                      <CheckCircle size={12} /> Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => blockUser(user.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#2e1a0f', border: 'none', borderRadius: '6px', color: '#D85A30', cursor: 'pointer', fontSize: '12px' }}
                    >
                      <Ban size={12} /> Block
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>
                  No users yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}