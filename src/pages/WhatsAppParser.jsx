import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { MessageSquare, Send, ChevronRight, Check, Edit2 } from 'lucide-react'

const API = import.meta.env.VITE_API_URL

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

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const parseOrder = async () => {
    if (!pasteText.trim()) return toast.error('Paste a WhatsApp conversation first')
    setParsing(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(`${API}/api/whatsapp/parse`, { text: pasteText }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setParsed(data)
      setEditing({ ...data })
      setPushed(false)
    } catch {
      // Fallback: client-side regex parser
      const result = parseLocally(pasteText)
      setParsed(result)
      setEditing({ ...result })
      setPushed(false)
    }
    setParsing(false)
  }

  const parseLocally = (text) => {
    const result = {
      name: null, phone: null, address: null,
      product: null, quantity: null, total_amount: null, advance_paid: null
    }

    // Name
    const nameMatch = text.match(/(?:name|customer|buyer|naam)\s*[:：]?\s*(.+)/i)
      || text.match(/^([A-Za-z\s]{3,30}),/)
    if (nameMatch) result.name = nameMatch[1].trim()

    // Phone
    const phoneMatch = text.match(/(?:0[0-9]{10}|92[0-9]{10}|\+92[0-9]{10}|0\d{2,3}[-\s]?\d{7,8})/g)
    if (phoneMatch) result.phone = phoneMatch[0].replace(/[-\s]/g, '')

    // Address
    const addrMatch = text.match(/(?:address|addr|delivery|location|pata)\s*[:：]?\s*(.+)/i)
    if (addrMatch) result.address = addrMatch[1].trim()

    // Product
    const prodMatch = text.match(/(?:product|item|order|maal|cheez)\s*[:：]?\s*(.+)/i)
    if (prodMatch) result.product = prodMatch[1].trim()

    // Quantity
    const qtyMatch = text.match(/(\d+)\s*(?:pcs?|pieces?|quantity|qty|units?)/i)
    if (qtyMatch) result.quantity = parseInt(qtyMatch[1])

    // Amount
    const amtMatch = text.match(/(?:amount|total|price|rs|pkr|rupees?)\s*[:：]?\s*([\d,]+)/i)
      || text.match(/([\d,]+)\s*(?:rs|pkr|rupees?)/i)
    if (amtMatch) result.total_amount = parseInt(amtMatch[1].replace(',', ''))

    // Advance
    const advMatch = text.match(/(?:advance|paid|deposit|token)\s*[:：]?\s*([\d,]+)/i)
    if (advMatch) result.advance_paid = parseInt(advMatch[1].replace(',', ''))

    return result
  }

  const pushToQueue = async () => {
    setPushing(true)
    try {
      const token = await getToken()
      await axios.post(`${API}/api/whatsapp/push-order`, editing, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Order pushed to shipment queue!')
      setPushed(true)
    } catch {
      toast.error('Failed to push order')
    }
    setPushing(false)
  }

  const fields = [
    { key: 'name', label: 'Customer Name', placeholder: 'Ahmed Ali', icon: '👤' },
    { key: 'phone', label: 'Phone', placeholder: '03001234567', icon: '📱' },
    { key: 'address', label: 'Delivery Address', placeholder: 'House #, Street, City', icon: '📍' },
    { key: 'product', label: 'Product', placeholder: 'Blue Shirt Size M', icon: '📦' },
    { key: 'quantity', label: 'Quantity', placeholder: '1', icon: '🔢' },
    { key: 'total_amount', label: 'Total Amount (PKR)', placeholder: '2500', icon: '💰' },
    { key: 'advance_paid', label: 'Advance Paid (PKR)', placeholder: '500', icon: '✅' },
  ]

  return (
    <div className="page fade-in">
      <Toaster position="top-center" toastOptions={{
        style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: '13px' }
      }} />

      <div className="page-header">
        <div>
          <h1 className="page-title">WhatsApp Parser</h1>
          <p className="page-subtitle">Paste a WhatsApp chat → auto-extract order details → ship</p>
        </div>
      </div>

      {/* Sample texts */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          Try with a sample
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SAMPLE_TEXTS.map((t, i) => (
            <button
              key={i}
              onClick={() => setPasteText(t)}
              className="btn btn-ghost btn-sm"
            >
              Sample {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Left: Paste area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageSquare size={16} color="var(--green-light)" />
              <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>Paste WhatsApp Chat</p>
            </div>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder={`Paste the WhatsApp conversation here...\n\nExample:\nName: Ahmed Ali\nAddress: House 5, Lahore\nPhone: 0300-1234567\nProduct: Blue shirt\nAmount: 2500`}
              className="input"
              rows={12}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}
            />
            <button
              onClick={parseOrder}
              disabled={parsing || !pasteText.trim()}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px' }}
              id="parse-whatsapp-btn"
            >
              <Send size={14} /> {parsing ? 'Parsing...' : 'Parse Order Details →'}
            </button>
          </div>

          {/* Tips */}
          <div style={{
            padding: '14px 16px',
            background: 'var(--blue-bg)',
            border: '1px solid rgba(96,165,250,0.15)',
            borderRadius: 'var(--radius)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--blue)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              💡 Tips for better parsing
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                'Include customer name, phone, and address',
                'Works with Roman Urdu and English mix',
                'Always review before pushing to queue',
                'Missing fields can be filled manually',
              ].map((tip, i) => (
                <li key={i} style={{ fontSize: '12px', color: 'var(--text2)', display: 'flex', gap: '6px' }}>
                  <span style={{ color: 'var(--blue)', fontWeight: '700' }}>→</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Extracted fields */}
        <div>
          {!parsed ? (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <p className="empty-state-text">Waiting for paste...</p>
                <p className="empty-state-sub">Paste a WhatsApp conversation and click Parse</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>
                  Extracted Details
                </p>
                {pushed ? (
                  <span className="badge badge-green"><Check size={10} /> Pushed!</span>
                ) : (
                  <span className="badge badge-blue"><Edit2 size={10} /> Review & Edit</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {fields.map(({ key, label, placeholder, icon }) => (
                  <div key={key}>
                    <label className="label">
                      <span style={{ marginRight: '4px' }}>{icon}</span>
                      {label}
                      {parsed[key] === null && (
                        <span style={{ marginLeft: '6px', color: 'var(--yellow-light)', fontSize: '10px', fontWeight: '700' }}>
                          NOT FOUND
                        </span>
                      )}
                    </label>
                    <input
                      type={key === 'total_amount' || key === 'advance_paid' || key === 'quantity' ? 'number' : 'text'}
                      placeholder={placeholder}
                      value={editing[key] || ''}
                      onChange={e => setEditing({ ...editing, [key]: e.target.value })}
                      className="input"
                      style={{
                        borderColor: parsed[key] === null ? 'rgba(252,211,77,0.3)' : undefined,
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '12px' }}>
                  ⚠️ Always review the fields above before submitting. Never auto-submit without user confirmation.
                </p>
                <button
                  onClick={pushToQueue}
                  disabled={pushing || pushed}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  id="push-to-queue-btn"
                >
                  {pushed
                    ? <><Check size={14} /> Order in Queue!</>
                    : pushing
                    ? 'Pushing...'
                    : <><ChevronRight size={14} /> Add to Shipment Queue</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
