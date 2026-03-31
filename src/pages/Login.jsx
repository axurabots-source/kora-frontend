import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMode, setSuccessMode] = useState(false)

  const handleAuth = async (e) => {
    e?.preventDefault()
    if (!email) return toast.error('Enter your email address')
    if (!password) return toast.error('Enter a password')
    if (mode === 'signup' && !name) return toast.error('Please enter your full name')
    if (mode === 'signup' && password.length < 6) return toast.error('Password must be at least 6 characters')
    
    setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message.includes('Invalid login') ? 'Invalid email or password' : error.message)
      } else {
        toast.success('Access granted')
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name }, emailRedirectTo: window.location.origin }
      })
      if (error) {
        toast.error(error.message)
      } else {
        if (data.session) toast.success('Account created')
        else setSuccessMode(true)
      }
    }
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: window.location.origin }
    })
    if (error) toast.error(error.message)
  }

  if (successMode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={48} color="var(--green-light)" /></div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>Verify your identity</h2>
          <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6', marginBottom: '32px' }}>We sent a secure link to {email}. Please verify to start using KORA.</p>
          <button onClick={() => setSuccessMode(false)} className="btn btn-primary" style={{ width: '100%' }}>Back to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Toaster position="top-right" />

      {/* Left Feature Showcase (Desktop Only) */}
      <div style={{ flex: 1, maxWidth: '400px', paddingRight: '64px' }} className="desktop-only">
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: 'var(--text)', letterSpacing: '-2px', marginBottom: '16px' }}>KORA</h1>
        <p style={{ color: 'var(--text2)', fontSize: '18px', marginBottom: '40px' }}>The high-performance financial operating system for local sellers.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {['Predictive Ledger & Analytics', 'Automated WooSync', 'Order Processing Core', 'Secure Shipment Flow'].map(f => (
            <div key={f} style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text2)', fontWeight: '500' }}>
              <CheckCircle2 size={16} color="var(--green-light)" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Auth Card */}
      <div style={{ width: '100%', maxWidth: '420px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px', boxShadow: 'var(--shadow-lg)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', marginBottom: '4px' }}>
          {mode === 'login' ? 'System Login' : 'Create Account'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: '600', marginBottom: '32px' }}>Enterprise-grade financial dashboard</p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'signup' && (
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="input" style={{ paddingLeft: '44px', width: '100%' }} />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input type="email" placeholder="Work Email" value={email} onChange={e => setEmail(e.target.value)} className="input" style={{ paddingLeft: '44px', width: '100%' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input type={showPassword ? 'text' : 'password'} placeholder="Secure Password" value={password} onChange={e => setPassword(e.target.value)} className="input" style={{ paddingLeft: '44px', paddingRight: '44px', width: '100%' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px', gap: '12px' }}>
            {loading ? 'Processing...' : (
              <><span>{mode === 'login' ? 'Login to Dashboard' : 'Finish Registration'}</span> <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div style={{ margin: '32px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: '800', letterSpacing: '1px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <button onClick={signInWithGoogle} className="btn btn-ghost" style={{ width: '100%', padding: '12px', background: 'var(--bg3)', borderRadius: '12px', gap: '10px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text2)', marginTop: '32px' }}>
          {mode === 'login' ? "Need a platform account?" : "Existing user?"}{' '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
            {mode === 'login' ? 'Sign up' : 'Access system'}
          </button>
        </p>
      </div>
    </div>
  )
}