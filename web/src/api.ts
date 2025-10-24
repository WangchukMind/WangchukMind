import axios from 'axios'
import { useAuthStore } from './stores/auth'

const http = axios.create()

http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers = config.headers || {}
    ;(config.headers as any).Authorization = `Bearer ${auth.token}`
  }
  return config
})

http.interceptors.response.use((res) => res, (err) => {
  if (err?.response?.status === 401) {
    useAuthStore().logout()
  }
  return Promise.reject(err)
})

export const api = {
  sendSmsCode(phoneNumber: string) {
    return http.post('/api/auth/sms/send', { phoneNumber }).then(r => r.data)
  },
  smsLogin(phoneNumber: string, code: string) {
    return http.post('/api/auth/sms/login', { phoneNumber, code }).then(r => r.data)
  },
  getConversations() {
    return http.get('/v1/conversations').then(r => r.data)
  },
  createConversation(name: string) {
    return http.post('/v1/conversations', { name }).then(r => r.data)
  },
  deleteConversation(id: string) {
    return http.delete(`/v1/conversations/${id}`).then(r => r.data)
  },
  renameConversation(id: string, name: string) {
    return http.post(`/v1/conversations/${id}/name`, { name }).then(r => r.data)
  },
  sseChat(body: any) {
    const headers: any = { 'Content-Type': 'application/json', Accept: 'text/event-stream' }
    const auth = useAuthStore()
    if (auth.token) headers.Authorization = `Bearer ${auth.token}`
    return fetch('/v1/chat-messages', {
      method: 'POST', headers, body: JSON.stringify(body)
    })
  },
  stopMessage(id: string, user?: string) {
    return http.post(`/v1/chat-messages/${id}/stop`, { user }).then(r => r.data)
  },
  suggested(id: string, user?: string) {
    return http.get(`/v1/messages/${id}/suggested`, { params: user ? { user } : undefined }).then(r => r.data)
  }
}
