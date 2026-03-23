import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// 每次發請求前，自動把 token 加進 Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api