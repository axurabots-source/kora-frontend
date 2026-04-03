import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { RefreshCw, Search, Eye, Package, X, Edit2, Globe, MessageCircle, ChevronDown, Calendar, User, ShoppingCart } from 'lucide-react'

// Professional Services & Utils
import { ecomService, businessService } from '../services/api.service'
import { fmtCurrency, fmtDate } from '../utils/formatters'

const STATUS_META = {
  pending:    { label: 'Pending',    bg: 'bg-yellow-500/10', text: 'text-yellow-500', emoji: '🕐' },
  processing: { label: 'Processing', bg: 'bg-blue-500/10',   text: 'text-blue-500',   emoji: '⚙️' },
  shipped:    { label: 'Shipped',    bg: 'bg-purple-500/10', text: 'text-purple-500',  emoji: '🚚' },
  delivered:  { label: 'Delivered',  bg: 'bg-green-500/10',  text: 'text-green-500',  emoji: '✅' },
  returned:   { label: 'Returned',   bg: 'bg-red-500/10',    text: 'text-red-500',    emoji: '↩️' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-gray-500/10',   text: 'text-gray-500',   emoji: '❌' },
}

export default function Orders() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [filtered, setFiltered] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingAddress, setEditingAddress] = useState(false)
  const [newAddress, setNewAddress] = useState('')

  useEffect(() => { 
    if (profile) {
      businessService.list(profile.id).then(data => {
        setBusinesses(data)
        if (data.length > 0) setSelectedBusiness(data[0].id)
      })
    } 
  }, [profile])

  useEffect(() => { 
    if (selectedBusiness) fetchOrders() 
  }, [selectedBusiness])

  useEffect(() => { applyFilters() }, [orders, statusFilter, search])

  const fetchOrders = async () => {
    try {
      const data = await ecomService.listOrders(selectedBusiness)
      setOrders(data)
    } catch {
      setOrders([])
    }
  }

  const applyFilters = () => {
    let f = [...orders]
    if (statusFilter !== 'all') f = f.filter(o => o.status === statusFilter)
    if (search) {
      const s = search.toLowerCase()
      f = f.filter(o =>
        o.customer_name?.toLowerCase().includes(s) ||
        String(o.external_order_id).includes(s) ||
        o.phone?.includes(s)
      )
    }
    setFiltered(f)
  }

  const syncNow = async () => {
    setSyncing(true)
    try {
      await ecomService.syncOrders(selectedBusiness)
      toast.success('Orders successfully synchronized!')
      fetchOrders()
    } catch {
      toast.error('Sync failed — check store connection')
    } finally {
      setSyncing(false)
    }
  }

  const cancelOrder = async (order) => {
    if (!confirm('Cancel this order in WooCommerce?')) return
    try {
      await ecomService.cancelOrder(order.id)
      toast.success('Order cancelled')
      fetchOrders()
      setSelectedOrder(null)
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  const pushToShipment = async (order) => {
    try {
      await ecomService.pushToShipment(order.id)
      toast.success('Pushed to shipment queue!')
      setSelectedOrder(null)
    } catch {
      toast.error('Failed to push to shipment')
    }
  }

  const counts = Object.keys(STATUS_META).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Orders</h1>
          <p className="text-sm text-text2 uppercase tracking-widest font-bold opacity-60">{orders.length} orders from connected integration</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={syncNow} 
            disabled={syncing} 
            className="px-5 py-2.5 bg-bg2 border border-border rounded-xl text-[11px] font-black uppercase tracking-widest text-text2 hover:text-white transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl shadow-black/20"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing Store...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`p-5 rounded-[2rem] border transition-all text-center group ${
              statusFilter === key ? 'bg-bg3 border-text3/30 scale-105 shadow-2xl' : 'bg-bg2 border-border hover:border-text3/20'
            }`}
          >
            <div className="text-2xl mb-2 filter grayscale group-hover:grayscale-0 transition-all">{meta.emoji}</div>
            <div className="text-xl font-black text-white tracking-tighter mb-0.5 leading-none">
              {counts[key] || 0}
            </div>
            <div className="text-[9px] text-text3 font-black uppercase tracking-widest leading-none">
              {meta.label}
            </div>
          </button>
        ))}
      </div>

      {/* Filters & Selector Bar */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6">
        <div className="flex bg-bg2 p-1 rounded-2xl border border-border w-fit shrink-0">
          <button 
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              statusFilter === 'all' ? 'bg-bg text-white shadow-xl ring-1 ring-white/5' : 'text-text3 hover:text-text2'
            }`} 
            onClick={() => setStatusFilter('all')}
          >
            All Orders ({orders.length})
          </button>
          {['pending', 'processing', 'shipped'].map(s => (
            <button 
              key={s} 
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                statusFilter === s ? 'bg-bg text-white shadow-xl ring-1 ring-white/5' : 'text-text3 hover:text-text2'
              }`} 
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 group-focus-within:text-white transition-colors" size={16} />
          <input
            className="w-full h-12 bg-bg2 border border-border rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 ring-white/5 transition-all text-white placeholder:text-text3"
            placeholder="Filter by customer name, order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {businesses.length > 1 && (
          <div className="relative shrink-0">
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

      {/* Modern Orders Table */}
      <div className="bg-bg2 border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/40 border-b border-border">
                {['ORDER ID', 'CUSTOMER', 'NET TOTAL', 'STATUS', 'CHANNEL', 'DATE', ''].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black tracking-widest text-text3 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(order => {
                const meta = STATUS_META[order.status] || STATUS_META.pending
                return (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-white tracking-widest font-mono">
                        #{order.external_order_id || order.id?.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-bg3 flex items-center justify-center text-[10px] font-black text-text2">
                            {order.customer_name?.[0] || '?'}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-white tracking-tight leading-tight">{order.customer_name}</p>
                            <p className="text-[10px] text-text3 font-black uppercase tracking-tighter tabular-nums">{order.phone}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-base font-black tracking-tighter text-white font-mono">
                        {fmtCurrency(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ring-1 ring-inset ${meta.bg} ${meta.text} ring-white/5`}>
                        {meta.emoji} {meta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                        order.platform === 'whatsapp' ? 'bg-green-bg border-green-light/20 text-green-light' : 'bg-blue-bg border-blue/20 text-blue'
                      }`}>
                        {order.platform === 'whatsapp' ? <MessageCircle size={10} /> : <Globe size={10} />}
                        {order.platform === 'whatsapp' ? 'WhatsApp' : 'Web Store'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-[10px] font-bold text-text3 uppercase tracking-wider flex items-center gap-2">
                          <Calendar size={12} className="opacity-40" />
                          {fmtDate(order.created_at)}
                       </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)} 
                        className="px-4 py-2 bg-bg3 text-text3 hover:text-white hover:bg-bg rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-border"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center bg-bg/20">
            <div className="w-20 h-20 bg-bg3 rounded-[2rem] flex items-center justify-center text-4xl mb-6 border border-border/50 shadow-inner select-none">🛒</div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">No Orders Recorded</h3>
            <p className="text-xs text-text3 font-bold opacity-60">Connect your store and click "Sync Now" to fetch latest orders.</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg/85 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative bg-bg2 border border-border w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] font-black text-text3 uppercase tracking-widest mb-1">ORDER REFERENCE</p>
                <div className="flex items-center gap-3">
                   <h2 className="text-3xl font-black tracking-tight text-white">#{selectedOrder.external_order_id}</h2>
                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${STATUS_META[selectedOrder.status]?.bg || 'bg-bg3'} ${STATUS_META[selectedOrder.status]?.text || 'text-text3'}`}>
                     {STATUS_META[selectedOrder.status]?.label || selectedOrder.status}
                   </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-3 bg-bg hover:bg-bg3 rounded-2xl transition-all border border-border text-text3"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Customer Insight Section */}
              <div className="bg-bg p-6 rounded-3xl border border-border shadow-inner">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg3 flex items-center justify-center text-white border border-border">
                       <User size={20} />
                    </div>
                    <div>
                       <p className="text-lg font-black text-white tracking-tight leading-none mb-1">{selectedOrder.customer_name}</p>
                       <p className="text-xs font-bold text-text3 tabular-nums opacity-60">{selectedOrder.phone}</p>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-border mt-2 group">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-[10px] font-black text-text3 uppercase tracking-widest">Shipping Destination</p>
                       {!editingAddress && (
                          <button onClick={() => { setEditingAddress(true); setNewAddress(selectedOrder.address || '') }} className="text-[10px] font-black text-blue hover:text-white uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100">
                            Edit
                          </button>
                       )}
                    </div>
                    {editingAddress ? (
                      <div className="space-y-3">
                         <textarea 
                           className="w-full bg-bg3 border border-border rounded-xl p-4 text-xs font-bold text-white outline-none focus:ring-2 ring-blue/20"
                           rows={3}
                           value={newAddress}
                           onChange={e => setNewAddress(e.target.value)}
                         />
                         <div className="flex gap-2">
                            <button onClick={() => setEditingAddress(false)} className="flex-1 py-3 bg-bg2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text3">Cancel</button>
                            <button className="flex-1 py-3 bg-blue rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue/10">Save Record</button>
                         </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-text2 leading-relaxed italic">{selectedOrder.address || 'Address not specified'}</p>
                    )}
                 </div>
              </div>

              {/* Order Manifest */}
              <div>
                <p className="text-[10px] font-black text-text3 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ShoppingCart size={12} className="opacity-40" /> Order manifest
                </p>
                <div className="space-y-2 bg-bg p-4 rounded-3xl border border-border shadow-inner max-h-48 overflow-y-auto custom-scrollbar">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-3 px-2 border-b border-white/[0.03] last:border-0 group">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-bg2 flex items-center justify-center text-[10px] font-black text-text3 tabular-nums">
                            {item.quantity}×
                         </div>
                         <p className="text-xs font-extrabold text-white group-hover:text-blue transition-colors truncate max-w-[240px] uppercase tracking-tight">{item.name}</p>
                      </div>
                      <span className="text-xs font-black text-text2 font-mono tabular-nums">
                        {fmtCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-6 px-4">
                  <span className="text-[13px] font-black text-text3 uppercase tracking-widest">Gross Total</span>
                  <span className="text-2xl font-black text-white tracking-tighter font-mono">
                    {fmtCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Command Actions */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => pushToShipment(selectedOrder)} 
                  className="h-16 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-white/5 group"
                >
                  <Package size={18} strokeWidth={3} className="group-hover:translate-y-[-2px] transition-transform" />
                  Dispatch Item
                </button>
                <button 
                  onClick={() => cancelOrder(selectedOrder)} 
                  className="h-16 rounded-[1.5rem] bg-bg border border-border text-text3 font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-bg/20 hover:text-red-light transition-all"
                >
                  <X size={18} />
                  Abort Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
