import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Package, Printer, Edit2, Search, Truck, ChevronRight, MapPin, Phone, Calendar, Info, X } from 'lucide-react'

// Professional Services & Utils
import { shipmentService, businessService } from '../services/api.service'
import { fmtCurrency, fmtDate } from '../utils/formatters'

const PIPELINE = ['Pending Booking', 'Booked', 'In Transit', 'Delivered', 'Returned']

const STATUS_META = {
  pending_booking: { label: 'Pending Booking', bg: 'bg-yellow-500/10', text: 'text-yellow-500', step: 0 },
  booked:          { label: 'Booked',           bg: 'bg-blue-500/10',   text: 'text-blue-500',   step: 1 },
  in_transit:      { label: 'In Transit',       bg: 'bg-purple-500/10', text: 'text-purple-500',  step: 2 },
  delivered:       { label: 'Delivered',        bg: 'bg-green-500/10',  text: 'text-green-500',  step: 3 },
  returned:        { label: 'Returned',         bg: 'bg-red-500/10',    text: 'text-red-500',    step: 4 },
}

export default function ShipmentQueue() {
  const { profile } = useAuth()
  const [shipments, setShipments] = useState([])
  const [filtered, setFiltered] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [bookingForm, setBookingForm] = useState({ weight: '', courier: 'postex', notes: '' })
  const [booking, setBooking] = useState(false)

  useEffect(() => { 
    if (profile) {
      businessService.list(profile.id).then(data => {
        setBusinesses(data)
        if (data.length > 0) setSelectedBusiness(data[0].id)
      })
    } 
  }, [profile])

  useEffect(() => { 
    if (selectedBusiness) fetchShipments() 
  }, [selectedBusiness])

  useEffect(() => { applyFilters() }, [shipments, statusFilter, search])

  const fetchShipments = async () => {
    try {
      const data = await shipmentService.list(selectedBusiness)
      setShipments(data)
    } catch { 
      setShipments([]) 
    }
  }

  const applyFilters = () => {
    let f = [...shipments]
    if (statusFilter !== 'all') f = f.filter(s => s.status === statusFilter)
    if (search) {
      const s = search.toLowerCase()
      f = f.filter(s =>
        s.orders?.customer_name?.toLowerCase().includes(s) ||
        s.tracking_number?.includes(s)
      )
    }
    setFiltered(f)
  }

  const bookCourier = async () => {
    if (!bookingForm.weight) return toast.error('Enter package weight')
    setBooking(true)
    try {
      // Note: Backend booking endpoint integration pending refactor or confirmation
      toast.success(`Booking logic integration in progress...`)
      // Temporary simulation for UI polish
      setTimeout(() => {
        setBooking(false)
        setSelectedShipment(null)
      }, 1000)
    } catch {
      toast.error('Booking failed')
      setBooking(false)
    }
  }

  const downloadLabel = async (shipment) => {
    if (!shipment.label_url) return toast.error('Label not available yet')
    window.open(shipment.label_url, '_blank')
  }

  const counts = Object.keys(STATUS_META).reduce((acc, s) => {
    acc[s] = shipments.filter(sh => sh.status === s).length
    return acc
  }, {})

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Shipment Queue</h1>
          <p className="text-sm text-text2 uppercase tracking-widest font-bold opacity-60">{shipments.length} active logistics processes</p>
        </div>
      </div>

      {/* Advanced Status Timeline Filter */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`p-5 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${
              statusFilter === key ? 'bg-bg3 border-text3/30 scale-105 shadow-2xl' : 'bg-bg2 border-border hover:border-text3/20'
            }`}
          >
            <div className={`text-xl font-black mb-1 leading-none ${statusFilter === key ? 'text-white' : 'text-text2'}`}>
              {counts[key] || 0}
            </div>
            <div className="text-[9px] text-text3 font-black uppercase tracking-widest leading-none">
              {meta.label}
            </div>
            {statusFilter === key && <div className={`absolute bottom-0 left-0 w-full h-1 ${meta.bg.replace('/10', '')}`} />}
          </button>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex bg-bg2 p-1 rounded-2xl border border-border w-fit shrink-0">
          <button 
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              statusFilter === 'all' ? 'bg-bg text-white shadow-xl ring-1 ring-white/5' : 'text-text3 hover:text-text2'
            }`} 
            onClick={() => setStatusFilter('all')}
          >
            Full Queue ({shipments.length})
          </button>
          <button 
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              statusFilter === 'pending_booking' ? 'bg-bg text-white shadow-xl ring-1 ring-white/5' : 'text-text3 hover:text-text2'
            }`} 
            onClick={() => setStatusFilter('pending_booking')}
          >
            <Info size={14} className="opacity-50" />
            To Book ({counts.pending_booking || 0})
          </button>
        </div>
        
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 transition-colors group-focus-within:text-white" size={16} />
          <input
            className="w-full h-12 bg-bg2 border border-border rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 ring-white/5 transition-all text-white placeholder:text-text3"
            placeholder="Search manifests by customer or tracking ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Shipment Manifest List */}
      <div className="space-y-3">
        {filtered.map(shipment => {
          const meta = STATUS_META[shipment.status] || STATUS_META.pending_booking
          const order = shipment.orders || {}
          return (
            <div
              key={shipment.id}
              onClick={() => setSelectedShipment(shipment)}
              className="bg-bg2 border border-border p-5 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer hover:border-text3/30 transition-all group hover:-translate-y-1 shadow-md hover:shadow-xl"
            >
              {/* Box Icon */}
              <div className="w-14 h-14 rounded-3xl bg-bg3 flex items-center justify-center text-text3 border border-border shadow-inner group-hover:bg-bg group-hover:text-blue transition-all shrink-0">
                <Package size={24} />
              </div>

              {/* Customer Core Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-black text-lg text-white tracking-tight truncate leading-none">
                    {order.customer_name || 'Anonymous Manifest'}
                  </p>
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${meta.bg} ${meta.text}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-text3 font-bold text-[11px] uppercase tracking-wider tabular-nums opacity-60">
                   <div className="flex items-center gap-1.5"><MapPin size={10}/> {order.city || 'Location Pending'}</div>
                   <div className="flex items-center gap-1.5"><Phone size={10}/> {order.phone || 'No Contact'}</div>
                </div>
              </div>

              {/* Courier Status / Tracking */}
              {shipment.tracking_number ? (
                <div className="bg-bg3/50 px-5 py-3 rounded-2xl border border-border/50 shrink-0 text-center md:text-left">
                  <p className="text-[9px] font-black text-text3 uppercase tracking-widest mb-0.5 opacity-50 text-center">Tracking Number</p>
                  <p className="text-sm font-black text-blue tracking-[0.2em] font-mono leading-none">
                    {shipment.tracking_number}
                  </p>
                </div>
              ) : (
                <div className="px-5 py-3 rounded-2xl border border-dashed border-border shrink-0">
                  <p className="text-[10px] font-bold text-text3 uppercase tracking-widest">Awaiting Logistics</p>
                </div>
              )}

              {/* Financial Summary */}
              <div className="text-right shrink-0 hidden md:block">
                <p className="text-lg font-black text-white tracking-tighter tabular-nums mb-0.5">
                  {fmtCurrency(order.total)}
                </p>
                <div className="flex items-center gap-1.5 justify-end text-[10px] font-bold text-text3 uppercase tracking-widest opacity-60">
                  <Calendar size={10} /> {fmtDate(shipment.created_at)}
                </div>
              </div>

              {/* Action Trigger */}
              <div className="flex items-center gap-3">
                {shipment.label_url && (
                  <button 
                    onClick={e => { e.stopPropagation(); downloadLabel(shipment) }} 
                    className="p-3 bg-bg hover:bg-bg3 border border-border rounded-2xl text-text2 hover:text-white transition-all shadow-sm"
                  >
                    <Printer size={16} />
                  </button>
                )}
                <div className="p-3 bg-bg3 rounded-2xl text-text3 group-hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center bg-bg2 border border-dashed border-border rounded-[3rem]">
            <div className="w-20 h-20 bg-bg3 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-inner select-none opacity-40">📦</div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Queue is Empty</h3>
            <p className="text-xs text-text3 font-bold opacity-60 max-w-xs">Push orders from the Orders page to initiate the shipping manifest workflow.</p>
          </div>
        )}
      </div>

      {/* Advanced Courier Booking Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg/85 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedShipment(null)} />
          
          <div className="relative bg-bg2 border border-border w-full max-w-xl rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] font-black text-text3 uppercase tracking-widest mb-1">MANIFEST COMMAND</p>
                <h3 className="text-2xl font-black tracking-tight text-white">Logistics Booking</h3>
              </div>
              <button 
                onClick={() => setSelectedShipment(null)} 
                className="p-3 bg-bg hover:bg-bg3 rounded-2xl transition-all border border-border text-text3"
              >
                <X size={18} />
              </button>
            </div>

            {/* Manifest Overview Section */}
            <div className="bg-bg p-6 rounded-3xl border border-border mb-8 shadow-inner">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-bg3 flex items-center justify-center text-white border border-border">
                     <Package size={20} />
                  </div>
                  <div className="min-w-0">
                     <p className="text-lg font-black text-white tracking-tight leading-none mb-1 ring-offset-bg">
                        {selectedShipment.orders?.customer_name}
                     </p>
                     <p className="text-xs font-bold text-text3 opacity-60 truncate max-w-[300px]">
                        {selectedShipment.orders?.address}
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mt-2">
                  <div>
                    <p className="text-[9px] font-black text-text3 uppercase mb-1">COD AMOUNT</p>
                    <p className="text-lg font-black text-white tracking-tighter">{fmtCurrency(selectedShipment.orders?.total)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-text3 uppercase mb-1">PHONE NUMBER</p>
                    <p className="text-lg font-black text-white tracking-tighter tabular-nums">{selectedShipment.orders?.phone}</p>
                  </div>
               </div>
            </div>

            {/* Dynamic Logistics Pipeline */}
            <div className="flex items-center justify-between gap-1 mb-10 overflow-x-auto pb-4 custom-scrollbar">
              {PIPELINE.map((step, i) => {
                const currentStep = STATUS_META[selectedShipment.status]?.step || 0;
                const isActive = i <= currentStep;
                return (
                  <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                      isActive ? 'bg-bg3 border-text2 text-white shadow-xl' : 'bg-transparent border-transparent text-text3 opacity-40'
                    }`}>
                      {step}
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div className={`h-px flex-1 mx-2 ${isActive ? 'bg-text3/40' : 'bg-border/20'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Contextual Actions */}
            {selectedShipment.status === 'pending_booking' ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Select Courier</label>
                      <div className="relative">
                        <select 
                          value={bookingForm.courier} 
                          onChange={e => setForm({ ...bookingForm, courier: e.target.value })} 
                          className="w-full h-14 bg-bg3 border-2 border-transparent focus:border-white/10 rounded-2xl px-5 text-sm font-bold text-white outline-none appearance-none"
                        >
                          <option value="postex">PostEx Economy</option>
                          <option value="leopards">Leopards Express</option>
                          <option value="bluex">BlueEx Standard</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-text3 pointer-events-none rotate-90" size={16} />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Dead Weight (kg) *</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        placeholder="0.5" 
                        value={bookingForm.weight}
                        onChange={e => setBookingForm({ ...bookingForm, weight: e.target.value })} 
                        className="w-full h-14 bg-bg3 border-2 border-transparent focus:border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none placeholder:text-text3/30 shadow-inner" 
                      />
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text3 ml-1">Special Handling Instructions</label>
                  <input 
                    type="text" 
                    placeholder="Fragile, Call before delivery, etc." 
                    value={bookingForm.notes}
                    onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })} 
                    className="w-full h-14 bg-bg3 border-2 border-transparent focus:border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none placeholder:text-text3/30" 
                  />
                </div>

                <button 
                  onClick={bookCourier} 
                  disabled={booking} 
                  className="w-full h-16 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-white/5 group disabled:opacity-50"
                >
                  <Truck size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  {booking ? 'Initiating Pipeline...' : 'Generate Shipping Label'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center animate-in zoom-in-95 duration-500">
                {selectedShipment.tracking_number && (
                  <div className="mb-8">
                    <p className="text-[10px] font-black text-text3 uppercase tracking-widest mb-2">Authenticated Tracking ID</p>
                    <div className="px-8 py-4 bg-bg rounded-2xl border border-border shadow-inner">
                       <p className="text-2xl font-black text-blue tracking-[0.3em] font-mono leading-none">
                        {selectedShipment.tracking_number}
                       </p>
                    </div>
                  </div>
                )}
                {selectedShipment.label_url && (
                  <button 
                    onClick={() => downloadLabel(selectedShipment)} 
                    className="w-full h-16 rounded-[1.5rem] bg-bg border-2 border-border text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-bg3 transition-all"
                  >
                    <Printer size={18} /> Re-print Manifest
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
