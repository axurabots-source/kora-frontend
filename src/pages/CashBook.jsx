import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, ArrowDownCircle, ArrowUpCircle, Download, Calendar, DollarSign, ChevronDown } from 'lucide-react'

// Professional Services & Utils
import { cashService, businessService } from '../services/api.service'
import { fmtCurrency, fmtDate } from '../utils/formatters'

export default function CashBook() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [balance, setBalance] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ direction: 'in', amount: '', note: '', entry_date: '' })

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

  const refreshData = () => {
    cashService.list(selectedBusiness).then(setEntries)
    cashService.getBalance(selectedBusiness).then(setBalance)
  }

  const addEntry = async () => {
    if (!form.amount) return toast.error('Amount is required')
    setLoading(true)
    try {
      await cashService.add(selectedBusiness, form)
      toast.success('Cash entry added!')
      setShowModal(false)
      setForm({ direction: 'in', amount: '', note: '', entry_date: '' })
      refreshData()
    } catch { 
      toast.error('Failed to add entry') 
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Date', 'Direction', 'Amount', 'Note']
    const rows = entries.map(e => [e.entry_date, e.direction, e.amount, e.note || ''])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `kora-cashbook-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1 text-center md:text-left">Cash Book</h1>
          <p className="text-sm text-text2 uppercase tracking-widest font-bold opacity-60 text-center md:text-left">Track every rupee in and out</p>
        </div>
        <div className="flex items-center gap-3 justify-center md:justify-end">
          <button onClick={exportCSV} className="px-4 py-2.5 bg-bg2 border border-border rounded-xl text-[11px] font-bold text-text2 hover:text-white transition-all flex items-center gap-2 uppercase tracking-wider">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-xl shadow-white/5">
            <Plus size={14} strokeWidth={3} /> Add Entry
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Cash In', value: balance?.total_in || 0, color: 'text-green-light', bg: 'bg-green-bg' },
          { label: 'Total Cash Out', value: balance?.total_out || 0, color: 'text-red-light', bg: 'bg-red-bg' },
          { label: 'Net Liquid Cash', value: balance?.balance || 0, color: 'text-white', bg: 'bg-bg2' },
        ].map(card => (
          <div key={card.label} className="bg-bg2 border border-border p-6 rounded-2xl flex flex-col gap-1.5 shadow-sm hover:border-text3/30 transition-colors group">
            <div className="text-[10px] uppercase tracking-widest font-black text-text3 opacity-80">{card.label}</div>
            <div className={`text-2xl font-black tracking-tighter ${card.color}`}>
              {fmtCurrency(card.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Business Selector (Mobile optimized) */}
      {businesses.length > 1 && (
        <div className="relative mb-6">
          <select 
            value={selectedBusiness || ''} 
            onChange={e => setSelectedBusiness(e.target.value)}
            className="w-full h-12 bg-bg2 border border-border rounded-2xl px-6 text-sm font-bold outline-none focus:ring-2 ring-white/5 text-white appearance-none"
          >
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" size={16} />
        </div>
      )}

      {/* Data Table */}
      <div className="bg-bg2 border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/40 border-b border-border">
                {['RECORD DATE', 'NATURE', 'NET AMOUNT', 'NOTE / REFERENCE'].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black tracking-widest text-text3 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {entries.map(entry => (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-text2 font-mono">
                      <Calendar size={12} className="text-text3" />
                      {entry.entry_date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      entry.direction === 'in' ? 'bg-green-bg text-green-light' : 'bg-red-bg text-red-light'
                    }`}>
                      {entry.direction === 'in' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                      {entry.direction === 'in' ? 'Cash In' : 'Cash Out'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-base font-black tracking-tighter font-mono ${
                      entry.direction === 'in' ? 'text-green-light' : 'text-red-light'
                    }`}>
                      {entry.direction === 'in' ? '+' : '-'}{parseFloat(entry.amount).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text2 font-medium italic opacity-80">{entry.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-bg3 rounded-3xl flex items-center justify-center text-3xl mb-4 border border-border select-none">💵</div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Zero Cash Activity</h3>
            <p className="text-xs text-text3 font-bold opacity-60">No cash entries recorded for this business yet.</p>
          </div>
        )}
      </div>

      {/* Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-bg2 border border-border w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tight text-white">Add Cash Flow</h3>
              <div className="w-10 h-10 bg-bg3 rounded-2xl flex items-center justify-center text-text2">
                <DollarSign size={20} className="opacity-50" />
              </div>
            </div>

            <div className="space-y-6">
              {/* Direction Switch */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Flow Direction</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'in', label: '↓ Cash In (Aaya)', color: 'green' },
                    { id: 'out', label: '↑ Cash Out (Gaya)', color: 'red' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setForm({ ...form, direction: t.id })}
                      className={`py-4 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest transition-all border-2 ${
                        form.direction === t.id 
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
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Amount (PKR) *</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-text2 transition-colors group-focus-within:text-white">PKR</div>
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

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Date of Entry</label>
                <input
                  type="date"
                  value={form.entry_date}
                  onChange={e => setForm({ ...form, entry_date: e.target.value })}
                  className="w-full h-14 bg-bg3 border-2 border-transparent rounded-2xl px-5 text-sm font-bold text-white outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Short Description / Remark</label>
                <input
                  type="text"
                  placeholder="e.g. Utility bill or Shop sale..."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  className="w-full h-14 bg-bg3 border-2 border-transparent rounded-2xl px-5 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-text2 bg-bg hover:bg-bg3 border border-border transition-all"
                >
                  Dismiss
                </button>
                <button 
                  onClick={addEntry} 
                  disabled={loading}
                  className="h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-white text-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-white/5"
                >
                  {loading ? 'Processing...' : 'Confirm Flow'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}