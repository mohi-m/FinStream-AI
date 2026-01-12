import { auth } from '@/lib/firebase/firebase'
import type { ErrorResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export class ApiError extends Error {
  status: number
  
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser
  if (!user) {
    throw new ApiError('User not authenticated', 401)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Firebase-UID': user.uid,
  }

  try {
    const token = await user.getIdToken()
    headers['Authorization'] = `Bearer ${token}`
  } catch {
    // Token retrieval failed, but we still have UID
    console.warn('Failed to get ID token, using UID only')
  }

  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      // Sign out and redirect on 401
      await auth.signOut()
      window.location.href = '/'
      throw new ApiError('Session expired', 401)
    }

    let errorMessage = 'An error occurred'
    try {
      const errorData: ErrorResponse = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }
    
    throw new ApiError(errorMessage, response.status)
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

export async function apiGet<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const headers = await getAuthHeaders()
  
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  })

  return handleResponse<T>(response)
}

export async function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  return handleResponse<T>(response)
}

export async function apiPut<T>(endpoint: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  return handleResponse<T>(response)
}

export async function apiDelete<T = void>(endpoint: string): Promise<T> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers,
  })

  return handleResponse<T>(response)
}

// Public endpoints (no auth required)
export async function apiGetPublic<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return handleResponse<T>(response)
}
