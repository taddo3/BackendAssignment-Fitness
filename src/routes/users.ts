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

const router = Router()

const {
	User
} = models

export default () => {
	router.get(
		'/',
		authenticateJWT,
		async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<any> => {
			try {
				if (!req.user) {
					return res.status(401).json(buildResponse(req, {}, 'Authentication required'))
				}

				// ADMIN: full user data
				if (req.user.role === USER_ROLE.ADMIN) {
					const users = await User.findAll()
					return res.json(buildResponse(req, users, 'List of users'))
				}

				// USER: only id and nickName for all users
				if (req.user.role === USER_ROLE.USER) {
					const users = await User.findAll({
						attributes: ['id', 'nickName']
					})
					return res.json(buildResponse(req, users, 'List of users'))
				}

				// Any other role is forbidden
				return res.status(403).json(buildResponse(req, {}, 'Forbidden'))
			} catch (error) {
				console.error('Error listing users', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	router.get(
		'/me',
		authenticateJWT,
		authorizeRoles(USER_ROLE.USER),
		async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<any> => {
			try {
				const user = await User.findByPk(req.user.id, {
					attributes: ['name', 'surname', 'age', 'nickName']
				})
				if (!user) {
					return res.status(404).json(buildResponse(req, {}, 'User not found'))
				}

				return res.json(buildResponse(req, user, 'User profile'))
			} catch (error) {
				console.error('Error getting own profile', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	router.get(
		'/:id',
		authenticateJWT,
		authorizeRoles(USER_ROLE.ADMIN),
		[
			param('id').isInt({ min: 1 }).withMessage('User id must be a positive integer')
		],
		async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const userId = Number(req.params.id)

			try {
				const user = await User.findByPk(userId)
				if (!user) {
					return res.status(404).json(buildResponse(req, {}, 'User not found'))
				}

				return res.json(buildResponse(req, user, 'User detail'))
			} catch (error) {
				console.error('Error getting user detail', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	router.put(
		'/:id',
		authenticateJWT,
		authorizeRoles(USER_ROLE.ADMIN),
		[
			param('id').isInt({ min: 1 }).withMessage('User id must be a positive integer'),
			body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
			body('surname').optional().trim().notEmpty().withMessage('Surname cannot be empty'),
			body('nickName').optional().trim().notEmpty().withMessage('NickName cannot be empty'),
			body('age').optional().isInt({ min: 0 }).withMessage('Age must be a non-negative integer'),
			body('role').optional().isIn(Object.values(USER_ROLE)).withMessage('Invalid role')
		],
		async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const userId = Number(req.params.id)
			const {
				name,
				surname,
				nickName,
				age,
				role
			} = req.body

			try {
				const user = await User.findByPk(userId)
				if (!user) {
					return res.status(404).json(buildResponse(req, {}, 'User not found'))
				}

				await user.update({
					name: name ?? user.name,
					surname: surname ?? user.surname,
					nickName: nickName ?? user.nickName,
					age: age ?? user.age,
					role: role ?? user.role
				})

				return res.json(buildResponse(req, user, 'User updated'))
			} catch (error) {
				console.error('Error updating user', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	return router
}

