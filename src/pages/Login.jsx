import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2, ShieldCheck, Globe, Zap, Fingerprint } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [otpMode, setOtpMode] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMode, setSuccessMode] = useState(false)
  
  // Forgot Password Flow
  const [forgotFlow, setForgotFlow] = useState(0) // 0: off, 1: enter email, 2: enter code, 3: enter new password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleAuth = async (e) => {
    e?.preventDefault()
    if (!email) return toast.error('Work email required')
    
    setLoading(true)

    if (otpMode) {
      if (!otpCode) {
        setLoading(false)
        return toast.error('Numeric security code is required.')
      }
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup' // or magiclink
      })

      if (error) {
         toast.error(error.message)
      } else {
         toast.success('Authentication clearance granted')
      }
      setLoading(false)
      return
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) toast.error(error.message)
      else toast.success('Authentication clearance granted')
    } else {
      if (!name) {
        setLoading(false)
        return toast.error('Legal name required')
      }
      if (!password) {
        setLoading(false)
         return toast.error('Security credential required')
      }
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name }, emailRedirectTo: window.location.origin }
      })
      if (error) toast.error(error.message)
      else if (data.session) toast.success('Account provisioned')
      else {
        setOtpMode(true)
        toast.success('A 6-digit numeric verification code has been dispatched. Enter it below to grant clearance.')
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

  const handleForgotPassSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (forgotFlow === 1) {
      if (!forgotEmail) { setLoading(false); return toast.error('Email required') }
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail)
      if (error) toast.error(error.message)
      else {
        toast.success('6-digit code sent to your email')
        setForgotFlow(2)
      }
    } 
    else if (forgotFlow === 2) {
      if (!forgotCode) { setLoading(false); return toast.error('Code required') }
      const { error } = await supabase.auth.verifyOtp({ email: forgotEmail, token: forgotCode, type: 'recovery' })
      if (error) toast.error('Invalid code')
      else {
        toast.success('Code confirmed, enter new password')
        setForgotFlow(3)
      }
    } 
    else if (forgotFlow === 3) {
      if (!newPassword) { setLoading(false); return toast.error('Password required') }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) toast.error(error.message)
      else {
        toast.success('Password changed securely! You can now login.')
        setForgotFlow(0)
      }
    }
    setLoading(false)
  }

  if (successMode) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-sans">
        <div className="bg-bg2 border border-border w-full max-w-lg rounded-[3rem] p-12 text-center shadow-3xl animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-bg/20 rounded-[2rem] flex items-center justify-center text-green-light mx-auto mb-8 shadow-xl shadow-green-light/5 border border-green-light/20">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-4 uppercase">Verify Gateway</h2>
          <p className="text-sm text-text3 font-bold leading-relaxed mb-10 opacity-70">
            A secure authentication link has been dispatched to <span className="text-white underline italic">{email}</span>. Please verify to access the KORA environment.
          </p>
          <button 
            onClick={() => setSuccessMode(false)} 
            className="w-full h-16 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
          >
            Return to Access Point
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex overflow-hidden font-sans relative">
      <Toaster position="top-right" />
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-light/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section (Desktop View) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-24 relative z-10">
        <div className="p-4 bg-bg2/40 border border-border w-fit rounded-2xl mb-8 backdrop-blur-md">
           <Zap size={24} className="text-blue fill-blue" />
        </div>
        <h1 className="text-[7rem] font-black text-white leading-[0.8] tracking-tighter mb-8">
          KORA<span className="text-blue">.</span>
        </h1>
        <p className="text-xl text-text2 font-bold max-w-lg leading-relaxed mb-12 opacity-80 uppercase tracking-tight">
          The high-fidelity financial operating system for <span className="text-white underline decoration-blue/30 underline-offset-8 decoration-4">elite enterprise sellers</span>.
        </p>
        
        <div className="space-y-6">
          {[
            { label: 'Real-time Liquidity Intelligence', icon: <Globe size={18}/> },
            { label: 'Multi-Store Synchronization Hub', icon: <Zap size={18}/> },
            { label: 'Predictive Ledger Architecture', icon: <ShieldCheck size={18}/> }
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-4 text-sm font-black text-white/50 hover:text-white transition-colors cursor-default group">
              <div className="w-10 h-10 rounded-xl bg-bg2/50 flex items-center justify-center group-hover:bg-blue/20 group-hover:text-blue transition-all border border-white/5">
                {f.icon}
              </div>
              <span className="uppercase tracking-[0.2em] text-[10px]">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Access Terminal Panel */}
      <div className="flex-1 lg:flex-none w-full lg:w-[600px] bg-bg2 border-l border-border flex items-center justify-center p-8 relative z-20 shadow-[-100px_0_100px_-50px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-md animate-in slide-in-from-right-8 duration-700">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-blue/10 border border-blue/20 rounded-md text-[9px] font-black text-blue uppercase tracking-widest leading-none">
                ENCRYPTED TRANSIT
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-light animate-pulse" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-2">
              {forgotFlow > 0 ? 'Recover Password' : (mode === 'login' ? 'System Access' : 'Create Credentials')}
            </h2>
            <p className="text-[10px] text-text3 font-black uppercase tracking-[0.3em] opacity-40">Enterprise Authorization Environment</p>
          </div>

          {forgotFlow > 0 ? (
            <form onSubmit={handleForgotPassSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               {forgotFlow === 1 && (
                 <div className="space-y-2 group">
                   <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Account Email</label>
                   <input 
                     type="email" 
                     placeholder="name@company.com" 
                     value={forgotEmail} 
                     onChange={e => setForgotEmail(e.target.value)} 
                     className="w-full h-14 bg-bg border-2 border-border focus:border-blue/30 rounded-2xl px-6 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/30 shadow-inner" 
                     autoFocus
                   />
                 </div>
               )}
               {forgotFlow === 2 && (
                 <div className="space-y-2 group">
                   <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Numeric Identity Code</label>
                   <input 
                     type="text" 
                     placeholder="------" 
                     maxLength={6}
                     value={forgotCode} 
                     onChange={e => setForgotCode(e.target.value.replace(/[^0-9]/g, ''))} 
                     className="w-full h-14 bg-bg border-2 border-border focus:border-blue/30 rounded-2xl px-6 text-xl tracking-[0.5em] text-center font-black text-white outline-none transition-all shadow-inner" 
                     autoFocus
                   />
                   <p className="text-[10px] text-blue font-bold text-center pt-2">Enter the 6-digit code dispatched to your inbox.</p>
                 </div>
               )}
               {forgotFlow === 3 && (
                 <div className="space-y-2 group">
                   <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">New Password</label>
                   <input 
                     type="password" 
                     placeholder="••••••••" 
                     value={newPassword} 
                     onChange={e => setNewPassword(e.target.value)} 
                     className="w-full h-14 bg-bg border-2 border-border focus:border-blue/30 rounded-2xl px-6 text-sm font-bold text-white outline-none transition-all shadow-inner" 
                     autoFocus
                   />
                 </div>
               )}

               <div className="flex gap-4">
                 <button 
                   type="button" 
                   onClick={() => setForgotFlow(0)} 
                   disabled={loading}
                   className="flex-1 h-16 bg-bg text-text3 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:text-white transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={loading} 
                   className="flex-1 h-16 bg-white text-black rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center transition-all shadow-xl shadow-white/5"
                 >
                   {loading ? 'Processing...' : (forgotFlow === 3 ? 'Save Password' : 'Confirm')}
                 </button>
               </div>
            </form>
          ) : (
          <form onSubmit={handleAuth} className="space-y-6">
            {otpMode ? (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                 <div className="space-y-2 group">
                   <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Numeric Identity Code</label>
                   <div className="relative">
                     <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text3 group-focus-within:text-white transition-colors"><ShieldCheck size={18} /></div>
                     <input 
                       type="text" 
                       placeholder="------" 
                       maxLength={6}
                       value={otpCode} 
                       onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} 
                       className="w-full h-14 bg-bg border-2 border-border focus:border-blue/30 rounded-2xl pl-14 pr-6 text-xl tracking-[0.5em] text-center font-black text-white outline-none transition-all shadow-inner" 
                     />
                   </div>
                   <p className="text-[10px] text-blue font-bold text-center pt-2">Enter the 6-digit code dispatched to your inbox.</p>
                 </div>
              </div>
            ) : (
             <>
               {mode === 'signup' && (
                 <div className="space-y-2 group">
                   <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Legal Identity</label>
                   <div className="relative">
                     <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text3 group-focus-within:text-white transition-colors"><User size={18} /></div>
                     <input 
                       type="text" 
                       placeholder="Authorized User Name" 
                       value={name} 
                       onChange={e => setName(e.target.value)} 
                       className="w-full h-14 bg-bg border-2 border-border focus:border-blue/30 rounded-2xl pl-14 pr-6 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/30 shadow-inner" 
                     />
                   </div>
                 </div>
               )}

               <div className="space-y-2 group">
                 <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Secure Email</label>
                 <div className="relative">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text3 group-focus-within:text-white transition-colors"><Mail size={18} /></div>
                   <input 
                     type="email" 
                     placeholder="name@company.com" 
                     value={email} 
                     onChange={e => setEmail(e.target.value)} 
                     className="w-full h-14 bg-bg border-2 border-border focus:border-blue/30 rounded-2xl pl-14 pr-6 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/30 shadow-inner" 
                     disabled={otpMode}
                   />
                 </div>
               </div>

               <div className="space-y-2 group">
                 <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Password Key</label>
                 <div className="relative">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text3 group-focus-within:text-white transition-colors"><Lock size={18} /></div>
                   <input 
                     type={showPassword ? 'text' : 'password'} 
                     placeholder="••••••••" 
                     value={password} 
                     onChange={e => setPassword(e.target.value)} 
                     className="w-full h-14 bg-bg border-2 border-border focus:border-blue/30 rounded-2xl pl-14 pr-14 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/30 shadow-inner" 
                   />
                   <button 
                     type="button" 
                     onClick={() => setShowPassword(!showPassword)} 
                     className="absolute right-5 top-1/2 -translate-y-1/2 text-text3 hover:text-white transition-colors"
                   >
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
                 {mode === 'login' && (
                   <div className="text-right pt-2">
                     <button type="button" onClick={() => { setForgotFlow(1); setForgotEmail(email); }} className="text-[10px] text-blue font-bold tracking-widest uppercase hover:text-white transition-colors">
                       Forget Password?
                     </button>
                   </div>
                 )}
               </div>
             </>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-16 bg-white text-black rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-white/5 mt-4 group"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                   <div className="w-4 h-4 border-2 border-black border-r-transparent rounded-full animate-spin" />
                   Clearance Pending...
                </div>
              ) : (
                <>
                  {mode === 'login' ? 'Initiate System Access' : 'Register Terminal'}
                  <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          )}

          {/* Social Auth Separator */}
          <div className="my-10 flex items-center gap-6">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-[9px] text-text3 font-black uppercase tracking-widest whitespace-nowrap opacity-40">Identity Gateway</span>
            <div className="flex-1 h-px bg-border/40" />
          </div>

          <button 
            onClick={signInWithGoogle} 
            className="w-full h-14 bg-bg hover:bg-bg3 border border-border rounded-2xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-widest text-text2 hover:text-white transition-all group"
          >
            <div className="bg-white p-1 rounded-lg scale-90 group-hover:scale-100 transition-transform">
               <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </div>
            Direct Authorization via Google
          </button>

          {/* Mode Switcher */}
          <div className="mt-12 text-center p-6 bg-bg/40 rounded-[2rem] border border-border/50">
            <p className="text-xs font-bold text-text3 mb-3">
              {mode === 'login' ? "Unauthorized on KORA?" : "Active credentials assigned?"}
            </p>
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
              className="text-[11px] font-black uppercase tracking-widest text-white hover:text-blue transition-colors flex items-center justify-center gap-3 mx-auto w-fit"
            >
              {mode === 'login' ? <><Fingerprint size={16} /> Establish Provisioning</> : <><ShieldCheck size={16} /> Enter Gateway</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}