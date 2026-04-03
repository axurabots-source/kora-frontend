import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { MessageSquare, Send, ChevronRight, Check, Edit2, Sparkles, Wand2, Info, ArrowRight, Save, Copy } from 'lucide-react'

// Professional Services & Utils
import { whatsappService } from '../services/api.service'

const SAMPLE_TEXTS = [
  `Name: Ahmed Ali\nAddress: House 5, Street 3, Gulberg Lahore\nPhone: 03001234567\nProduct: Blue Shirt Size M\nAmount: 2500\nAdvance: 500`,
  `bhai ye bhejo: Sana Khan, G-9 Islamabad, 0300-1234567, 2 pieces kala kurta, total 3000`,
  `Order confirm\nCustomer: Usman Malik\nMobile: 03124567890\nDelivery: Flat 12, DHA Phase 5 Karachi\nItem: Wireless Earbuds x1\nTotal: 4500\nPaid: 0`,
]

export default function WhatsAppParser() {
  const { user } = useAuth()
  const [pasteText, setPasteText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [editing, setEditing] = useState({})
  const [parsing, setParsing] = useState(false)
  const [pushed, setPushed] = useState(false)
  const [pushing, setPushing] = useState(false)

  const parseOrder = async () => {
    if (!pasteText.trim()) return toast.error('Paste a WhatsApp conversation first')
    setParsing(true)
    try {
      const data = await whatsappService.parse(pasteText)
      setParsed(data)
      setEditing({ ...data })
      setPushed(false)
      toast.success('AI Analysis Complete')
    } catch {
      // Fallback: internal basic regex parser if server fails
      const result = parseLocally(pasteText)
      setParsed(result)
      setEditing({ ...result })
      setPushed(false)
      toast.error('AI unavailable, using basic parsing')
    } finally {
      setParsing(false)
    }
  }

  const parseLocally = (text) => {
    const result = {
      name: null, phone: null, address: null,
      product: null, quantity: null, total_amount: null, advance_paid: null
    }
    const nameMatch = text.match(/(?:name|customer|buyer|naam)\s*[:：]?\s*(.+)/i) || text.match(/^([A-Za-z\s]{3,30}),/)
    if (nameMatch) result.name = nameMatch[1].trim()
    const phoneMatch = text.match(/(?:0[0-9]{10}|92[0-9]{10}|\+92[0-9]{10}|0\d{2,3}[-\s]?\d{7,8})/g)
    if (phoneMatch) result.phone = phoneMatch[0].replace(/[-\s]/g, '')
    const addrMatch = text.match(/(?:address|addr|delivery|location|pata)\s*[:：]?\s*(.+)/i)
    if (addrMatch) result.address = addrMatch[1].trim()
    const prodMatch = text.match(/(?:product|item|order|maal|cheez)\s*[:：]?\s*(.+)/i)
    if (prodMatch) result.product = prodMatch[1].trim()
    const qtyMatch = text.match(/(\d+)\s*(?:pcs?|pieces?|quantity|qty|units?)/i)
    if (qtyMatch) result.quantity = parseInt(qtyMatch[1])
    const amtMatch = text.match(/(?:amount|total|price|rs|pkr|rupees?)\s*[:：]?\s*([\d,]+)/i) || text.match(/([\d,]+)\s*(?:rs|pkr|rupees?)/i)
    if (amtMatch) result.total_amount = parseInt(amtMatch[1].replace(',', ''))
    const advMatch = text.match(/(?:advance|paid|deposit|token)\s*[:：]?\s*([\d,]+)/i)
    if (advMatch) result.advance_paid = parseInt(advMatch[1].replace(',', ''))
    return result
  }

  const pushToQueue = async () => {
    setPushing(true)
    try {
      await whatsappService.pushOrder(editing)
      toast.success('Dispatched to shipment queue!')
      setPushed(true)
    } catch {
      toast.error('Failed to sync manifest')
    } finally {
      setPushing(false)
    }
  }

  const fields = [
    { key: 'name', label: 'Customer Name', placeholder: 'Ahmed Ali', icon: '👤', color: 'text-blue' },
    { key: 'phone', label: 'Primary Contact', placeholder: '03001234567', icon: '📱', color: 'text-green-light' },
    { key: 'address', label: 'Delivery Destination', placeholder: 'House #, Street, City', icon: '📍', color: 'text-red-light' },
    { key: 'product', label: 'SKU / Item Details', placeholder: 'Blue Shirt Size M', icon: '📦', color: 'text-purple-500' },
    { key: 'quantity', label: 'Quantity', placeholder: '1', icon: '🔢', color: 'text-yellow-500' },
    { key: 'total_amount', label: 'COD Amount (PKR)', placeholder: '2500', icon: '💰', color: 'text-green-500' },
    { key: 'advance_paid', label: 'Advance Deposit', placeholder: '500', icon: '🛡️', color: 'text-cyan-400' },
  ]

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">WhatsApp AI Parser</h1>
          <p className="text-sm text-text2 uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
            <Sparkles size={14} className="text-blue animate-pulse" /> 
            Extract unstructured chat into shipping manifests
          </p>
        </div>
      </div>

      {/* Quick Access Samples */}
      <div className="bg-bg2 p-6 rounded-[2.5rem] border border-border mb-8">
        <h3 className="text-[10px] font-black text-text3 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Wand2 size={12} className="opacity-50" /> Instant Prototype Samples
        </h3>
        <div className="flex flex-wrap gap-3">
          {SAMPLE_TEXTS.map((t, i) => (
            <button
              key={i}
              onClick={() => setPasteText(t)}
              className="px-5 py-2.5 bg-bg border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text3 hover:text-white hover:border-text3/30 transition-all shadow-sm"
            >
              Chat Pattern {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Input Terminal */}
        <div className="space-y-6">
          <div className="bg-bg2 border border-border rounded-[3rem] p-8 shadow-2xl relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                <MessageSquare size={120} strokeWidth={1} />
             </div>
             
             <div className="flex items-center gap-4 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-green-bg/20 flex items-center justify-center text-green-light border border-green-light/20 shadow-lg shadow-green-light/5">
                 <MessageSquare size={18} />
               </div>
               <p className="text-lg font-black text-white tracking-tight">Paste Unstructured Inbox</p>
             </div>

             <textarea
               value={pasteText}
               onChange={e => setPasteText(e.target.value)}
               placeholder={`Paste the customer chat here...\n\n"bhai ye order book krado: Ahmed, House 12 Lhr, 0300... Blue Shirt, 2500 rs"`}
               className="w-full h-[400px] bg-bg3 border-2 border-transparent focus:border-white/10 rounded-[2rem] p-8 text-sm font-medium text-white outline-none transition-all placeholder:text-text3/30 shadow-inner custom-scrollbar leading-relaxed font-mono"
             />

             <button
               onClick={parseOrder}
               disabled={parsing || !pasteText.trim()}
               className="w-full h-16 bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-white/5 mt-6 disabled:opacity-50 group"
             >
               {parsing ? (
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-black border-r-transparent rounded-full animate-spin" />
                   AI Analyzing...
                 </div>
               ) : (
                 <>
                   <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   Run Intelligence Extraction
                 </>
               )}
             </button>
          </div>

          {/* Quick Intelligence Tips */}
          <div className="bg-blue-bg/10 border border-blue-500/20 rounded-[2rem] p-6 shadow-lg shadow-blue-500/5">
            <div className="flex items-center gap-3 mb-3">
              <Info size={16} className="text-blue" />
              <p className="text-[10px] font-black text-blue uppercase tracking-widest">Parser intelligence notes</p>
            </div>
            <ul className="space-y-2">
              {[
                'Understands mixed English & Roman Urdu contexts',
                'Identifies PKR, totals, and advance payments automatically',
                'Verifies phone number patterns for shipping readiness',
                'Supports manual override for any missing entity'
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-text2 opacity-80">
                  <ArrowRight size={12} className="shrink-0 mt-0.5 text-blue" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Intelligence Output / Manifest Editor */}
        <div className="relative">
          {!parsed ? (
            <div className="bg-bg2/40 border-2 border-dashed border-border rounded-[3rem] h-[670px] flex flex-col items-center justify-center text-center p-12">
               <div className="w-24 h-24 bg-bg3 rounded-[2.5rem] flex items-center justify-center text-5xl mb-8 shadow-inner grayscale opacity-40 select-none border border-border">
                  🧠
               </div>
               <h3 className="text-base font-black text-white uppercase tracking-widest mb-3">Awaiting AI Breakdown</h3>
               <p className="text-xs text-text3 font-extrabold max-w-[280px] leading-relaxed opacity-60">
                 Once you paste the WhatsApp conversation and run the extraction, our AI will populate the manifest fields here.
               </p>
            </div>
          ) : (
            <div className="bg-bg2 border border-border rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-right-4 duration-500 h-full flex flex-col">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue/10 flex items-center justify-center text-blue border border-blue/20">
                      <Sparkles size={18} />
                    </div>
                    <div>
                       <p className="text-sm font-black text-white uppercase tracking-widest">Extracted Intelligence</p>
                       <p className="text-[9px] font-bold text-text3 uppercase italic mt-0.5">Please review before dispatch</p>
                    </div>
                 </div>
                 {pushed ? (
                   <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-bg text-green-light text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-light/5 border border-green-light/20">
                     <Check size={12} strokeWidth={3} /> Synchronized
                   </span>
                 ) : (
                   <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-bg text-blue text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue/5 border border-blue/20">
                     <Edit2 size={12} strokeWidth={3} /> Review Mode
                   </span>
                 )}
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto px-1 custom-scrollbar">
                {fields.map(({ key, label, placeholder, icon, color }) => (
                  <div key={key} className="group relative">
                    <label className={`text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ml-1 ${color}`}>
                      <span className="opacity-60">{icon}</span>
                      {label}
                      {editing[key] === null && (
                         <span className="ml-auto text-[7px] bg-red-bg/20 text-red-light px-1.5 py-0.5 rounded-md animate-pulse">ENTITY NOT IDENTIFIED</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={['total_amount', 'advance_paid', 'quantity'].includes(key) ? 'number' : 'text'}
                        placeholder={placeholder}
                        value={editing[key] || ''}
                        onChange={e => setEditing({ ...editing, [key]: e.target.value })}
                        className={`w-full h-12 bg-bg3 border-2 focus:border-white/10 rounded-2xl px-5 text-sm font-bold text-white outline-none transition-all placeholder:text-text3/20 shadow-inner ${
                          editing[key] === null ? 'border-red-bg/40' : 'border-transparent'
                        }`}
                      />
                      <Edit2 size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 opacity-0 group-hover:opacity-40 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-border bg-bg2 sticky bottom-0">
                <div className="flex items-center gap-3 mb-6 p-4 bg-bg3/50 rounded-2xl border border-border/50">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                    <Info size={14} />
                  </div>
                  <p className="text-[9px] font-bold text-text3 uppercase tracking-tight leading-relaxed">
                    By clicking dispatch, you confirm legal accuracy of customer details for shipment liability.
                  </p>
                </div>
                
                <button
                  onClick={pushToQueue}
                  disabled={pushing || pushed}
                  className={`w-full h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-2xl scale-100 ${
                    pushed 
                      ? 'bg-bg border border-border text-text3 opacity-60' 
                      : 'bg-white text-black active:scale-[0.98] hover:scale-[1.01] shadow-white/5'
                  }`}
                >
                  {pushed ? (
                    <>
                      <Check size={18} strokeWidth={3} className="text-green-light" />
                      Manifest Live in Queue
                    </>
                  ) : pushing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-r-transparent rounded-full animate-spin" />
                      Syncing Logistics...
                    </div>
                  ) : (
                    <>
                      <Save size={18} />
                      Commit to Dispatch Queue
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
