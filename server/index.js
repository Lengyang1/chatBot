import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import fetch from 'node-fetch'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// Flexible CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman or server-to-server)
    if (!origin) return callback(null, true)

    // Allow if origin is in the allowed list
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`))
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(express.json())

// Chat route
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body
  console.log('[server] received body:', messages)

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  const apiKey = process.env.GROQ_API_KEY
  const apiUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions'

  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not set on server' })
  }

  try {
    // Normalize messages to always have role + content
    const payloadMessages = messages.map(m => ({
      role: m.role,
      content: m.content ?? m.text ?? ''
    }))

    const payload = {
      model: 'moonshotai/kimi-k2-instruct',
      messages: payloadMessages
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    console.log('[server] Groq response:', data)

    const reply = data?.choices?.[0]?.message?.content || 'No reply from Groq'
    res.json({ reply })
  } catch (err) {
    console.error('[server] error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.listen(port, () => console.log(`Server listening on ${port}`))
