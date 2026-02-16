import {
	Router,
	Response,
	NextFunction
} from 'express'
import { models } from '../db'
import { USER_ROLE } from '../utils/enums'
import {
	authenticateJWT,
	authorizeRoles,
	AuthenticatedRequest
} from '../middleware/auth'
import {
	buildResponse,
	handleValidationResult
} from '../utils/http'
import { logError } from '../utils/logger'
import {
	trackUserExerciseValidation,
	deleteUserExerciseValidation
} from '../utils/validation'

const router = Router()

const {
	Exercise,
	UserExercise
} = models

export default () => {
	router.get(
		'/',
		authenticateJWT,
		authorizeRoles(USER_ROLE.USER),
		async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<any> => {
			try {
				const userId = req.user.id

				const completed = await UserExercise.findAll({
					where: {
						userID: userId
					},
					include: [
						{
							model: Exercise,
							as: 'exercise'
						}
					]
				})

				return res.json(buildResponse(req, completed, 'List of completed exercises'))
			} catch (error) {
				logError(error, 'Error listing user exercises', {
					req: {
						method: req.method,
						url: req.url
					}
				})
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	router.post(
		'/',
		authenticateJWT,
		authorizeRoles(USER_ROLE.USER),
		trackUserExerciseValidation,
		async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const userId = req.user.id
			const {
				exerciseId,
				durationSeconds,
				completedAt
			} = req.body

			try {
				const exercise = await Exercise.findByPk(exerciseId)
				if (!exercise) {
					return res.status(404).json(buildResponse(req, {}, 'Exercise not found'))
				}

				const tracked = await UserExercise.create({
					userID: userId,
					exerciseID: exerciseId,
					durationSeconds,
					completedAt: completedAt ? new Date(completedAt) : new Date()
				})

				return res.status(201).json(buildResponse(req, tracked, 'Exercise tracked as completed'))
			} catch (error) {
				logError(error, 'Error tracking user exercise', {
					req: {
						method: req.method,
						url: req.url,
						body: req.body
					}
				})
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	router.delete(
		'/:id',
		authenticateJWT,
		authorizeRoles(USER_ROLE.USER),
		deleteUserExerciseValidation,
		async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const userId = req.user.id
			const userExerciseId = Number(req.params.id)

			try {
				const userExercise = await UserExercise.findByPk(userExerciseId)
				if (!userExercise) {
					return res.status(404).json(buildResponse(req, {}, 'User completed exercise not found'))
				}
				if (userExercise.userID !== userId) {
					return res.status(403).json(buildResponse(req, {}, 'User can remove only his own completed exercises'))
				}

				await userExercise.destroy()

				return res.json(buildResponse(req, {}, 'User exercise deleted'))
			} catch (error) {
				logError(error, 'Error deleting user exercise', {
					req: {
						method: req.method,
						url: req.url,
						params: req.params
					}
				})
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	return router
}

