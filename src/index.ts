import http from 'http'
import express from 'express'

import { sequelize } from './db'
import ProgramRouter from './routes/programs'
import ExerciseRouter from './routes/exercises'
import AuthRouter from './routes/auth'
import UsersRouter from './routes/users'
import UserExerciseRouter from './routes/userExercise'
import { responseSanitizer } from './middleware/sanitizeResponse'
import { languageMiddleware } from './middleware/language'
import { errorHandler } from './middleware/errorHandler'
import { logError } from './utils/logger'

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(languageMiddleware)
app.use(responseSanitizer)
app.use('/auth', AuthRouter())
app.use('/programs', ProgramRouter())
app.use('/exercises', ExerciseRouter())
app.use('/users', UsersRouter())
app.use('/user-exercises', UserExerciseRouter())

// Error handler must be last middleware
app.use(errorHandler)

const httpServer = http.createServer(app)

try {
    sequelize.sync()
} catch (error) {
    logError(error, 'Sequelize sync error')
}

httpServer.listen(8000).on('listening', () => console.log(`Server started at port ${8000}`))

export default httpServer
