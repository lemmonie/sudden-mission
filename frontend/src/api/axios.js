import axios from 'axios'

const api = axios.create({
  baseURL: 'https://sudden-mission-backend.onrender.com/api',
})

// before sending request，auto add Header into  token.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api