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
  const [successMode, setSuccessMode] = useState(false) // For email confirmation message

  const handleAuth = async (e) => {
    e?.preventDefault()
    if (!email) return toast.error('Enter your email address')
    if (!password) return toast.error('Enter a password')
    if (mode === 'signup' && !name) return toast.error('Please enter your full name')
    if (mode === 'signup' && password.length < 6) return toast.error('Password must be at least 6 characters')
    
    setLoading(true)
    
    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Incorrect email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Email not confirmed. Please check your inbox!')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.success('Welcome back to KORA!')
      }
    } else {
      // SIGN UP
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin
        }
      })
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Account already exists with this email. Try signing in!')
          setMode('login') 
        } else {
          toast.error(error.message)
        }
      } else {
        // Create profile entry
        if (data.user) {
          try {
            await supabase.from('profiles').upsert({
              auth_user_id: data.user.id,
              full_name: name,
              email: email
            }, { onConflict: 'auth_user_id' })
          } catch (pErr) { console.warn(pErr) }
        }
        
        if (data.session) {
          toast.success('Account created and logged in!')
        } else {
          setSuccessMode(true)
          toast.success('Sign up successful!')
        }
      }
    }
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      })
      if (error) throw error
    } catch (err) {
      toast.error('Google login requires setup in your Supabase Dashboard')
    }
  }

  // If in Success mode, show confirmation instructions
  if (successMode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '440px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '24px', padding: '48px', textAlign: 'center' }}>
          <CheckCircle2 size={64} color="var(--green-light)" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', marginBottom: '12px' }}>Verify your email</h2>
          <p style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: '1.6', marginBottom: '32px' }}>
            We've sent a confirmation link to <strong style={{color: 'var(--text)'}}>{email}</strong>. Check your inbox to activate your account.
          </p>
          <button onClick={() => setSuccessMode(false)} className="btn btn-primary btn-lg" style={{ width: '100%' }}>Back to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: '13px' } }} />

      {/* Left Branding */}
      <div style={{ flex: 1, maxWidth: '480px', padding: '48px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="desktop-only">
        <div>
          <div style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text)', letterSpacing: '-2.5px', lineHeight: 1 }}>KORA</div>
          <p style={{ color: 'var(--text2)', fontSize: '16px', marginTop: '12px', fontWeight: '500' }}>Build your Pakistani seller empire.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {['Visual Ledger & Analytics', 'WooCommerce Auto-Sync', 'Shipment Automation', 'WhatsApp Order Parser'].map(f => (
            <div key={f} style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text2)', fontSize: '14px' }}>
              <CheckCircle2 size={16} color="var(--green-light)" /> {f}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '440px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '24px', padding: '48px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.8px', marginBottom: '8px' }}>
            {mode === 'login' ? 'Sign in to KORA' : 'Create account'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
            {mode === 'login' ? 'Welcome back! Manage your shop with ease' : 'Join 500+ sellers winning with KORA'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mode === 'signup' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text3)' }} />
                <input type="text" placeholder="e.g. Ahmed Ali" value={name} onChange={e => setName(e.target.value)} className="input" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text3)' }} />
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="input" style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text3)' }} />
              <input type={showPassword ? 'text' : 'password'} placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} className="input" style={{ paddingLeft: '40px', paddingRight: '40px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: 'var(--text3)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Working...' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '700' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <button type="button" onClick={signInWithGoogle} className="btn btn-ghost" style={{ width: '100%', padding: '12px', background: 'var(--bg3)', borderRadius: '12px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text2)', marginTop: '24px' }}>
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setLoading(false); }} style={{ background: 'none', border: 'none', color: 'var(--green-light)', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}