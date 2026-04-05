import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { getCroppedImg } from '../utils/cropImage'
import { 
  User, Mail, ArrowRight, Trash2, Camera, CheckCircle2, ShieldCheck, ArrowLeft, X, Lock
} from 'lucide-react'

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const [loading, setLoading] = useState(false)

  // Advanced Security Flows (0=closed, 1=current email, 2=verify code, 3=new value)
  const [nameFlow, setNameFlow] = useState(0)
  const [tempName, setTempName] = useState('')

  const [emailFlow, setEmailFlow] = useState(0)
  const [tempCurrentEmail, setTempCurrentEmail] = useState('')
  const [tempCode, setTempCode] = useState('')
  const [tempNewEmail, setTempNewEmail] = useState('')

  const [passFlow, setPassFlow] = useState(0)
  const [tempNewPass, setTempNewPass] = useState('')

  // Crop State
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isCropping, setIsCropping] = useState(false)

  useEffect(() => {
    if (user) {
      setTempName(user.user_metadata?.full_name || '')
    }
  }, [user])

  // Profile Updates
  const handleUpdateName = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: tempName } })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Name updated successfully!')
      setNameFlow(0)
      await supabase.auth.refreshSession()
      window.location.reload()
    }
    setLoading(false)
  }

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')

    const reader = new FileReader()
    reader.onloadend = () => {
      setImageSrc(reader.result)
      setIsCropping(true)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropConfirm = async () => {
    try {
      setLoading(true)
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels)
      
      const { error } = await supabase.from('profiles').update({ avatar_url: croppedImageBase64 }).eq('id', profile.id)
      if (error) { 
         toast.error(error.message)
      } else {
         toast.success('Profile picture perfectly cropped and updated!')
         setIsCropping(false)
         setImageSrc(null)
         await supabase.auth.refreshSession()
         window.location.reload()
      }
    } catch (e) {
      toast.error("Error cropping image.")
    } finally {
      setLoading(false)
    }
  }

  // Email Update Flow Handlers
  const handleEmailStep1 = async (e) => {
    e.preventDefault()
    if (!tempCurrentEmail) return toast.error('Enter current email')
    if (tempCurrentEmail !== user?.email) return toast.error('Incorrect current email')
    
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(tempCurrentEmail)
    if (error) toast.error(error.message)
    else {
      toast.success('Security code sent to your current email!')
      setEmailFlow(2)
    }
    setLoading(false)
  }

  const handleEmailStep2 = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email: tempCurrentEmail, token: tempCode, type: 'recovery' })
    if (error) toast.error('Invalid code. Try again.')
    else {
      toast.success('Code confirmed!')
      setTempCode('')
      setEmailFlow(3)
    }
    setLoading(false)
  }

  const handleEmailStep3 = async (e) => {
    e.preventDefault()
    if (!tempNewEmail) return toast.error('Enter your new email address')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ email: tempNewEmail })
    if (error) toast.error(error.message)
    else {
      toast.success('Email changed successfully!')
      setEmailFlow(0)
      await supabase.auth.refreshSession()
    }
    setLoading(false)
  }

  // Password Update Flow Handlers
  const handlePassStep1 = async (e) => {
    e.preventDefault()
    if (!tempCurrentEmail) return toast.error('Enter current email to begin')
    if (tempCurrentEmail !== user?.email) return toast.error('Incorrect current email')
    
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(tempCurrentEmail)
    if (error) toast.error(error.message)
    else {
      toast.success('Security code sent to your email!')
      setPassFlow(2)
    }
    setLoading(false)
  }

  const handlePassStep2 = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email: tempCurrentEmail, token: tempCode, type: 'recovery' })
    if (error) toast.error('Invalid code.')
    else {
      toast.success('Code confirmed!')
      setTempCode('')
      setPassFlow(3)
    }
    setLoading(false)
  }

  const handlePassStep3 = async (e) => {
    e.preventDefault()
    if (!tempNewPass) return toast.error('Enter a new password')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: tempNewPass })
    if (error) toast.error(error.message)
    else {
      toast.success('Password changed securely!')
      setPassFlow(0)
    }
    setLoading(false)
  }

  const handleDeleteData = async () => {
    if (window.confirm("WARNING: This will permanently delete your account and all data. Are you absolutely certain?")) {
      const { error } = await supabase.rpc('delete_user_account')
      if (error) toast.error("Backend function missing. Configure delete_user_account RPC in Supabase first.")
      else {
        toast.success("Account wiped.")
        signOut()
        navigate('/login')
      }
    }
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-xl mx-auto pb-20">
      
      {/* Cropper Modal */}
      {isCropping && (
        <div className="fixed inset-0 z-[9999] bg-bg/95 backdrop-blur flex flex-col pt-10 px-4 md:px-[10vw]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Crop Profile Photo</h2>
            </div>
            <button onClick={() => setIsCropping(false)} className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="relative flex-1 bg-black rounded-3xl overflow-hidden border border-border shadow-2xl mb-6">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="pb-10 flex gap-4">
             <button onClick={() => setIsCropping(false)} className="flex-1 h-14 bg-bg2 border border-border hover:bg-bg3 text-xs font-bold text-text2 hover:text-white rounded-xl transition-colors flex items-center justify-center">
               Cancel
             </button>
             <button onClick={handleCropConfirm} disabled={loading} className="flex-1 h-14 bg-white text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2">
               <CheckCircle2 size={18} /> Apply Photo
             </button>
          </div>
        </div>
      )}


      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Profile</h1>
        <p className="text-xs text-text2">Manage your account and settings.</p>
      </div>

      <div className="flex flex-col gap-0.5 rounded-3xl overflow-hidden bg-border">
        
        {/* Profile Photo */}
        <div className="bg-bg2 p-6 flex flex-col items-center sm:flex-row sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-bg border border-border flex items-center justify-center text-xl font-bold text-white overflow-hidden relative">
              {(profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
                <img src={profile?.avatar_url || user?.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-text3" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">Profile Photo</p>
              <p className="text-xs text-text3">Upload an image from your desktop</p>
            </div>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="px-5 h-10 bg-white text-black text-xs font-bold rounded-xl transition-all flex items-center gap-2 mt-4 sm:mt-0">
             <Camera size={14} /> Upload Photo
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarSelect} className="hidden" />
        </div>

        {/* Name Section */}
        <div className="bg-bg2 p-6">
          {!nameFlow ? (
             <div className="flex items-center justify-between cursor-pointer w-full group" onClick={() => { setNameFlow(1); setEmailFlow(0); setPassFlow(0); }}>
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-bg flex items-center justify-center text-text2"><User size={16}/></div>
                 <div className="text-left">
                   <p className="text-sm font-bold text-white">Change Name</p>
                   <p className="text-xs text-text3">{user?.user_metadata?.full_name || 'Not set'}</p>
                 </div>
               </div>
               <div className="text-xs font-bold text-text3 group-hover:text-white transition-colors bg-bg px-4 py-2 rounded-xl border border-border">Modify</div>
             </div>
          ) : (
            <div className="animate-in slide-in-from-top-2 p-1">
              <button onClick={() => setNameFlow(0)} className="text-xs font-bold text-text3 hover:text-white flex items-center gap-1 mb-4">
                 <ArrowLeft size={14}/> Back
              </button>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <p className="text-sm font-bold text-white">What is your new business name?</p>
                <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="w-full h-12 bg-bg border border-border focus:border-white/20 rounded-xl px-4 text-sm text-white outline-none" autoFocus />
                <button type="submit" disabled={loading} className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors">Save Name</button>
              </form>
            </div>
          )}
        </div>

        {/* Email Section */}
        <div className="bg-bg2 p-6">
          {!emailFlow ? (
             <div className="flex items-center justify-between cursor-pointer w-full group" onClick={() => { setEmailFlow(1); setTempCurrentEmail(''); setNameFlow(0); setPassFlow(0); }}>
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-bg flex items-center justify-center text-text2"><Mail size={16}/></div>
                 <div className="text-left">
                   <p className="text-sm font-bold text-white">Change Email</p>
                   <p className="text-xs text-text3">{user?.email}</p>
                 </div>
               </div>
               <div className="text-xs font-bold text-text3 group-hover:text-white transition-colors bg-bg px-4 py-2 rounded-xl border border-border">Modify</div>
             </div>
          ) : (
            <div className="animate-in slide-in-from-top-2 p-1">
              <button onClick={() => setEmailFlow(0)} className="text-xs font-bold text-text3 hover:text-white flex items-center gap-1 mb-4">
                 <ArrowLeft size={14}/> Back
              </button>
              
              {emailFlow === 1 && (
                <form onSubmit={handleEmailStep1} className="space-y-4">
                  <p className="text-sm font-bold text-white">Enter your current email</p>
                  <input type="email" value={tempCurrentEmail} onChange={e => setTempCurrentEmail(e.target.value)} className="w-full h-12 bg-bg border border-border focus:border-white/20 rounded-xl px-4 text-sm text-white outline-none" autoFocus />
                  <button type="submit" disabled={loading} className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl">Send Code</button>
                </form>
              )}
              {emailFlow === 2 && (
                <form onSubmit={handleEmailStep2} className="space-y-4">
                  <p className="text-sm font-bold text-white">Enter the code from your email</p>
                  <input type="text" maxLength={6} value={tempCode} onChange={e => setTempCode(e.target.value.replace(/[^0-9]/g, ''))} className="w-full h-12 bg-bg border border-border focus:border-white/20 rounded-xl text-center text-xl tracking-[0.5em] font-bold text-white outline-none" autoFocus />
                  <button type="submit" disabled={loading} className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl">Confirm Code</button>
                </form>
              )}
              {emailFlow === 3 && (
                <form onSubmit={handleEmailStep3} className="space-y-4">
                  <p className="text-sm font-bold text-white">Enter your new email</p>
                  <input type="email" value={tempNewEmail} onChange={e => setTempNewEmail(e.target.value)} className="w-full h-12 bg-bg border border-border focus:border-white/20 rounded-xl px-4 text-sm text-white outline-none" autoFocus />
                  <button type="submit" disabled={loading} className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl">Link New Email</button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Password Section */}
        <div className="bg-bg2 p-6">
          {!passFlow ? (
             <div className="flex items-center justify-between cursor-pointer w-full group" onClick={() => { setPassFlow(1); setTempCurrentEmail(''); setEmailFlow(0); setNameFlow(0); }}>
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-bg flex items-center justify-center text-text2"><Lock size={16}/></div>
                 <div className="text-left">
                   <p className="text-sm font-bold text-white">Change Password</p>
                   <p className="text-xs text-text3">Update your password</p>
                 </div>
               </div>
               <div className="text-xs font-bold text-text3 group-hover:text-white transition-colors bg-bg px-4 py-2 rounded-xl border border-border">Modify</div>
             </div>
          ) : (
            <div className="animate-in slide-in-from-top-2 p-1">
              <button onClick={() => setPassFlow(0)} className="text-xs font-bold text-text3 hover:text-white flex items-center gap-1 mb-4">
                 <ArrowLeft size={14}/> Back
              </button>
              
              {passFlow === 1 && (
                <form onSubmit={handlePassStep1} className="space-y-4">
                  <p className="text-sm font-bold text-white">Enter your current email</p>
                  <input type="email" value={tempCurrentEmail} onChange={e => setTempCurrentEmail(e.target.value)} className="w-full h-12 bg-bg border border-border focus:border-white/20 rounded-xl px-4 text-sm text-white outline-none" autoFocus />
                  <button type="submit" disabled={loading} className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl">Send Code</button>
                </form>
              )}
              {passFlow === 2 && (
                <form onSubmit={handlePassStep2} className="space-y-4">
                  <p className="text-sm font-bold text-white">Enter the code from your email</p>
                  <input type="text" maxLength={6} value={tempCode} onChange={e => setTempCode(e.target.value.replace(/[^0-9]/g, ''))} className="w-full h-12 bg-bg border border-border focus:border-white/20 rounded-xl text-center text-xl tracking-[0.5em] font-bold text-white outline-none" autoFocus />
                  <button type="submit" disabled={loading} className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl">Confirm Code</button>
                </form>
              )}
              {passFlow === 3 && (
                <form onSubmit={handlePassStep3} className="space-y-4">
                  <p className="text-sm font-bold text-white">Enter your new password</p>
                  <input type="password" value={tempNewPass} onChange={e => setTempNewPass(e.target.value)} className="w-full h-12 bg-bg border border-border focus:border-white/20 rounded-xl px-4 text-sm text-white outline-none" autoFocus />
                  <button type="submit" disabled={loading} className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl">Change Password</button>
                </form>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="mt-12 mb-6">
        <h2 className="text-lg font-bold text-red-500 mb-1">Danger Zone</h2>
        <p className="text-xs text-text3 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <button onClick={handleDeleteData} className="px-5 h-12 bg-bg border border-red-500/30 hover:bg-red-500/10 text-xs font-bold text-red-500 rounded-xl transition-all flex items-center justify-center gap-2">
          <Trash2 size={16} /> Delete Data
        </button>
      </div>
      
    </div>
  )
}
