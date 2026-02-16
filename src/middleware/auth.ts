import {
	Request,
	Response,
	NextFunction
} from 'express'
import jwt from 'jsonwebtoken'

import { USER_ROLE } from '../utils/enums'

const JWT_SECRET = process.env.JWT_SECRET || 'LOCAL-SECRET-CHANGE-ME'

export interface AuthenticatedRequest extends Request {
	user?: {
		id: number
		role: USER_ROLE
		email: string
	}
}

const buildResponse = (data: any, message: string) => ({
	data,
	message
})

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json(buildResponse({}, 'Authentication token missing'))
	}

	const token = authHeader.split(' ')[1]

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as {
			id: number
			role: USER_ROLE
			email: string
		}

		req.user = {
			id: decoded.id,
			role: decoded.role,
			email: decoded.email
		}

		return next()
	} catch (error) {
		console.error('JWT verification failed', error)
		return res.status(401).json(buildResponse({}, 'Invalid or expired token'))
	}
}

export const authorizeRoles = (...allowedRoles: USER_ROLE[]) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json(buildResponse({}, 'Authentication required'))
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res.status(403).json(buildResponse({}, 'Forbidden'))
		}

		return next()
	}
}

