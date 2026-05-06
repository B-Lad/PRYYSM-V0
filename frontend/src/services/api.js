// Base API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Simple in-memory cache for GET requests: { key: { data, timestamp } }
const _apiCache = {};
const CACHE_TTL_MS = 30_000; // 30 seconds stale-while-revalidate

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKey(endpoint, token) {
    return `${token || 'anon'}:${endpoint}`;
}

function getCached(key) {
    const entry = _apiCache[key];
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS * 2) {
        // Hard expired (> 60s), remove
        delete _apiCache[key];
        return null;
    }
    return { data: entry.data, stale: age > CACHE_TTL_MS };
}

function setCached(key, data) {
    _apiCache[key] = { data, timestamp: Date.now() };
}

// Helper for API requests
async function fetchApi(endpoint, options = {}, retries = 2) {
    const url = `${API_URL}${endpoint}`;
    const isGet = !options.method || options.method === 'GET';
    const token = localStorage.getItem('access_token');
    const key = cacheKey(endpoint, token);

    // For GET requests: return cached data immediately if available, then refresh in background
    if (isGet) {
        const cached = getCached(key);
        if (cached && !cached.stale) {
            // Cache is fresh — return immediately without network call
            return cached.data;
        }
        if (cached && cached.stale) {
            // Cache is stale — return immediately, but trigger background refresh
            refreshInBackground(url, options, token, key);
            return cached.data;
        }
    }

    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };

    // Add Auth Token if available
    if (token) config.headers['Authorization'] = `Bearer ${token}`;

    let lastError;
    let lastStatus;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw Object.assign(new Error(errorBody.detail || `API Error: ${response.status} ${response.statusText}`), { status: response.status });
            }
            const data = await response.json();
            if (isGet) {
                setCached(key, data);
            } else {
                invalidateCache();
            }
            return data;
        } catch (err) {
            lastError = err;
            lastStatus = err.status;
            if (err.message.startsWith('API Error:')) throw err;
            if (attempt < retries) {
                await sleep(2000);
            }
        }
    }
    if (lastStatus === 401) {
        throw new Error("Incorrect password. Please try again.");
    }
    console.error('[API Debug] Origin:', window.location.origin, '| API URL:', API_URL, '| Error:', lastError);
    throw new Error(`Network error reaching API at ${API_URL}.\n\nCommon causes:\n1. CORS: Your domain (${window.location.origin}) is not in the backend allowlist.\n2. Render cold start: Backend is waking up — wait 30s and refresh.\n3. Wrong API URL: Check VITE_API_URL env var in Vercel.\n\nOpen browser Console (F12) for details.`);
}

function refreshInBackground(url, options, token, key) {
    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    fetch(url, config)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setCached(key, data); })
        .catch(() => {});
}

function invalidateCache() {
    Object.keys(_apiCache).forEach(k => delete _apiCache[k]);
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
