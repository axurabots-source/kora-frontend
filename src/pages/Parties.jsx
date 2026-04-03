import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, User, Phone, MessageCircle, Search, ExternalLink, ChevronRight, X, Building2 } from 'lucide-react'

// Professional Services & Utils
import { partyService, businessService } from '../services/api.service'
import { fmtCurrency, fmtDate } from '../utils/formatters'

export default function Parties() {
  const { profile } = useAuth()
  const [parties, setParties] = useState([])
  const [filtered, setFiltered] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedParty, setSelectedParty] = useState(null)
  const [partyLedger, setPartyLedger] = useState({ entries: [], summary: {} })
  const [form, setForm] = useState({ name: '', phone: '', type: 'customer' })

  useEffect(() => { 
    if (profile) {
      businessService.list(profile.id).then(data => {
        setBusinesses(data)
        if (data.length > 0) setSelectedBusiness(data[0].id)
      })
    } 
  }, [profile])

  useEffect(() => { 
    if (selectedBusiness) refreshData() 
  }, [selectedBusiness])

  useEffect(() => { applyFilters() }, [parties, search, typeFilter])

  const refreshData = () => {
    partyService.list(selectedBusiness).then(setParties)
  }

  const applyFilters = () => {
    let f = [...parties]
    if (typeFilter !== 'all') f = f.filter(p => p.type === typeFilter)
    if (search) {
      const s = search.toLowerCase()
      f = f.filter(p =>
        p.name?.toLowerCase().includes(s) ||
        p.phone?.includes(s)
      )
    }
    setFiltered(f)
  }

  const createParty = async () => {
    if (!form.name) return toast.error('Name is required')
    setLoading(true)
    try {
      await partyService.create(selectedBusiness, form)
      toast.success('Party added!')
      setShowModal(false)
      setForm({ name: '', phone: '', type: 'customer' })
      refreshData()
    } catch (err) {
      if (err.response?.status === 409) toast.error('Party already exists!')
      else toast.error('Failed to add party')
    } finally {
      setLoading(false)
    }
  }

  const openPartyDetail = (party) => {
    setSelectedParty(party)
    partyService.getLedger(party.id).then(setPartyLedger)
  }

  const sendWhatsAppReminder = (party) => {
    if (!party.phone) return toast.error('No phone number for this party')
    const phone = party.phone.replace(/\D/g, '')
    const msg = `Assalam o Alaikum ${party.name}, aapka pending amount KORA mein record hai. Meherbani farma kar settle karein. Shukriya!`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Parties</h1>
          <p className="text-sm text-text2 uppercase tracking-widest font-bold opacity-60">Customers and suppliers — {parties.length} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-xl shadow-white/5">
          <Plus size={14} strokeWidth={3} /> Add Party
        </button>
      </div>

      {/* Modern Filter Tabs & Search */}
      <div className="flex flex-col xl:flex-row gap-4 mb-8">
        <div className="flex bg-bg2 p-1 rounded-2xl border border-border w-fit">
          {['all', 'customer', 'supplier'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                typeFilter === t ? 'bg-bg text-white shadow-xl ring-1 ring-white/5' : 'text-text3 hover:text-text2'
              }`}
            >
              {t === 'all' ? 'All' : t === 'customer' ? '👤 Customers' : '🏭 Suppliers'}
            </button>
          ))}
        </div>
        
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 transition-colors group-focus-within:text-white" size={16} />
          <input
            className="w-full h-12 bg-bg2 border border-border rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 ring-white/5 transition-all text-white placeholder:text-text3"
            placeholder="Search contacts by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Brief Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Contacts', val: parties.length, color: 'text-white' },
          { label: 'Total Customers', val: parties.filter(p => p.type === 'customer').length, color: 'text-green-light' },
          { label: 'Total Suppliers', val: parties.filter(p => p.type === 'supplier').length, color: 'text-blue' },
        ].map((s, i) => (
          <div key={i} className="bg-bg2 border border-border p-6 rounded-2xl flex flex-col gap-1 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest font-black text-text3">{s.label}</div>
            <div className={`text-2xl font-black tracking-tighter ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Responsive Party Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(party => (
          <div
            key={party.id}
            className="bg-bg2 border border-border p-5 rounded-[2rem] hover:border-text2/30 transition-all cursor-pointer group hover:-translate-y-1"
            onClick={() => openPartyDetail(party)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black tracking-tighter ${
                  party.type === 'customer' ? 'bg-green-bg text-green-light' : 'bg-blue-bg text-blue'
                }`}>
                  {party.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white truncate leading-tight group-hover:text-blue transition-colors">{party.name}</p>
                  <p className="text-[10px] text-text3 font-extrabold uppercase tracking-widest mt-1 italic">{party.phone || 'No phone'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-black/10 ${
                party.type === 'customer' ? 'bg-green-bg text-green-light' : 'bg-blue-bg text-blue'
              }`}>
                {party.type === 'customer' ? 'Customer' : 'Supplier'}
              </span>
              
              {party.phone && (
                <button
                  onClick={evt => { evt.stopPropagation(); sendWhatsAppReminder(party) }}
                  className="p-2.5 bg-green-light/5 hover:bg-green-light/10 text-green-light border border-green-light/20 rounded-xl transition-all"
                  title="Send WhatsApp Reminder"
                >
                  <MessageCircle size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-bg3 rounded-3xl flex items-center justify-center text-3xl mb-4 border border-border select-none opacity-40">👥</div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">No Parties Matched</h3>
            <p className="text-xs text-text3 font-bold opacity-60">Try changing your search or add a new record.</p>
          </div>
        )}
      </div>

      {/* Side Drawer: Party Detail */}
      {selectedParty && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-end p-4">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedParty(null)} />
          
          <div className="relative bg-bg2 border-l border-border w-full max-w-lg h-full rounded-l-[3rem] p-10 shadow-2xl animate-in slide-in-from-right-full duration-500 overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black ${
                  selectedParty.type === 'customer' ? 'bg-green-bg text-green-light' : 'bg-blue-bg text-blue'
                }`}>
                  {selectedParty.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">{selectedParty.name}</h2>
                  <p className="text-sm text-text2 font-bold flex items-center gap-2 mt-1">
                    <Phone size={14} className="text-text3" />
                    {selectedParty.phone || 'No phone number'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedParty(null)} 
                className="p-3 bg-bg hover:bg-bg3 rounded-2xl transition-all border border-border text-text3"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions */}
            {selectedParty.phone && (
              <button
                onClick={() => sendWhatsAppReminder(selectedParty)}
                className="w-full h-14 bg-green-light/5 border-2 border-green-light/10 text-green-light rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-green-light/10 transition-all mb-8 shadow-lg shadow-green-light/5"
              >
                <MessageCircle size={18} /> Send WhatsApp Reminder
              </button>
            )}

            {/* Account Status / Summary */}
            <div className="bg-bg p-6 rounded-3xl border border-border mb-8 grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[9px] font-black text-text3 uppercase mb-1">TOTAL LENA</p>
                  <p className="text-lg font-black text-green-light tracking-tighter">{fmtCurrency(partyLedger.summary?.total_receivable)}</p>
               </div>
               <div>
                  <p className="text-[9px] font-black text-text3 uppercase mb-1">TOTAL DENA</p>
                  <p className="text-lg font-black text-red-light tracking-tighter">{fmtCurrency(partyLedger.summary?.total_payable)}</p>
               </div>
               <div className="col-span-2 pt-4 border-t border-border mt-2">
                  <p className="text-[9px] font-black text-text3 uppercase mb-1">NET POSITION</p>
                  <p className={`text-2xl font-black tracking-tighter ${
                    (partyLedger.summary?.net || 0) >= 0 ? 'text-green-light' : 'text-red-light'
                  }`}>
                    {(partyLedger.summary?.net || 0) >= 0 ? '+' : ''}{fmtCurrency(partyLedger.summary?.net)}
                  </p>
               </div>
            </div>

            {/* Mini Ledger */}
            <h3 className="text-[10px] font-black tracking-widest text-text3 uppercase mb-4 flex items-center gap-2">
              <div className="w-1 h-3 bg-white" /> Transaction History
            </h3>
            
            <div className="space-y-2">
              {partyLedger.entries.length === 0 ? (
                <div className="py-12 border border-dashed border-border rounded-3xl text-center">
                   <p className="text-xs font-bold text-text3 italic opacity-40">No transactions recorded yet</p>
                </div>
              ) : partyLedger.entries.map(e => (
                <div key={e.id} className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-transparent hover:border-border transition-all">
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-extrabold text-white truncate mb-1">{e.description || e.entry_type.toUpperCase()}</p>
                    <p className="text-[9px] text-text3 font-bold uppercase tracking-wider">{fmtDate(e.entry_date)}</p>
                  </div>
                  <span className={`text-[13px] font-black tracking-tighter whitespace-nowrap ${
                    e.entry_type === 'receivable' ? 'text-green-light' : 'text-red-light'
                  }`}>
                    {e.entry_type === 'receivable' ? '+' : '-'}{parseFloat(e.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Party Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-bg2 border border-border w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tight text-white">Create New Contact</h3>
              <div className="w-10 h-10 bg-bg3 rounded-2xl flex items-center justify-center text-text2">
                <Building2 size={20} className="opacity-50" />
              </div>
            </div>

            <div className="space-y-6">
              {/* Type Switch */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Contact Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'customer', label: '👤 Customer', color: 'green' },
                    { id: 'supplier', label: '🏭 Supplier', color: 'blue' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setForm({ ...form, type: t.id })}
                      className={`py-4 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest transition-all border-2 ${
                        form.type === t.id 
                          ? (t.color === 'green' ? 'bg-green-bg border-green-light text-green-light shadow-lg shadow-green-light/5' : 'bg-blue-bg border-blue text-blue shadow-lg shadow-blue/5')
                          : 'bg-bg3 border-transparent text-text3 hover:border-border'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Full Legal Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bilal Ahmed Traders..." 
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  className="w-full h-14 bg-bg3 border-2 border-transparent focus:border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/50 shadow-inner" 
                  autoFocus 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">WhatsApp Number</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2">
                    <Phone size={14} className="text-text3" />
                  </div>
                  <input 
                    type="tel" 
                    placeholder="923001234567" 
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                    className="w-full h-14 bg-bg3 border-2 border-transparent focus:border-white/10 rounded-2xl pl-14 pr-6 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/50 shadow-inner" 
                  />
                </div>
                <p className="text-[9px] font-black uppercase tracking-tighter text-text3/60 ml-1">
                  Format: Country code + Number (e.g. 923001234567)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-text2 bg-bg hover:bg-bg3 border border-border transition-all"
                >
                  Dismiss
                </button>
                <button 
                  onClick={createParty} 
                  disabled={loading}
                  className="h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-white text-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Secure Party'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}