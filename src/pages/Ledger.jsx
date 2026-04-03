import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Trash2, Download, Mic, MicOff, Filter, Search, Calendar, ChevronDown } from 'lucide-react'

// Professional Services & Utils
import { ledgerService, businessService, partyService } from '../services/api.service'
import { fmtCurrency, fmtDate } from '../utils/formatters'

export default function Ledger() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [filtered, setFiltered] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [parties, setParties] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    entry_type: 'receivable', amount: '', description: '', party_id: '', entry_date: ''
  })
  
  // Voice entry states
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')

  useEffect(() => { 
    if (profile) {
      businessService.list(profile.id).then(data => {
        setBusinesses(data)
        if (data.length > 0) setSelectedBusiness(data[0].id)
      })
    } 
  }, [profile])

  useEffect(() => { 
    if (selectedBusiness) { 
      refreshData()
    } 
  }, [selectedBusiness])

  useEffect(() => { applyFilters() }, [entries, typeFilter, search])

  const refreshData = () => {
    ledgerService.list(selectedBusiness).then(setEntries)
    partyService.getTop(selectedBusiness).then(setParties)
  }

  const applyFilters = () => {
    let f = [...entries]
    if (typeFilter !== 'all') f = f.filter(e => e.entry_type === typeFilter)
    if (search) {
      const s = search.toLowerCase()
      f = f.filter(e =>
        e.parties?.name?.toLowerCase().includes(s) ||
        e.description?.toLowerCase().includes(s) ||
        String(e.amount).includes(s)
      )
    }
    setFiltered(f)
  }

  const createEntry = async () => {
    if (!form.amount) return toast.error('Amount is required')
    setLoading(true)
    try {
      await ledgerService.create(selectedBusiness, form)
      toast.success('Entry added!')
      setShowModal(false)
      setForm({ entry_type: 'receivable', amount: '', description: '', party_id: '', entry_date: '' })
      refreshData()
    } catch { 
      toast.error('Failed to add entry') 
    } finally {
      setLoading(false)
    }
  }

  const deleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return
    try {
      await ledgerService.delete(id)
      toast.success('Deleted')
      refreshData()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Party', 'Description', 'Amount', 'Source']
    const rows = filtered.map(e => [
      e.entry_date, e.entry_type, e.parties?.name || '', e.description || '', e.amount, e.source || ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kora-ledger-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Voice not supported in this browser.')
    
    const rec = new SR()
    rec.lang = 'en-US'
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); toast.error('Voice error') }
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setVoiceText(text)
      
      const amountMatch = text.match(/\d+/)
      const nameMatch = text.match(/from\s+(\w+\s*\w*)/i) || text.match(/^(\w+\s?\w*)\s+(ne|ko)/i)
      
      if (amountMatch) setForm(f => ({ ...f, amount: amountMatch[0] }))
      if (nameMatch) {
        const found = parties.find(p => p.name.toLowerCase().includes(nameMatch[1].toLowerCase()))
        if (found) setForm(f => ({ ...f, party_id: found.id }))
      }
      
      if (/diye|received|mila|aaya|in/i.test(text)) setForm(f => ({ ...f, entry_type: 'receivable' }))
      if (/diya|paid|out|gaya|dena/i.test(text)) setForm(f => ({ ...f, entry_type: 'payable' }))
      
      setShowModal(true)
      toast.success(`Voice: "${text}"`)
    }
    rec.start()
  }

  const totals = filtered.reduce((acc, e) => {
    const amt = parseFloat(e.amount) || 0
    if (e.entry_type === 'receivable') acc.rec += amt
    else acc.pay += amt
    return acc
  }, { rec: 0, pay: 0 })

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Ledger</h1>
          <p className="text-sm text-text2 uppercase tracking-widest font-bold opacity-60">All business receivables and payables</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="px-4 py-2 bg-bg2 border border-border rounded-xl text-[11px] font-bold text-text2 hover:text-white transition-all flex items-center gap-2 uppercase tracking-wider">
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={startVoice}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-2 uppercase tracking-wider border ${
              listening ? 'bg-red-bg border-red-light text-red-light animate-pulse' : 'bg-bg2 border-border text-text2 hover:text-white'
            }`}
          >
            {listening ? <><MicOff size={14} /> Listening...</> : <><Mic size={14} /> Voice Entry</>}
          </button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
            <Plus size={14} strokeWidth={3} /> Add Entry
          </button>
        </div>
      </div>

      {/* Voice Status Indicator */}
      {voiceText && (
        <div className="bg-blue-bg/20 border border-blue/20 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center text-blue">
            <Mic size={16} />
          </div>
          <p className="text-sm text-blue/90 font-medium italic">
            Heard: <span className="font-bold">"{voiceText}"</span> — Form pre-filled
          </p>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Receivable', val: totals.rec, color: 'text-green-light', bg: 'bg-green-bg' },
          { label: 'Total Payable', val: totals.pay, color: 'text-red-light', bg: 'bg-red-bg' },
          { label: 'Net Balance', val: totals.rec - totals.pay, color: totals.rec - totals.pay >= 0 ? 'text-green-light' : 'text-red-light', bg: 'bg-bg2' },
        ].map((s, i) => (
          <div key={i} className="bg-bg2 border border-border p-6 rounded-2xl flex flex-col gap-1.5 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest font-black text-text3">{s.label}</div>
            <div className={`text-2xl font-black tracking-tighter ${s.color}`}>{fmtCurrency(s.val)}</div>
          </div>
        ))}
      </div>

      {/* Toolbar: Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex bg-bg2 p-1 rounded-2xl border border-border w-fit">
          {['all', 'receivable', 'payable'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                typeFilter === t ? 'bg-bg text-white shadow-xl ring-1 ring-white/5' : 'text-text3 hover:text-text2'
              }`}
            >
              {t === 'all' ? 'All' : t === 'receivable' ? '↓ Receivables' : '↑ Payables'}
            </button>
          ))}
        </div>
        
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 transition-colors group-focus-within:text-white" size={16} />
          <input
            className="w-full h-12 bg-bg2 border border-border rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 ring-white/5 transition-all text-white placeholder:text-text3"
            placeholder="Search by party, description or amount..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {businesses.length > 1 && (
          <div className="relative">
            <select 
              value={selectedBusiness || ''} 
              onChange={e => setSelectedBusiness(e.target.value)}
              className="appearance-none bg-bg2 border border-border rounded-2xl h-12 px-6 pr-12 text-sm font-bold outline-none focus:ring-2 ring-white/5 text-white"
            >
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" size={16} />
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-bg2 border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg/40 border-b border-border">
                {['ENTRY DATE', 'TYPE', 'CONTACT', 'NOTE', 'AMOUNT', 'SOURCE', ''].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black tracking-widest text-text3 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-text2 font-mono">
                      <Calendar size={12} className="text-text3" />
                      {entry.entry_date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      entry.entry_type === 'receivable' ? 'bg-green-bg text-green-light' : 'bg-red-bg text-red-light'
                    }`}>
                      {entry.entry_type === 'receivable' ? '↓ LENA' : '↑ DENA'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-bg3 flex items-center justify-center text-[10px] font-black text-text2 uppercase">
                        {entry.parties?.name?.[0] || '?'}
                      </div>
                      <span className="text-sm font-bold text-white tracking-tight">{entry.parties?.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text2 font-medium italic opacity-80">{entry.description || '—'}</td>
                  <td className="px-6 py-4">
                    <div className={`text-base font-black tracking-tighter font-mono ${
                      entry.entry_type === 'receivable' ? 'text-green-light' : 'text-red-light'
                    }`}>
                      {entry.entry_type === 'receivable' ? '+' : '-'}{parseFloat(entry.amount).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter bg-bg3 text-text3 border border-border shadow-inner">
                      {entry.source || 'manual'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteEntry(entry.id)} 
                      className="p-2.5 bg-bg3 text-text3 hover:text-red-light hover:bg-red-bg/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-bg3 rounded-3xl flex items-center justify-center text-3xl mb-4 border border-border select-none">📋</div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">No Entries Found</h3>
            <p className="text-xs text-text3 font-bold opacity-60">Try adjusting your filters or add your first business entry above.</p>
          </div>
        )}
      </div>

      {/* Modern Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-bg2 border border-border w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tight text-white">New Ledger Entry</h3>
              <div className="w-10 h-10 bg-bg3 rounded-2xl flex items-center justify-center text-text2">
                <Plus size={20} className="rotate-45 opacity-50" />
              </div>
            </div>

            <div className="space-y-6">
              {/* Type Switch */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Entry Nature</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'receivable', label: 'Lena (In)', color: 'green' },
                    { id: 'payable', label: 'Dena (Out)', color: 'red' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setForm({ ...form, entry_type: t.id })}
                      className={`py-4 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest transition-all border-2 ${
                        form.entry_type === t.id 
                          ? (t.color === 'green' ? 'bg-green-bg border-green-light text-green-light shadow-lg shadow-green-light/5' : 'bg-red-bg border-red-light text-red-light shadow-lg shadow-red-light/5')
                          : 'bg-bg3 border-transparent text-text3 hover:border-border'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Grand Total (PKR) *</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-text2 tracking-tighter">PKR</div>
                  <input
                    type="number"
                    placeholder="Enter amount..."
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full h-16 bg-bg3 border-2 border-transparent focus:border-white/10 rounded-2xl pl-16 pr-6 text-xl font-bold text-white outline-none transition-all placeholder:text-text3/50"
                    autoFocus
                  />
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Contact Party</label>
                  <div className="relative">
                    <select 
                      value={form.party_id} 
                      onChange={e => setForm({ ...form, party_id: e.target.value })} 
                      className="w-full h-14 bg-bg3 border-2 border-transparent rounded-2xl px-5 text-sm font-bold text-white outline-none appearance-none"
                    >
                      <option value="">Manual / Walk-in</option>
                      {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Record Date</label>
                  <input
                    type="date"
                    value={form.entry_date}
                    onChange={e => setForm({ ...form, entry_date: e.target.value })}
                    className="w-full h-14 bg-bg3 border-2 border-transparent rounded-2xl px-5 text-sm font-bold text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Observation / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Bulk order for winter stock..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full h-14 bg-bg3 border-2 border-transparent rounded-2xl px-5 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/50"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-text2 bg-bg hover:bg-bg3 border border-border transition-all"
                >
                  Dismiss
                </button>
                <button 
                  onClick={createEntry} 
                  disabled={loading}
                  className="h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-white text-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}