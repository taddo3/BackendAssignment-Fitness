import http from 'http'
import express from 'express'

import { sequelize } from './db'
import ProgramRouter from './routes/programs'
import ExerciseRouter from './routes/exercises'
import AuthRouter from './routes/auth'
import UsersRouter from './routes/users'
import UserExerciseRouter from './routes/userExercise'
import { responseSanitizer } from './middleware/sanitizeResponse'

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(responseSanitizer)
app.use('/auth', AuthRouter())
app.use('/programs', ProgramRouter())
app.use('/exercises', ExerciseRouter())
app.use('/users', UsersRouter())
app.use('/user-exercises', UserExerciseRouter())

const httpServer = http.createServer(app)

try {
    sequelize.sync()
} catch (error) {
    console.log('Sequelize sync error')
}

httpServer.listen(8000).on('listening', () => console.log(`Server started at port ${8000}`))

export default httpServer
