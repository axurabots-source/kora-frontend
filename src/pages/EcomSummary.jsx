import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { TrendingUp, TrendingDown, Package, RefreshCw, BarChart3, PieChart as PieIcon, Wallet, CreditCard, ShoppingBag, Truck } from 'lucide-react'

// Professional Services & Utils
import { shipmentService, businessService } from '../services/api.service'
import { fmtCurrency } from '../utils/formatters'

export default function EcomSummary() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => { 
    if (profile) {
      businessService.list(profile.id).then(data => {
        setBusinesses(data)
        if (data.length > 0) setSelectedBusiness(data[0].id)
      })
    } 
  }, [profile])

  useEffect(() => { 
    if (selectedBusiness) fetchStats() 
  }, [selectedBusiness, period])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const data = await shipmentService.getSummary(selectedBusiness, period)
      setStats(data)
    } catch {
      // Graceful fallback for empty/loading states
      setStats({
        total_sales: 0, total_profit: 0, total_orders: 0,
        cod_pending: 0, return_rate: 0, avg_order_value: 0,
        web_sales: 0, whatsapp_sales: 0,
        weekly: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const platformData = [
    { name: 'WooCommerce', value: stats?.web_sales || 0 },
    { name: 'WhatsApp', value: stats?.whatsapp_sales || 0 },
  ]
  const COLORS = ['#60a5fa', '#4ade80']

  const topStats = [
    { label: 'Total Revenue', value: fmtCurrency(stats?.total_sales), color: 'text-white', icon: <ShoppingBag size={18} />, sub: `${stats?.total_orders || 0} Successful Conversions` },
    { label: 'Net Profit', value: fmtCurrency(stats?.total_profit), color: 'text-green-light', icon: <TrendingUp size={18} />, sub: 'Gross - Cost - Logistics' },
    { label: 'COD Floating', value: fmtCurrency(stats?.cod_pending), color: 'text-yellow-light', icon: <Wallet size={18} />, sub: 'Pending Courier Collection' },
    { label: 'Return Factor', value: `${stats?.return_rate || 0}%`, color: 'text-red-light', icon: <TrendingDown size={18} />, sub: 'Logistics Loss Rate' },
    { label: 'AOV Performance', value: fmtCurrency(stats?.avg_order_value), color: 'text-blue', icon: <CreditCard size={18} />, sub: 'Average Order Basket' },
    { label: 'WA Direct Sales', value: fmtCurrency(stats?.whatsapp_sales), color: 'text-green-light', icon: <Package size={18} />, sub: 'From Parsed Chat Orders' },
  ]

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Ecom Finance Intelligence</h1>
          <p className="text-sm text-text2 uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
            <BarChart3 size={14} className="text-blue" />
            Cross-platform financial performance & profit bridges
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-bg2 p-1 rounded-2xl border border-border shadow-inner shrink-0">
            {['week', 'month', '3month'].map(p => (
              <button 
                key={p} 
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  period === p ? 'bg-bg text-white shadow-xl ring-1 ring-white/5' : 'text-text3 hover:text-text2'
                }`} 
                onClick={() => setPeriod(p)}
              >
                {p === 'week' ? 'Weekly' : p === 'month' ? 'Monthly' : 'Quarterly'}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchStats} 
            className="p-3 bg-bg2 border border-border rounded-2xl text-text3 hover:text-white transition-all active:scale-95 shadow-xl shadow-black/20"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Modern KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {topStats.map((s, i) => (
          <div key={i} className="bg-bg2 border border-border p-8 rounded-[2.5rem] relative group overflow-hidden shadow-sm">
             <div className="flex justify-between items-start mb-6">
               <span className="text-[10px] font-black text-text3 uppercase tracking-[0.2em]">{s.label}</span>
               <div className="w-10 h-10 rounded-2xl bg-bg3 flex items-center justify-center text-text2 group-hover:text-white transition-colors border border-border/50">
                  {s.icon}
               </div>
             </div>
             <div className={`text-2xl font-black tracking-tighter mb-2 ${s.color}`}>
                {loading ? <div className="h-8 w-32 bg-white/5 animate-pulse rounded-lg" /> : s.value}
             </div>
             <p className="text-[10px] font-bold text-text3 uppercase tracking-wider italic opacity-40">{s.sub}</p>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 group-hover:bg-blue/20 transition-all" />
          </div>
        ))}
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        {/* Sales Channel Mix (Donut) */}
        <div className="bg-bg2 border border-border rounded-[3rem] p-10 shadow-2xl overflow-hidden relative group">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                 <PieIcon size={18} />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-widest">Revenue Mix by Origin</h3>
           </div>
           
           <div className="h-[240px] w-full relative">
              {stats?.web_sales || stats?.whatsapp_sales ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={platformData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={70} 
                      outerRadius={100} 
                      dataKey="value" 
                      paddingAngle={8}
                      className="outline-none"
                    >
                      {platformData.map((_, i) => <Cell key={i} fill={COLORS[i]} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0a0a0b', border: '1px solid #27272a', borderRadius: '16px', fontSize: '11px', fontWeight: '900', color: '#fff', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}
                      formatter={v => [fmtCurrency(v)]}
                      cursor={{ fill: 'transparent' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                   <p className="text-xs font-bold text-text3 opacity-40 italic">Awaiting synchronized data streams...</p>
                </div>
              )}
           </div>

           <div className="grid grid-cols-2 gap-4 mt-4">
              {platformData.map((d, i) => (
                <div key={i} className="bg-bg p-4 rounded-2xl border border-border/50 flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-[10px] font-black text-text3 uppercase tracking-widest leading-none">{d.name}</span>
                   </div>
                   <p className="text-sm font-black text-white tabular-nums">{fmtCurrency(d.value)}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Revenue Velocity (Bar Chart) */}
        <div className="bg-bg2 border border-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-blue/10 flex items-center justify-center text-blue border border-blue/20">
                 <TrendingUp size={18} />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-widest">Growth Velocity Trend</h3>
           </div>

           <div className="h-[280px] w-full">
             {stats?.weekly?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.weekly} barSize={24}>
                   <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                   <XAxis 
                     dataKey="label" 
                     tick={{ fontSize: 10, fill: '#71717a', fontWeight: '900' }} 
                     axisLine={false} 
                     tickLine={false} 
                     dy={12}
                   />
                   <Tooltip
                     contentStyle={{ background: '#0a0a0b', border: '1px solid #27272a', borderRadius: '16px', fontSize: '11px', color: '#fff', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}
                     formatter={v => [fmtCurrency(v)]}
                     cursor={{ fill: '#ffffff08', radius: 10 }}
                   />
                   <Bar 
                    dataKey="total" 
                    fill="#60a5fa" 
                    radius={[8, 8, 4, 4]} 
                    className="hover:fill-white transition-all cursor-pointer"
                   />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center">
                   <p className="text-xs font-bold text-text3 opacity-40 italic">Aggregating historical velocity metrics...</p>
                </div>
             )}
           </div>
        </div>
      </div>

      {/* High-Impact Profit Bridge Section */}
      <div className="bg-bg2 border border-border rounded-[3rem] p-12 shadow-3xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue/5 rounded-full blur-[100px] pointer-events-none" />
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue rounded-full" /> Financial Liquidity Bridge — Ecom → Ledger
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            { label: 'Aggregated Sales', value: fmtCurrency(stats?.total_sales), note: 'Gross Collection Pool', color: 'text-green-light', icon: <ShoppingBag size={14} /> },
            { label: 'Logistics Burn', value: fmtCurrency(stats?.total_courier_fees || 0), note: 'Carrier & Shipping Tolls', color: 'text-red-light', icon: <Truck size={14} /> },
            { label: 'COGS Injection', value: fmtCurrency(stats?.total_product_cost || 0), note: 'Direct Product Overhead', color: 'text-yellow-light', icon: <Package size={14} /> },
            { label: 'Net Liquidity', value: fmtCurrency(stats?.total_profit), note: 'Residual Enterprise Profit', color: 'text-blue', icon: <TrendingUp size={14} /> },
          ].map((item, idx) => (
            <div key={idx} className="bg-bg3 border border-border/50 p-8 rounded-[2rem] hover:-translate-y-1 transition-all group shadow-sm">
               <div className={`flex items-center gap-2 mb-4 opacity-50 group-hover:opacity-100 transition-opacity ${item.color}`}>
                  {item.icon}
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
               </div>
               <p className={`text-2xl font-black tracking-tighter mb-2 ${item.color}`}>
                 {loading ? <div className="h-8 w-24 bg-white/5 animate-pulse rounded-lg" /> : item.value}
               </p>
               <p className="text-[10px] font-bold text-text3 uppercase italic leading-tight tracking-tight opacity-40">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 bg-blue-bg/10 rounded-2xl border border-blue-500/10 flex gap-4 items-start animate-in slide-in-from-bottom-4 duration-1000 delay-500">
           <Info className="shrink-0 text-blue mt-0.5" size={16} />
           <p className="text-[11px] font-extrabold text-text2 uppercase tracking-wide leading-relaxed italic opacity-80">
             KORA Intelligence: Delivered manifests automatically inject income entries into your Master Khata. Logistics bookings trigger corresponding overhead expense logging in real-time.
           </p>
        </div>
      </div>
    </div>
  )
}

function Info({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
