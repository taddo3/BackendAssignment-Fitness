import {
	Request,
	Response,
	NextFunction
} from 'express'
import jwt from 'jsonwebtoken'
import { buildResponse } from '../utils/http'

import { USER_ROLE } from '../utils/enums'

const JWT_SECRET = process.env.JWT_SECRET || 'LOCAL-SECRET-CHANGE-ME'

export interface AuthenticatedRequest extends Request {
	user?: {
		id: number
		role: USER_ROLE
		email: string
	}
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		res.status(401).json(buildResponse({}, 'Authentication token missing'))
		return
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

		next()
		return
	} catch (error) {
		console.error('JWT verification failed', error)
		res.status(401).json(buildResponse({}, 'Invalid or expired token'))
		return
	}
}

export const authorizeRoles = (...allowedRoles: USER_ROLE[]) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			res.status(401).json(buildResponse({}, 'Authentication required'))
			return
		}

		if (!allowedRoles.includes(req.user.role)) {
			res.status(403).json(buildResponse({}, 'Forbidden'))
			return
		}

		next()
		return
	}
}

