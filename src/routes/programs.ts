import {
	Router,
	Request,
	Response,
	NextFunction
} from 'express'
import { param } from 'express-validator'

import { models } from '../db'
import { USER_ROLE } from '../utils/enums'
import { authenticateJWT, authorizeRoles } from '../middleware/auth'
import {
	buildResponse,
	handleValidationResult
} from '../utils/http'

const router = Router()

const {
	Program,
	Exercise
} = models

export default () => {
	router.get('/', async (_req: Request, res: Response, _next: NextFunction): Promise<any> => {
		const programs = await Program.findAll()
		return res.json(buildResponse(programs, 'List of programs'))
	})

	router.post(
		'/:programId/exercises/:exerciseId',
		authenticateJWT,
		authorizeRoles(USER_ROLE.ADMIN),
		[
			param('programId').isInt({ min: 1 }).withMessage('Program id must be a positive integer'),
			param('exerciseId').isInt({ min: 1 }).withMessage('Exercise id must be a positive integer')
		],
		async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const programId = Number(req.params.programId)
			const exerciseId = Number(req.params.exerciseId)

			try {
				const program = await Program.findByPk(programId)
				if (!program) {
					return res.status(404).json(buildResponse({}, 'Program not found'))
				}

				const exercise = await Exercise.findByPk(exerciseId)
				if (!exercise) {
					return res.status(404).json(buildResponse({}, 'Exercise not found'))
				}

				await exercise.update({
					programID: programId
				})

				return res.json(buildResponse(exercise, 'Exercise added to program'))
			} catch (error) {
				console.error('Error adding exercise to program', error)
				return res.status(500).json(buildResponse({}, 'Something went wrong'))
			}
		}
	)

	router.delete(
		'/:programId/exercises/:exerciseId',
		authenticateJWT,
		authorizeRoles(USER_ROLE.ADMIN),
		[
			param('programId').isInt({ min: 1 }).withMessage('Program id must be a positive integer'),
			param('exerciseId').isInt({ min: 1 }).withMessage('Exercise id must be a positive integer')
		],
		async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const programId = Number(req.params.programId)
			const exerciseId = Number(req.params.exerciseId)

			try {
				const exercise = await Exercise.findByPk(exerciseId)
				const currentProgramID = Number(exercise?.programID)
				if (!exercise || currentProgramID !== programId) {
					return res.status(404).json(buildResponse({}, 'Exercise not found in given program'))
				}

				await exercise.update({
					programID: null
				})

				return res.json(buildResponse(exercise, 'Exercise removed from program'))
			} catch (error) {
				console.error('Error removing exercise from program', error)
				return res.status(500).json(buildResponse({}, 'Something went wrong'))
			}
		}
	)

	return router
}
