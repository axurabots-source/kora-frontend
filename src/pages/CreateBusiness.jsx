import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { Building2, Rocket, ArrowRight, Globe, ShieldCheck, Zap, ChevronRight } from 'lucide-react'

export default function CreateBusiness() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'shop', currency: 'PKR' })

  const createBusiness = async () => {
    if (!form.name) return toast.error('Enterprise name identification required')
    setLoading(true)
    try {
      const { error } = await supabase.from('businesses').insert({ owner_id: profile.id, ...form })
      if (error) throw error
      toast.success('Enterprise Environment Provisioned')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-green-light/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-xl animate-in zoom-in-95 duration-700">
        <div className="bg-bg2 border border-border rounded-[4rem] p-12 md:p-16 shadow-3xl relative overflow-hidden group">
          {/* Subtle Iconography */}
          <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
             <Building2 size={160} strokeWidth={1} />
          </div>

          {/* Header */}
          <div className="mb-12 relative">
             <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-blue-bg/20 flex items-center justify-center text-blue border border-blue/10 shadow-lg shadow-blue/5">
                 <Rocket size={24} />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-1">Provision Enterprise</h2>
                  <p className="text-[10px] font-black text-text3 uppercase tracking-[0.3em] opacity-60">System Initialization Flow</p>
               </div>
             </div>
             <p className="text-sm text-text2 font-bold leading-relaxed max-w-sm">
               Define your business parameters to initialize your high-fidelity financial dashboard.
             </p>
          </div>

          {/* Form Pipeline */}
          <div className="space-y-8 relative">
            <div className="space-y-3 group">
              <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1 flex items-center gap-2">
                <Building2 size={12} /> Registered Business Name
              </label>
              <input 
                type="text" 
                placeholder="e.g. Ahmed Elite Traders" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                className="w-full h-16 bg-bg border-2 border-border focus:border-blue/30 rounded-[1.5rem] px-8 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/20 shadow-inner" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Economic Sector</label>
                <div className="relative">
                  <select 
                    value={form.type} 
                    onChange={e => setForm({ ...form, type: e.target.value })} 
                    className="w-full h-16 bg-bg border-2 border-border focus:border-blue/30 rounded-[1.5rem] px-8 text-sm font-bold text-white outline-none appearance-none cursor-pointer transition-all uppercase tracking-widest select-none"
                  >
                    <option value="shop">Direct Retail / Shop</option>
                    <option value="wholesale">B2B Wholesale</option>
                    <option value="agency">Service Agency</option>
                    <option value="ecommerce">Pure E-Commerce</option>
                    <option value="other">Other High-Yield</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-text3 pointer-events-none rotate-90" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1 flex items-center gap-2">
                  <Globe size={12}/> Functional Currency
                </label>
                <div className="relative">
                  <select 
                    value={form.currency} 
                    onChange={e => setForm({ ...form, currency: e.target.value })} 
                    className="w-full h-16 bg-bg border-2 border-border focus:border-blue/30 rounded-[1.5rem] px-8 text-sm font-bold text-white outline-none appearance-none cursor-pointer transition-all uppercase tracking-widest select-none"
                  >
                    <option value="PKR">PKR — Pakistan Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="AED">AED — UAE Dirham</option>
                    <option value="SAR">SAR — Saudi Riyal</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-text3 pointer-events-none rotate-90" />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={createBusiness} 
                disabled={loading} 
                className="w-full h-18 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-4 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-2xl shadow-white/5 group disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-black border-r-transparent rounded-full animate-spin" />
                    Initializing Environment...
                  </div>
                ) : (
                  <>
                    Initialize Enterprise Instance
                    <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="mt-12 pt-8 border-t border-border flex items-center justify-between opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
             <div className="flex items-center gap-2 text-[9px] font-black text-text3 uppercase tracking-widest">
               <ShieldCheck size={14} className="text-green-light" /> Encrypted Provisioning Active
             </div>
             <div className="flex items-center gap-2 text-[9px] font-black text-text3 uppercase tracking-widest">
               <Zap size={14} className="text-blue" /> High-Performance Nodes
             </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-black text-text3 uppercase tracking-[0.3em] opacity-40">
           Part of the KORA High-Fidelity OS Ecosystem
        </p>
      </div>
    </div>
  )
}