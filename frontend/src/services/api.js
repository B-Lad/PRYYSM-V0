// Base API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper for API requests
async function fetchApi(endpoint, options = {}, retries = 2) {
    const url = `${API_URL}${endpoint}`;
    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };

    // Add Auth Token if available
    const token = localStorage.getItem('access_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.detail || `API Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        } catch (err) {
            lastError = err;
            // Only retry on network errors (not 4xx/5xx HTTP errors)
            if (err.message.startsWith('API Error:')) throw err;
            if (attempt < retries) {
                await sleep(2000); // Wait 2s before retry (Render cold start)
            }
        }
    }
    // eslint-disable-next-line no-console
    console.error('[API Debug] Origin:', window.location.origin, '| API URL:', API_URL, '| Error:', lastError);
    throw new Error(`Network error reaching API at ${API_URL}.\n\nCommon causes:\n1. CORS: Your domain (${window.location.origin}) is not in the backend allowlist.\n2. Render cold start: Backend is waking up — wait 30s and refresh.\n3. Wrong API URL: Check VITE_API_URL env var in Vercel.\n\nOpen browser Console (F12) for details.`);
}

export const api = {
    // Auth
    login: (data) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    getMe: () => fetchApi('/auth/me'),
    updateMe: (data) => fetchApi('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (data) => fetchApi('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
    setUserPassword: (id, data) => fetchApi(`/auth/users/${id}/set-password`, { method: 'POST', body: JSON.stringify(data) }),

    // Projects
    getProjects: () => fetchApi('/operations/projects'),
    createProject: (data) => fetchApi('/operations/projects', { method: 'POST', body: JSON.stringify(data) }),

    // Work Orders
    getWorkOrders: () => fetchApi('/operations/work-orders'),
    createWorkOrder: (data) => fetchApi('/operations/work-orders', { method: 'POST', body: JSON.stringify(data) }),

    // Machines
    getMachines: () => fetchApi('/operations/machines'),
    updateMachine: (id, data) => fetchApi(`/operations/machines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // Inventory
    getMaterials: () => fetchApi('/operations/inventory/materials'),
    createMaterial: (data) => fetchApi('/operations/inventory/materials', { method: 'POST', body: JSON.stringify(data) }),

    // Quality / NCR
    getNCRs: () => fetchApi('/operations/quality/ncr'),
    createNCR: (data) => fetchApi('/operations/quality/ncr', { method: 'POST', body: JSON.stringify(data) }),

    // Users & Admin
    getUsers: () => fetchApi('/auth/users'),
    createUser: (data) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id, data) => fetchApi(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // Tenants (Super Admin)
    createTenant: (data) => fetchApi('/admin/tenants', { method: 'POST', body: JSON.stringify(data) }),
    getTenants: () => fetchApi('/admin/tenants'),
    getTenant: (id) => fetchApi(`/admin/tenant/${id}`),
    updateTenant: (id, data) => fetchApi(`/admin/tenant/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getTenantUsers: (id) => fetchApi(`/admin/tenant/${id}/users`),
    resetCompanyPassword: (id, data) => fetchApi(`/admin/tenant/${id}/reset-password`, { method: 'POST', body: JSON.stringify(data) }),
    getCompanyProfile: () => fetchApi('/admin/company/profile'),
    getCompanyMembers: () => fetchApi('/admin/company/members'),
    getAccessOptions: () => fetchApi('/admin/access-options'),
    getMyPermissions: () => fetchApi('/permissions/my-permissions'),
};
