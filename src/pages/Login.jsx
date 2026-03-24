import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)

  const sendOTP = async () => {
    if (!email) return toast.error('Enter your email')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) toast.error(error.message)
    else { toast.success('OTP sent to your email!'); setStep('otp') }
    setLoading(false)
  }

  const verifyOTP = async () => {
    if (!otp) return toast.error('Enter the OTP')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) toast.error(error.message)
    else toast.success('Welcome to KORA!')
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
        width: '100%', maxWidth: '400px', border: '1px solid #2a2a2a'
      }}>
        <h1 style={{ color: '#fff', fontSize: '28px', marginBottom: '8px' }}>KORA</h1>
        <p style={{ color: '#888', marginBottom: '32px' }}>Your digital khata book</p>

        {step === 'email' ? (
          <>
            <label style={{ color: '#aaa', fontSize: '14px' }}>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '12px', marginTop: '8px', marginBottom: '16px',
                background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px',
                color: '#fff', fontSize: '16px', boxSizing: 'border-box'
              }}
            />
            <button
              onClick={sendOTP}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', background: '#7F77DD',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '16px', cursor: 'pointer', marginBottom: '12px'
              }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
              OTP sent to {email}
            </p>
            <label style={{ color: '#aaa', fontSize: '14px' }}>Enter OTP</label>
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              style={{
                width: '100%', padding: '12px', marginTop: '8px', marginBottom: '16px',
                background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px',
                color: '#fff', fontSize: '16px', boxSizing: 'border-box'
              }}
            />
            <button
              onClick={verifyOTP}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', background: '#7F77DD',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '16px', cursor: 'pointer', marginBottom: '12px'
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={() => setStep('email')}
              style={{
                width: '100%', padding: '12px', background: 'transparent',
                color: '#888', border: '1px solid #333', borderRadius: '8px',
                fontSize: '14px', cursor: 'pointer'
              }}
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}