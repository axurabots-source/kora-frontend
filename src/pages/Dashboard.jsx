import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const API = import.meta.env.VITE_API_URL

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [summary, setSummary] = useState(null)
  const [cashBalance, setCashBalance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchData()
  }, [profile])

  const fetchData = async () => {
    try {
      const { data: businesses } = await axios.get(
        `${API}/api/parties/${profile.id}`,
        { headers: { Authorization: `Bearer ${(await import('../lib/supabase')).supabase.auth.getSession().then(s => s.data.session?.access_token)}` } }
      )
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const donutData = [
    { name: 'Receivable (Lena)', value: summary?.total_receivable || 45000 },
    { name: 'Payable (Dena)', value: summary?.total_payable || 28000 },
    { name: 'Cash in Hand', value: cashBalance?.balance || 12000 },
  ]

  const COLORS = ['#1D9E75', '#D85A30', '#7F77DD']

  return (
    <div style={{ padding: '24px', color: '#fff', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '8px', fontSize: '22px' }}>Dashboard</h2>
      <p style={{ color: '#888', marginBottom: '32px' }}>
        Welcome back, {profile?.full_name || 'User'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Total Receivable</p>
          <p style={{ color: '#1D9E75', fontSize: '24px', fontWeight: '600' }}>
            PKR {(summary?.total_receivable || 45000).toLocaleString()}
          </p>
          <p style={{ color: '#555', fontSize: '12px' }}>Lena hai</p>
        </div>

        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Total Payable</p>
          <p style={{ color: '#D85A30', fontSize: '24px', fontWeight: '600' }}>
            PKR {(summary?.total_payable || 28000).toLocaleString()}
          </p>
          <p style={{ color: '#555', fontSize: '12px' }}>Dena hai</p>
        </div>

        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>Cash in Hand</p>
          <p style={{ color: '#7F77DD', fontSize: '24px', fontWeight: '600' }}>
            PKR {(cashBalance?.balance || 12000).toLocaleString()}
          </p>
          <p style={{ color: '#555', fontSize: '12px' }}>Haath mein</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: '#1a1a1a', padding: '24px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', color: '#ccc' }}>Balance Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                {donutData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
            {donutData.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i] }} />
                <span style={{ color: '#888', fontSize: '12px' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#1a1a1a', padding: '24px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', color: '#ccc' }}>Net Balance</h3>
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '8px' }}>You are owed</p>
            <p style={{ color: '#1D9E75', fontSize: '36px', fontWeight: '700' }}>
              PKR {((summary?.total_receivable || 45000) - (summary?.total_payable || 28000)).toLocaleString()}
            </p>
            <p style={{ color: '#555', fontSize: '13px', marginTop: '16px' }}>
              Overall net position
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}