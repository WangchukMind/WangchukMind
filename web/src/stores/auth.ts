import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false,
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null') as any
  }),
  actions: {
    login(token: string, userInfo: any) {
      this.token = token
      this.userInfo = userInfo
      this.isLoggedIn = true
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    logout() {
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },
    init() {
      this.isLoggedIn = !!this.token
    }
  }
})
