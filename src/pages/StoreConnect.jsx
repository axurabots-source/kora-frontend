import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Store, CheckCircle, AlertCircle, RefreshCw, Link2, ShieldCheck, Globe, Key, Settings2, Trash2, ExternalLink } from 'lucide-react'

// Professional Services & Utils
import { ecomService, businessService } from '../services/api.service'

export default function StoreConnect() {
  const { profile } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [store, setStore] = useState(null)
  const [form, setForm] = useState({ store_url: '', api_key: '', api_secret: '' })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { 
    if (profile) {
      businessService.list(profile.id).then(data => {
        setBusinesses(data)
        if (data.length > 0) setSelectedBusiness(data[0].id)
      })
    } 
  }, [profile])

  useEffect(() => { 
    if (selectedBusiness) fetchStore() 
  }, [selectedBusiness])

  const fetchStore = async () => {
    try {
      const data = await ecomService.getStore(selectedBusiness)
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
      await ecomService.testConnection(form)
      toast.success('✅ REST API Handshake Successful!')
    } catch {
      toast.error('❌ Connection failed — verify your API keys')
    } finally {
      setTesting(false)
    }
  }

  const connectStore = async () => {
    if (!form.store_url || !form.api_key || !form.api_secret) {
      return toast.error('Incomplete credentials')
    }
    setLoading(true)
    try {
      await ecomService.connectStore(selectedBusiness, form)
      toast.success('WooCommerce Store Virtualized!')
      fetchStore()
      setForm({ store_url: '', api_key: '', api_secret: '' })
    } catch {
      toast.error('Failed to establish connection')
    } finally {
      setLoading(false)
    }
  }

  const syncNow = async () => {
    setSyncing(true)
    try {
      await ecomService.syncOrders(selectedBusiness)
      toast.success('Data stream synchronized!')
      fetchStore()
    } catch {
      toast.error('Sync pipeline interrupted')
    } finally {
      setSyncing(false)
    }
  }

  const disconnectStore = async () => {
    if (!confirm('Abort this connection? All synced order records will persist but no new data will flow.')) return
    try {
      await ecomService.detachStore(selectedBusiness)
      toast.success('Link Terminated')
      setStore(null)
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Store Connect</h1>
          <p className="text-sm text-text2 uppercase tracking-widest font-bold opacity-60">Authorize and manage external ecommerce integrations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start max-w-[1100px]">
        {/* Left: Configuration Panel */}
        <div className="bg-bg2 border border-border rounded-[3rem] p-10 shadow-2xl relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Globe size={180} strokeWidth={1} />
          </div>

          <div className="flex items-center gap-4 mb-10 relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-bg/20 flex items-center justify-center text-blue border border-blue/10 shadow-lg shadow-blue/5">
              <Store size={22} />
            </div>
            <div>
              <p className="text-lg font-black text-white tracking-tight">WooCommerce Integration</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-text3 uppercase tracking-widest leading-none">v3.0 REST API</span>
                <div className="w-1 h-1 rounded-full bg-text3/30" />
                <span className="text-[10px] font-black text-blue uppercase tracking-widest leading-none italic">Secure Handshake</span>
              </div>
            </div>
          </div>

          {store ? (
            <div className="space-y-8 relative">
              {/* Connected State Insight */}
              <div className="bg-bg p-8 rounded-[2rem] border border-green-light/20 shadow-xl shadow-green-light/5 flex items-center justify-between group/status">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-full bg-green-bg/20 flex items-center justify-center text-green-light border border-green-light/20 relative">
                      <CheckCircle size={24} />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-light rounded-full border-2 border-bg animate-ping" />
                   </div>
                   <div>
                      <p className="text-xs font-black text-green-light uppercase tracking-widest mb-1">Status: Operational</p>
                      <p className="text-sm font-bold text-white tracking-tight truncate max-w-[200px]">{store.store_url}</p>
                   </div>
                </div>
                <div className="text-right hidden sm:block">
                   <p className="text-[9px] font-black text-text3 uppercase tracking-widest mb-1 opacity-60">Sync Latency</p>
                   <p className="text-[11px] font-extrabold text-text2 uppercase tracking-tighter">
                    {store.last_sync ? `Synced ${new Date(store.last_sync).toLocaleDateString()}` : 'Initial Load Pending'}
                   </p>
                </div>
              </div>

              {/* Connected Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={syncNow} 
                  disabled={syncing} 
                  className="h-14 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Synchronizing...' : 'Sync Live Orders'}
                </button>
                <button 
                  onClick={disconnectStore} 
                  className="h-14 rounded-2xl bg-bg border border-border text-text3 hover:text-red-light hover:border-red-light/30 transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  <Trash2 size={16} />
                  Terminate Link
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Store Endpoint Hub</label>
                <div className="relative">
                  <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-text3" size={16} />
                  <input
                    type="url"
                    placeholder="https://your-online-store.com"
                    value={form.store_url}
                    onChange={e => setForm({ ...form, store_url: e.target.value })}
                    className="w-full h-14 bg-bg3 border-2 border-transparent focus:border-white/10 rounded-2xl pl-14 pr-6 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/30"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1 flex items-center gap-2">
                   <Key size={10} /> Authorized Consumer ID
                </label>
                <input
                  type="text"
                  placeholder="ck_..."
                  value={form.api_key}
                  onChange={e => setForm({ ...form, api_key: e.target.value })}
                  className="w-full h-14 bg-bg3 border-2 border-transparent focus:border-white/10 rounded-2xl px-6 text-sm font-mono text-white/50 focus:text-white outline-none transition-all placeholder:text-text3/30"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1 flex items-center gap-2">
                   <ShieldCheck size={10} /> Consumer Secret Token
                </label>
                <input
                  type="password"
                  placeholder="cs_..."
                  value={form.api_secret}
                  onChange={e => setForm({ ...form, api_secret: e.target.value })}
                  className="w-full h-14 bg-bg3 border-2 border-transparent focus:border-white/10 rounded-2xl px-6 text-sm font-mono text-white/50 focus:text-white outline-none transition-all placeholder:text-text3/30 font-password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <button 
                  onClick={testConnection} 
                  disabled={testing} 
                  className="h-16 rounded-[1.5rem] bg-bg3 border border-border text-text2 hover:text-white transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  {testing ? 'Testing Hub...' : 'Test Handshake'}
                </button>
                <button 
                  onClick={connectStore} 
                  disabled={loading} 
                  className="h-16 rounded-[1.5rem] bg-white text-black hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-white/5"
                >
                   {loading ? 'Initializing...' : 'Establish Connection'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Intelligence & Documentation */}
        <div className="space-y-6">
          <div className="bg-bg2 border border-border rounded-[3rem] p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <Settings2 size={16} />
               </div>
               <h3 className="text-sm font-black text-white uppercase tracking-widest">Auth Initialization Guide</h3>
            </div>
            
            <div className="space-y-8">
              {[
                { step: '01', title: 'Admin Entry', desc: 'Securely authenticate as Administrator in your WordPress Backend.' },
                { step: '02', title: 'REST Protocol', desc: 'Navigate through WooCommerce → Settings → Advanced → REST API.' },
                { step: '03', title: 'Token Creation', desc: 'Execute "Add Key" and label as "KORA" for identification.' },
                { step: '04', title: 'Read / Write', desc: 'Essential: Deploy permissions as "Read/Write" for full synchronization.' },
                { step: '05', title: 'Virtualize', desc: 'Deploy the CK and CS keys above to create your digital storefront twin.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="text-xl font-black text-text3/20 group-hover:text-blue/30 transition-colors tabular-nums mt-[-4px] select-none">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">{item.title}</p>
                    <p className="text-xs font-bold text-text3 italic leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hosting Optimization Alert */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-[2rem] p-8 shadow-xl shadow-yellow-500/5">
             <div className="flex items-center gap-3 mb-4">
               <AlertCircle size={18} className="text-yellow-500" />
               <p className="text-[11px] font-black text-yellow-500 uppercase tracking-widest italic">Host Infrastructure Troubleshooting</p>
             </div>
             <p className="text-[12px] font-bold text-text2 leading-relaxed opacity-80">
               Encountering a <span className="text-white">404</span> or <span className="text-white">Auth Required</span>? Ensure your Permalinks are set to <span className="text-white underline italic">Post Name</span>.
             </p>
             <button className="flex items-center gap-2 mt-4 text-[10px] font-black text-white uppercase tracking-widest hover:text-yellow-500 transition-colors">
                Read Advanced Documentation <ExternalLink size={12} />
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
