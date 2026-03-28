import axios from 'axios';

// API Base URL (configured via environment)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Request new token pair
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// Auth API
// ============================================

export const authApi = {
  login: async (tenant_id: string, user_id: string) => {
    const response = await api.post('/auth/token', { tenant_id, user_id });
    const { access_token, refresh_token } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  refreshToken: async (refresh_token: string) => {
    const response = await api.post('/auth/refresh', { refresh_token });
    const { access_token, refresh_token: newRefreshToken } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', newRefreshToken);
    return response.data;
  },

  validateToken: async (token: string) => {
    const response = await api.post('/auth/validate', { token });
    return response.data;
  },
};

// ============================================
// Tenants API
// ============================================

export const tenantsApi = {
  list: async () => {
    const response = await api.get('/tenants');
    return response.data;
  },

  get: async (tenant_id: string) => {
    const response = await api.get(`/tenants/${tenant_id}`);
    return response.data;
  },

  create: async (data: { company_id: string; agent_id: string; initial_credits?: number }) => {
    const response = await api.post('/tenants', data);
    return response.data;
  },

  update: async (tenant_id: string, data: any) => {
    const response = await api.put(`/tenants/${tenant_id}`, data);
    return response.data;
  },

  approve: async (tenant_id: string) => {
    const response = await api.post(`/tenants/${tenant_id}/approve`);
    return response.data;
  },

  suspend: async (tenant_id: string, reason: string) => {
    const response = await api.post(`/tenants/${tenant_id}/suspend`, { reason });
    return response.data;
  },

  getBalance: async (tenant_id: string) => {
    const response = await api.get(`/tenants/${tenant_id}/balance`);
    return response.data;
  },
};

// ============================================
// Credits API
// ============================================

export const creditsApi = {
  getBalance: async (tenant_id: string) => {
    const response = await api.get(`/credits/balance`);
    return response.data;
  },

  purchase: async (amount: number, metadata?: any) => {
    const response = await api.post('/credits/purchase', { amount, metadata });
    return response.data;
  },

  getTransactions: async (limit = 50, offset = 0, type?: string) => {
    const response = await api.get('/credits/transactions', {
      params: { limit, offset, type },
    });
    return response.data;
  },

  checkBalance: async (required_amount: number) => {
    const response = await api.post('/credits/check', { required_amount });
    return response.data;
  },
};

// ============================================
// Skills API
// ============================================

export const skillsApi = {
  list: async () => {
    const response = await api.get('/skills');
    return response.data;
  },

  get: async (skill_id: string) => {
    const response = await api.get(`/skills/${skill_id}`);
    return response.data;
  },

  getEntitlements: async () => {
    const response = await api.get('/skills/me/entitlements');
    return response.data;
  },

  checkEntitlement: async (skill_id: string) => {
    const response = await api.get(`/skills/me/entitlements/${skill_id}`);
    return response.data;
  },

  execute: async (skill_id: string, params: any, options?: any) => {
    const response = await api.post(`/skills/${skill_id}/execute`, {
      params,
      ...options,
    });
    return response.data;
  },

  getExecutions: async (limit = 50, offset = 0, skill_id?: string) => {
    const response = await api.get('/skills/me/executions', {
      params: { limit, offset, skill_id },
    });
    return response.data;
  },
};

// ============================================
// Types
// ============================================

export interface Tenant {
  tenant_id: string;
  company_id: string;
  agent_id: string;
  status: 'pending' | 'approved' | 'suspended' | 'terminated';
  credit_balance: number;
  created_at: string;
}

export interface Skill {
  skill_id: string;
  name: string;
  tier: 'starter' | 'professional' | 'enterprise';
  credit_cost: number;
  rate_limit: number;
  enabled: boolean;
}

export interface CreditBalance {
  tenant_id: string;
  credit_balance: number;
  credit_limit: number | null;
  available_credit: number;
}

export interface CreditTransaction {
  id: number;
  tenant_id: string;
  amount: number;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'adjustment';
  created_at: string;
}
