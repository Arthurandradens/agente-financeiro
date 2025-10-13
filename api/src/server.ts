import { createApp } from './app.js'
import { config } from './config/env.js'

async function start() {
  try {
    const app = await createApp()
    
    await app.listen({ 
      port: config.PORT, 
      host: '0.0.0.0' 
    })
    
    console.log(`🚀 Server running on http://localhost:${config.PORT}`)
    console.log(`📚 Docs available at http://localhost:${config.PORT}/docs`)
  } catch (error) {
    console.error('Error starting server:', error)
    process.exit(1)
  }
}

start()
