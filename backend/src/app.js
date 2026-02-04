import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import clienteRoutes  from './routes/clienteRoutes.js'
import medicaoRoutes  from './routes/medicaoRoutes.js'
import relatorioRoutes from './routes/relatorioRoutes.js'
import empresaRoutes from './routes/empresaRoutes.js'
import enderecoRoutes from './routes/enderecoRoutes.js'
import produtoRoutes from './routes/produtoRoutes.js'
import passwwordRoutes from './routes/passwordRoutes.js'
dotenv.config()
const app = express()
app.use(cors({ origin: ["https://medobras.vercel.app", "https://medobras-53f5bj99s-guilhermes-projects-3d57c3d9.vercel.app", "http://localhost:5173"] }))
app.use(express.json())

app.use('/api/auth', passwwordRoutes)
app.use('/api/clientes', clienteRoutes)
app.use('/api/medicoes', medicaoRoutes)
app.use('/api/relatorios', relatorioRoutes)
app.use('/api/empresas', empresaRoutes)
app.use('/api/enderecos', enderecoRoutes)
app.use('/api/produtos', produtoRoutes)
export default app
