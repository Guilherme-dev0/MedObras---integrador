import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import clienteRoutes  from './routes/clienteRoutes.js'
import medicaoRoutes  from './routes/medicaoRoutes.js'
import relatorioRoutes from './routes/relatorioRoutes.js'
import empresaRoutes from './routes/empresaRoutes.js'
import enderecoRoutes from './routes/enderecoRoutes.js'
import produtoRoutes from './routes/produtoRoutes.js'
import passwwordRoutes from './routes/passwordRoutes.js';

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth', passwwordRoutes)
app.use('/clientes', clienteRoutes)
app.use('/medicoes', medicaoRoutes)
app.use('/relatorios', relatorioRoutes)
app.use('/empresas', empresaRoutes)
app.use('/enderecos', enderecoRoutes)
app.use('/produtos', produtoRoutes)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`))


