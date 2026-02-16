import {
	Router,
	Request,
	Response,
	NextFunction
} from 'express'
import {
	body,
	param
} from 'express-validator'

import { models } from '../db'
import { EXERCISE_DIFFICULTY, USER_ROLE } from '../utils/enums'
import { authenticateJWT, authorizeRoles } from '../middleware/auth'
import {
	buildResponse,
	handleValidationResult
} from '../utils/http'

const router = Router()

const {
	Exercise,
	Program
} = models

export default () => {
	router.get('/', async (_req: Request, res: Response, _next: NextFunction): Promise<any> => {
		const exercises = await Exercise.findAll({
			include: [{
				model: Program
			}]
		})

		return res.json(buildResponse(exercises, 'List of exercises'))
	})

	router.post(
		'/',
		authenticateJWT,
		authorizeRoles(USER_ROLE.ADMIN),
		[
			body('name').trim().notEmpty().withMessage('Name is required'),
			body('difficulty').isIn(Object.values(EXERCISE_DIFFICULTY)).withMessage('Invalid difficulty'),
			body('programID').optional().isInt({ min: 1 }).withMessage('programID must be a positive integer')
		],
		async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const {
				name,
				difficulty,
				programID
			} = req.body

			try {
				if (programID) {
					const program = await Program.findByPk(programID)
					if (!program) {
						return res.status(404).json(buildResponse({}, 'Program not found'))
					}
				}

				const exercise = await Exercise.create({
					name,
					difficulty,
					programID: programID ?? null
				})

				return res.status(201).json(buildResponse(exercise, 'Exercise created'))
			} catch (error) {
				console.error('Error creating exercise', error)
				return res.status(500).json(buildResponse({}, 'Something went wrong'))
			}
		}
	)

	router.put(
		'/:id',
		authenticateJWT,
		authorizeRoles(USER_ROLE.ADMIN),
		[
			param('id').isInt({ min: 1 }).withMessage('Exercise id must be a positive integer'),
			body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
			body('difficulty').optional().isIn(Object.values(EXERCISE_DIFFICULTY)).withMessage('Invalid difficulty'),
			body('programID').optional().isInt({ min: 1 }).withMessage('programID must be a positive integer')
		],
		async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const exerciseId = Number(req.params.id)
			const {
				name,
				difficulty,
				programID
			} = req.body

			try {
				const exercise = await Exercise.findByPk(exerciseId)
				if (!exercise) {
					return res.status(404).json(buildResponse({}, 'Exercise not found'))
				}

				if (programID) {
					const program = await Program.findByPk(programID)
					if (!program) {
						return res.status(404).json(buildResponse({}, 'Program not found'))
					}
				}

				const currentProgramID = (exercise as any).programID

				await exercise.update({
					name: name ?? exercise.name,
					difficulty: difficulty ?? exercise.difficulty,
					programID: programID ?? currentProgramID
				})

				return res.json(buildResponse(exercise, 'Exercise updated'))
			} catch (error) {
				console.error('Error updating exercise', error)
				return res.status(500).json(buildResponse({}, 'Something went wrong'))
			}
		}
	)

	router.delete(
		'/:id',
		authenticateJWT,
		authorizeRoles(USER_ROLE.ADMIN),
		[
			param('id').isInt({ min: 1 }).withMessage('Exercise id must be a positive integer')
		],
		async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const exerciseId = Number(req.params.id)

			try {
				const exercise = await Exercise.findByPk(exerciseId)
				if (!exercise) {
					return res.status(404).json(buildResponse({}, 'Exercise not found'))
				}

				await exercise.destroy()

				return res.json(buildResponse({}, 'Exercise deleted'))
			} catch (error) {
				console.error('Error deleting exercise', error)
				return res.status(500).json(buildResponse({}, 'Something went wrong'))
			}
		}
	)

	return router
}
