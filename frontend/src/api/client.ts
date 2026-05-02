const BASE_URL = import.meta.env.VITE_API_BASE_URL

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

let isRefreshing = false
let pendingRequests: Array<() => void> = []

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  })

  if (response.status === 401 && !endpoint.includes('/api/v1/auth/')) {
    return handle401<T>(endpoint, options)
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message ?? 'An error occurred')
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json()
}

async function handle401<T>(endpoint: string, options: RequestOptions): Promise<T> {
  if (isRefreshing) {
    // Queue this request until refresh completes
    return new Promise<T>((resolve, reject) => {
      pendingRequests.push(() => {
        request<T>(endpoint, options).then(resolve).catch(reject)
      })
    })
  }

  isRefreshing = true
  try {
    const refreshResponse = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (refreshResponse.ok) {
      // Drain queued requests
      pendingRequests.forEach((fn) => fn())
      pendingRequests = []
      return request<T>(endpoint, options)
    } else {
      // Refresh failed — force logout
      pendingRequests = []
      const { useAuthStore } = await import('@/store/authStore')
      useAuthStore.getState().logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
  } finally {
    isRefreshing = false
  }
}

export const apiClient = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { headers }),
  post: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', body, headers }),
  put: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PUT', body, headers }),
  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', headers }),
  patch: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PATCH', body, headers }),
}
