// Base API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Helper for API requests
async function fetchApi(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };

    // Add Auth Token if available
    const token = localStorage.getItem('access_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(url, config);
    } catch (err) {
        throw new Error(`Network error reaching API at ${API_URL}. Check Vercel env, Render URL, and backend CORS.`);
    }
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || `API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export const api = {
    // Auth
    login: (data) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    getMe: () => fetchApi('/auth/me'),
    changePassword: (data) => fetchApi('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

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
    resetCompanyPassword: (id) => fetchApi(`/admin/tenant/${id}/reset-password`, { method: 'POST' }),
    getCompanyProfile: () => fetchApi('/admin/company/profile'),
    getCompanyMembers: () => fetchApi('/admin/company/members'),
    getAccessOptions: () => fetchApi('/admin/access-options'),
    getMyPermissions: () => fetchApi('/permissions/my-permissions'),
};
