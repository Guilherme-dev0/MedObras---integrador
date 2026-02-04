import app from './app.js'
const DEFAULT_PORT = Number(process.env.PORT) || 8080
let currentPort = DEFAULT_PORT

function start(port) {
  try {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${port}`)
    })
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const fallback = port === DEFAULT_PORT ? port + 1 : 0
        console.warn(`⚠️ Porta ${port} em uso. Tentando porta ${fallback || 'aleatória'}.`)
        start(fallback)
      } else {
        console.error('Erro ao iniciar servidor:', err)
        process.exit(1)
      }
    })
  } catch (err) {
    console.error('Falha crítica ao iniciar servidor:', err)
    process.exit(1)
  }
}

start(currentPort)


