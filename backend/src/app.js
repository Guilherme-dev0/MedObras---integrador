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

app.use('/auth', passwwordRoutes)
app.use('/clientes', clienteRoutes)
app.use('/api/clientes', clienteRoutes)
app.use('/medicoes', medicaoRoutes)
app.use('/relatorios', relatorioRoutes)
app.use('/empresas', empresaRoutes)
app.use('/enderecos', enderecoRoutes)
app.use('/produtos', produtoRoutes)
export default app
