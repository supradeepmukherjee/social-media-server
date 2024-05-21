import cp from 'cookie-parser'
import cors from 'cors'
import { config } from 'dotenv'
import express, { json, urlencoded } from 'express'
import { isAuthenticated } from './middlewares/auth.js'
import { errorMiddleware } from './middlewares/error.js'
import post from './routes/post.js'
import user from './routes/user.js'
const app = express()

if (process.env.NODE_ENV !== 'production') config({ path: 'config/config.env' })

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        process.env.CLIENT_URL
    ],
    credentials: true
}))

// using middlewares
app.use(json({ limit: '50mb' }))
app.use(urlencoded({ limit: '50mb', extended: true })) // learn about this, we can also use body parser package
app.use(cp())

// using routes
app.use('/api/v1/user', user)

app.use(isAuthenticated)
app.use('/api/v1/post', post)

app.use(errorMiddleware)

export default app