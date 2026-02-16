import {
	Router,
	Request,
	Response,
	NextFunction
} from 'express'
import {
	body,
	param,
	query
} from 'express-validator'
import { Op } from 'sequelize'

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
	router.get(
		'/',
		[
			query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
			query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
			query('programID').optional().isInt({ min: 1 }).withMessage('programID must be a positive integer'),
			query('search').optional().trim().notEmpty().withMessage('Search cannot be empty')
		],
		async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			try {
				const page = req.query.page ? Number(req.query.page) : 1
				const limit = req.query.limit ? Number(req.query.limit) : 10
				const programID = req.query.programID ? Number(req.query.programID) : undefined
				const search = req.query.search ? String(req.query.search).trim() : undefined

				const where: any = {}

				// Filter by programID
				if (programID) {
					where.programID = programID
				}

				// Full-text search on exercise name
				if (search) {
					where.name = {
						[Op.iLike]: `%${search}%`
					}
				}

				const offset = (page - 1) * limit

				// Get total count for pagination metadata
				const totalCount = await Exercise.count({ where })

				// Get paginated exercises
				const exercises = await Exercise.findAll({
					where,
					include: [{
						model: Program
					}],
					limit,
					offset,
					order: [['id', 'ASC']]
				})

				const totalPages = Math.ceil(totalCount / limit)

				return res.json(buildResponse(req, {
					exercises,
					pagination: {
						page,
						limit,
						totalCount,
						totalPages
					}
				}, 'List of exercises'))
			} catch (error) {
				console.error('Error listing exercises', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

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
						return res.status(404).json(buildResponse(req, {}, 'Program not found'))
					}
				}

				const exercise = await Exercise.create({
					name,
					difficulty,
					programID: programID ?? null
				})

				return res.status(201).json(buildResponse(req, exercise, 'Exercise created'))
			} catch (error) {
				console.error('Error creating exercise', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
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
					return res.status(404).json(buildResponse(req, {}, 'Exercise not found'))
				}

				if (programID) {
					const program = await Program.findByPk(programID)
					if (!program) {
						return res.status(404).json(buildResponse(req, {}, 'Program not found'))
					}
				}

				const currentProgramID = (exercise as any).programID

				await exercise.update({
					name: name ?? exercise.name,
					difficulty: difficulty ?? exercise.difficulty,
					programID: programID ?? currentProgramID
				})

				return res.json(buildResponse(req, exercise, 'Exercise updated'))
			} catch (error) {
				console.error('Error updating exercise', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
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
					return res.status(404).json(buildResponse(req, {}, 'Exercise not found'))
				}

				await exercise.destroy()

				return res.json(buildResponse(req, {}, 'Exercise deleted'))
			} catch (error) {
				console.error('Error deleting exercise', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	return router
}
