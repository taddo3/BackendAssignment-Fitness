import {
	Router,
	Request,
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
	getUserByIdValidation,
	updateUserValidation
} from '../utils/validation'

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
				logError(error, 'Error listing users', {
					req: {
						method: req.method,
						url: req.url
					}
				})
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
				logError(error, 'Error getting own profile', {
					req: {
						method: req.method,
						url: req.url
					}
				})
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	router.get(
		'/:id',
		authenticateJWT,
		authorizeRoles(USER_ROLE.ADMIN),
		getUserByIdValidation,
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
				logError(error, 'Error getting user detail', {
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

	router.put(
		'/:id',
		authenticateJWT,
		authorizeRoles(USER_ROLE.ADMIN),
		updateUserValidation,
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
				logError(error, 'Error updating user', {
					req: {
						method: req.method,
						url: req.url,
						params: req.params,
						body: req.body
					}
				})
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	return router
}

