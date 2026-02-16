import {
	Router,
	Request,
	Response,
	NextFunction
} from 'express'
import { body } from 'express-validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {
	buildResponse,
	handleValidationResult
} from '../utils/http'

import { models } from '../db'
import { USER_ROLE } from '../utils/enums'

const router = Router()

const {
	User
} = models

const JWT_SECRET = process.env.JWT_SECRET || 'LOCAL-SECRET-CHANGE-ME'
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN) || 12 * 60 * 60 * 1000 // 12 hours

interface RegisterBody {
	name: string
	surname: string
	nickName: string
	email: string
	age: number
	role: USER_ROLE
	password: string
}

interface LoginBody {
	email: string
	password: string
}

export default () => {
	router.post(
		'/register',
		[
			body('name').trim().notEmpty().withMessage('Name is required'),
			body('surname').trim().notEmpty().withMessage('Surname is required'),
			body('nickName').trim().notEmpty().withMessage('NickName is required'),
			body('email').trim().isEmail().withMessage('Email must be a valid email'),
			body('age').isInt({
				min: 0
			}).withMessage('Age must be a non-negative integer'),
			body('role').isIn(Object.values(USER_ROLE)).withMessage('Invalid role'),
			body('password').isLength({
				min: 6
			}).withMessage('Password must be at least 6 characters long')
		],
		async (req: Request<{}, any, RegisterBody>, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const {
				name,
				surname,
				nickName,
				email,
				age,
				role,
				password
			} = req.body

			try {
				const existing = await User.findOne({
					where: {
						email
					}
				})

				if (existing) {
					return res.status(400).json(buildResponse(req, {}, 'User with given email already exists'))
				}

				const saltRounds = 10
				const passwordHash = await bcrypt.hash(password, saltRounds)

				const createdUser = await User.create({
					name,
					surname,
					nickName,
					email,
					age,
					role,
					passwordHash
				})

				return res.status(201).json(buildResponse(req, createdUser, 'You have successfully registered'))
			} catch (error) {
				console.error('Error in register', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	router.post(
		'/login',
		[
			body('email').trim().isEmail().withMessage('Email must be a valid email'),
			body('password').notEmpty().withMessage('Password is required')
		],
		async (req: Request<{}, any, LoginBody>, res: Response, _next: NextFunction): Promise<any> => {
			if (!handleValidationResult(req, res)) {
				return
			}

			const {
				email,
				password
			} = req.body

			try {
				const user = await User.findOne({
					where: {
						email
					}
				})

				if (!user) {
					return res.status(401).json(buildResponse(req, {}, 'Invalid credentials'))
				}

				const isValid = await bcrypt.compare(password, user.passwordHash)

				if (!isValid) {
					return res.status(401).json(buildResponse(req, {}, 'Invalid credentials'))
				}

				const token = jwt.sign(
					{
						id: user.id,
						role: user.role,
						email: user.email
					},
					JWT_SECRET,
					{
						expiresIn: JWT_EXPIRES_IN
					}
				)

				return res.json(buildResponse(req, {
					token
				}, 'You have successfully logged in'))
			} catch (error) {
				console.error('Error in login', error)
				return res.status(500).json(buildResponse(req, {}, 'Something went wrong'))
			}
		}
	)

	return router
}

