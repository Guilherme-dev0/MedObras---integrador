import axios from "axios"
const baseURL = (import.meta.env && import.meta.env.VITE_API_URL) || "https://medobras-integrador.onrender.com"
const api = axios.create({ baseURL })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      localStorage.removeItem("token")
      window.location.href = "/"
    }
    return Promise.reject(error)
  }
)
export default api
