import axios from 'axios'
import { supabase } from '../lib/supabase'

const API = import.meta.env.VITE_API_URL

/**
 * Helper to get the current session token
 */
export const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token
}

/**
 * API Service for Ledger operations
 */
export const ledgerService = {
  getSummary: async (businessId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/ledger/${businessId}/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  list: async (businessId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/ledger/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data || []
  },
  create: async (businessId, entryData) => {
    const token = await getAuthToken()
    const { data } = await axios.post(`${API}/api/ledger/${businessId}`, entryData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  delete: async (id) => {
    const token = await getAuthToken()
    await axios.delete(`${API}/api/ledger/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return true
  },
  getRecent: async (businessId, limit = 5) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/ledger/${businessId}?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return (data || []).slice(0, limit)
  }
}

/**
 * API Service for Cash operations
 */
export const cashService = {
  getBalance: async (businessId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/cash/${businessId}/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  list: async (businessId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/cash/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data || []
  },
  add: async (businessId, entryData) => {
    const token = await getAuthToken()
    const { data } = await axios.post(`${API}/api/cash/${businessId}`, entryData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  }
}

/**
 * API Service for Party/Contact operations
 */
export const partyService = {
  getTop: async (businessId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/parties/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return (data || []).slice(0, 5)
  },
  list: async (businessId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/parties/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data || []
  },
  create: async (businessId, partyData) => {
    const token = await getAuthToken()
    const { data } = await axios.post(`${API}/api/parties/${businessId}`, partyData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  getLedger: async (partyId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/parties/ledger/${partyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data || { entries: [], summary: {} }
  }
}

/**
 * API Service for Business operations
 */
export const businessService = {
  list: async (userId) => {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', userId)
    return data || []
  }
}

/**
 * API Service for Ecommerce (WooCommerce) operations
 */
export const ecomService = {
  getStore: async (businessId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/woocommerce/store/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  testConnection: async (config) => {
    const token = await getAuthToken()
    const { data } = await axios.post(`${API}/api/woocommerce/test`, config, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  connectStore: async (businessId, config) => {
    const token = await getAuthToken()
    await axios.post(`${API}/api/woocommerce/connect/${businessId}`, config, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return true
  },
  detachStore: async (businessId) => {
    const token = await getAuthToken()
    await axios.delete(`${API}/api/woocommerce/store/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return true
  },
  listOrders: async (businessId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/woocommerce/orders/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data || []
  },
  syncOrders: async (businessId) => {
    const token = await getAuthToken()
    await axios.post(`${API}/api/woocommerce/sync/${businessId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return true
  },
  cancelOrder: async (orderId) => {
    const token = await getAuthToken()
    await axios.post(`${API}/api/woocommerce/cancel/${orderId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return true
  }
}

/**
 * API Service for Shipment operations
 */
export const shipmentService = {
  list: async (businessId) => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/shipments/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data || []
  },
  getSummary: async (businessId, period = 'month') => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/ecom/summary/${businessId}?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  }
}
/**
 * API Service for WhatsApp Parsing operations
 */
export const whatsappService = {
  parse: async (text) => {
    const token = await getAuthToken()
    const { data } = await axios.post(`${API}/api/whatsapp/parse`, { text }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  pushOrder: async (orderData) => {
    const token = await getAuthToken()
    await axios.post(`${API}/api/whatsapp/push-order`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return true
  }
}

/**
 * API Service for Admin / Management operations
 */
export const adminService = {
  getStats: async () => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data
  },
  listUsers: async () => {
    const token = await getAuthToken()
    const { data } = await axios.get(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return data || []
  },
  blockUser: async (userId) => {
    const token = await getAuthToken()
    await axios.patch(`${API}/api/admin/users/${userId}/block`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return true
  },
  unblockUser: async (userId) => {
    const token = await getAuthToken()
    await axios.patch(`${API}/api/admin/users/${userId}/unblock`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return true
  }
}
