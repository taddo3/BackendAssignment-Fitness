import {
	Request,
	Response,
	NextFunction
} from 'express'
import jwt from 'jsonwebtoken'
import { buildResponse } from '../utils/http'
import { LocalizedRequest } from '../utils/localization'
import { logError } from '../utils/logger'

import { USER_ROLE } from '../utils/enums'

const JWT_SECRET = process.env.JWT_SECRET || 'LOCAL-SECRET-CHANGE-ME'

export interface AuthenticatedRequest extends LocalizedRequest {
	user?: {
		id: number
		role: USER_ROLE
		email: string
	}
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		res.status(401).json(buildResponse(req, {}, 'Authentication token missing'))
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
		logError(error, 'JWT verification failed', {
			req: {
				method: req.method,
				url: req.url
			}
		})
		res.status(401).json(buildResponse(req as LocalizedRequest, {}, 'Invalid or expired token'))
		return
	}
}

export const authorizeRoles = (...allowedRoles: USER_ROLE[]) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			res.status(401).json(buildResponse(req as LocalizedRequest, {}, 'Authentication required'))
			return
		}

		if (!allowedRoles.includes(req.user.role)) {
			res.status(403).json(buildResponse(req as LocalizedRequest, {}, 'Forbidden'))
			return
		}

		next()
		return
	}
}

